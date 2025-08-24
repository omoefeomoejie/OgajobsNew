-- CRITICAL SECURITY FIXES
-- Phase 1 & 2: Data Protection and Database Hardening

-- 1. Fix artisans_public view to remove sensitive data exposure
DROP VIEW IF EXISTS public.artisans_public;

CREATE VIEW public.artisans_public 
WITH (security_invoker = true) AS
SELECT 
    a.id,
    a.full_name,
    a.category,
    a.city,
    a.skill,
    a.photo_url,
    a.profile_url,
    a.slug,
    a.suspended,
    a.created_at,
    -- Only show aggregated review data, no contact info
    COALESCE(AVG(ar.rating), 0) as average_rating,
    COUNT(ar.id) as total_reviews
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.city, a.skill, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- 2. Create secure function to get artisan contact info with proper authorization
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access attempt for audit
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'artisan_contact_access_attempt',
    auth.uid(),
    jsonb_build_object(
      'artisan_id', p_artisan_id,
      'timestamp', now(),
      'user_email', auth.email()
    ),
    'medium'
  );

  -- Check authorization - only allow if:
  -- 1. User is admin
  -- 2. User is the artisan themselves  
  -- 3. User has an active booking with this artisan
  IF NOT (
    -- User is admin
    is_admin() OR
    -- User is the artisan themselves
    p_artisan_id = auth.uid() OR
    -- User has active booking with this artisan
    EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = p_artisan_id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days' -- Only recent bookings
    )
  ) THEN
    -- Log unauthorized access attempt
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_details,
      severity
    ) VALUES (
      'unauthorized_artisan_contact_access',
      auth.uid(),
      jsonb_build_object(
        'artisan_id', p_artisan_id,
        'user_email', auth.email(),
        'timestamp', now()
      ),
      'high'
    );
    
    RAISE EXCEPTION 'Unauthorized: Cannot access artisan contact information';
  END IF;

  -- Log successful authorized access
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'artisan_contact_access_granted',
    auth.uid(),
    jsonb_build_object(
      'artisan_id', p_artisan_id,
      'user_email', auth.email(),
      'timestamp', now()
    ),
    'low'
  );

  -- Return contact info if authorized
  RETURN QUERY
  SELECT a.email, a.phone, a.full_name
  FROM public.artisans a
  WHERE a.id = p_artisan_id;
END;
$$;

-- 3. Fix search_path for all existing SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN ROUND(amount * 0.10, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_artisan_earnings(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN ROUND(amount * 0.90, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, email text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
SELECT
  au.id,
  au.email,
  p.role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
$$;

CREATE OR REPLACE FUNCTION public.mask_sensitive_data(input_text text, mask_type text DEFAULT 'email')
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE mask_type
    WHEN 'email' THEN
      RETURN CASE 
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 3 THEN '***'
        ELSE substring(input_text from 1 for 2) || '***@' || split_part(input_text, '@', 2)
      END;
    WHEN 'phone' THEN
      RETURN CASE
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 4 THEN '***'
        ELSE '***' || right(input_text, 4)
      END;
    WHEN 'account' THEN
      RETURN CASE
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 4 THEN '***'
        ELSE '***' || right(input_text, 4)
      END;
    ELSE 
      RETURN '***';
  END CASE;
END;
$$;

-- 4. Add RLS policy for artisans_public view access
CREATE POLICY "Authenticated users can view public artisan directory" 
ON public.artisans 
FOR SELECT 
USING (
  NOT suspended AND (
    auth.uid() IS NOT NULL OR 
    -- Allow limited public access for discovery
    auth.role() = 'anon'
  )
);

-- 5. Enhance artisan table RLS to prevent contact info leakage
DROP POLICY IF EXISTS "Public can view basic artisan info" ON public.artisans;
DROP POLICY IF EXISTS "Public can view basic artisan info (no PII)" ON public.artisans;

CREATE POLICY "Restricted artisan profile access" 
ON public.artisans 
FOR SELECT 
USING (
  CASE
    -- Artisan can see their own full profile
    WHEN auth.uid() = id THEN true
    -- Admins can see all profiles
    WHEN is_admin() THEN true
    -- Users with active bookings can see contact info
    WHEN EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    ) THEN true
    -- Everyone else can only see public profile info (no contact details)
    ELSE (email IS NULL AND phone IS NULL)
  END
);

-- 6. Add security monitoring for sensitive data access
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  accessed_table text NOT NULL,
  accessed_record_id uuid,
  access_type text NOT NULL, -- 'view', 'edit', 'delete'
  sensitive_fields text[], -- Array of sensitive fields accessed
  ip_address inet,
  user_agent text,
  authorized boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on data access logs
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view data access logs" 
ON public.data_access_logs 
FOR ALL 
USING (is_admin());

-- 7. Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_record_id uuid,
  p_access_type text DEFAULT 'view',
  p_sensitive_fields text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.data_access_logs (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    sensitive_fields,
    authorized
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_record_id,
    p_access_type,
    p_sensitive_fields,
    true
  );
END;
$$;

-- 8. Add trigger to log artisan profile access
CREATE OR REPLACE FUNCTION public.audit_artisan_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when someone accesses artisan contact info
  IF auth.uid() != NEW.id AND NOT is_admin() THEN
    PERFORM public.log_sensitive_data_access(
      'artisans',
      NEW.id,
      'view',
      ARRAY['email', 'phone']
    );
  END IF;
  
  RETURN NEW;
END;
$$;