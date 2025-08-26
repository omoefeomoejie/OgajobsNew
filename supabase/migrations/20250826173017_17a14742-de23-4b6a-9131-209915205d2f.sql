-- Fix Critical Security Issue #1: Secure the underlying artisans table
-- The artisans_directory is a view, so we need to secure the underlying artisans table

-- Update RLS policies on main artisans table to be more restrictive
DROP POLICY IF EXISTS "Secure artisan directory with contact protection" ON public.artisans;
DROP POLICY IF EXISTS "Secure artisan public directory access" ON public.artisans;

-- Create a more secure policy for artisan data access
CREATE POLICY "Secure artisan data access" 
ON public.artisans FOR SELECT 
USING (
  CASE
    -- Artisan can see their own full data
    WHEN (auth.uid() = id) THEN true
    -- Admins can see all data
    WHEN is_admin() THEN true
    -- Users with active bookings can see full contact info
    WHEN (EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > (now() - INTERVAL '30 days')
    )) THEN true
    -- Everyone else can only see non-suspended artisans with limited info
    -- We'll handle contact info filtering in the application layer
    ELSE (NOT suspended)
  END
);

-- Fix Critical Security Issue #2: Update security definer functions to be more secure
-- Update the get_artisans_directory function to be SECURITY INVOKER (safer)
CREATE OR REPLACE FUNCTION public.get_artisans_directory()
RETURNS TABLE(
  id uuid, 
  full_name text, 
  category text, 
  skill text, 
  city text, 
  photo_url text, 
  profile_url text, 
  slug text, 
  average_rating numeric, 
  total_reviews bigint, 
  suspended boolean, 
  created_at timestamp without time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $function$
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.skill,
  a.city,
  a.photo_url,
  a.profile_url,
  a.slug,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews,
  a.suspended,
  a.created_at
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;
$function$;

-- Update the artisans_directory view to exclude sensitive data by default
-- This view should only show public information
CREATE OR REPLACE VIEW public.artisans_directory AS
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.skill,
  a.city,
  a.photo_url,
  a.profile_url, 
  a.slug,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews,
  a.suspended,
  a.created_at
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- Create a secure function to get artisan contact info only for authorized users
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create secure public view for artisan directory that excludes ALL sensitive contact information
CREATE OR REPLACE VIEW public.artisans_public AS
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
WHERE NOT suspended;

-- Add a notification function to alert about artisan policy updates
CREATE OR REPLACE FUNCTION public.notify_artisan_policy_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- This function can be called to notify the application about policy changes
  PERFORM pg_notify('artisan_policies_updated', json_build_object(
    'message', 'Artisan table security policies have been updated',
    'timestamp', now(),
    'action', 'Use artisans_public view for public data access'
  )::text);
END;
$function$;

-- Call the notification function
SELECT public.notify_artisan_policy_update();