-- PRODUCTION SECURITY FIXES - CORRECTED VERSION

-- 1. Fix artisan directory view (without non-existent updated_at column)
CREATE OR REPLACE VIEW public.artisans_directory AS
SELECT 
  id,
  full_name,
  category,
  skill,
  city,
  photo_url,
  profile_url,
  slug,
  suspended,
  created_at
FROM public.artisans
WHERE suspended = false;

-- Grant access to the directory view
GRANT SELECT ON public.artisans_directory TO anon, authenticated;

-- 2. Fix the problematic public policy that exposes sensitive data
-- Replace it with a secure policy that denies access to sensitive fields by default
DROP POLICY IF EXISTS "Public can view business profiles only" ON public.artisans;

CREATE POLICY "Public directory access only via secure view" ON public.artisans
FOR SELECT TO anon, authenticated
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false  -- No direct table access for anonymous users
    WHEN auth.uid() = id THEN true      -- Artisans can see their own full data
    WHEN is_admin() THEN true           -- Admins can see all data
    WHEN EXISTS(
      SELECT 1 FROM bookings 
      WHERE ((artisan_id = artisans.id OR artisan_email = artisans.email) 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days')
    ) THEN true                         -- Clients with recent bookings can see contact info
    ELSE false                          -- Everyone else denied
  END
);

-- 3. Fix email queue security - completely restrict public access
DROP POLICY IF EXISTS "System processes only" ON public.email_notifications_queue;

-- Create a policy that only allows system functions (no public access)
CREATE POLICY "System functions only - no public access" ON public.email_notifications_queue
FOR ALL TO authenticated
USING (
  -- Only allow if user is admin (for monitoring purposes)
  is_admin()
)
WITH CHECK (
  -- Only admin can insert/update
  is_admin()
);

-- 4. Add audit logging for sensitive data access attempts
CREATE OR REPLACE FUNCTION public.log_artisan_access_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone tries to access artisan contact data
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.data_access_logs (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type,
      sensitive_fields,
      authorized
    ) VALUES (
      auth.uid(),
      'artisans',
      COALESCE(NEW.id, OLD.id),
      'view_attempt',
      ARRAY['email', 'phone'],
      CASE 
        WHEN NEW.id = auth.uid() THEN true
        WHEN is_admin() THEN true
        ELSE false
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create secure contact access function for legitimate use cases
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log access attempt
  INSERT INTO public.data_access_logs (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    sensitive_fields,
    authorized
  ) VALUES (
    auth.uid(),
    'artisans',
    p_artisan_id,
    'contact_access_attempt',
    ARRAY['email', 'phone'],
    CASE
      WHEN is_admin() THEN true
      WHEN p_artisan_id = auth.uid() THEN true
      WHEN EXISTS(
        SELECT 1 FROM public.bookings 
        WHERE artisan_id = p_artisan_id 
        AND client_email = auth.email()
        AND status IN ('pending', 'in_progress', 'completed')
        AND created_at > now() - INTERVAL '30 days'
      ) THEN true
      ELSE false
    END
  );

  -- Check authorization
  IF NOT (
    is_admin() OR
    p_artisan_id = auth.uid() OR
    EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = p_artisan_id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access artisan contact information';
  END IF;

  -- Return contact info if authorized
  RETURN QUERY
  SELECT a.email, a.phone, a.full_name
  FROM public.artisans a
  WHERE a.id = p_artisan_id;
END;
$function$;