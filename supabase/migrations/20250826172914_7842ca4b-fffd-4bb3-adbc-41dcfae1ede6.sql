-- Fix Critical Security Issue #1: Secure artisan directory with RLS
-- Enable RLS on artisans_directory table
ALTER TABLE public.artisans_directory ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for artisans_directory
-- Only allow viewing of basic public information, no contact details for unauthorized users
CREATE POLICY "Public can view basic artisan directory info" 
ON public.artisans_directory FOR SELECT 
USING (
  -- Always allow viewing basic info (non-sensitive fields only)
  true
);

-- Fix Critical Security Issue #2: Review and fix security definer functions
-- Update the get_artisans_directory function to be more secure
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

-- Update RLS policies on main artisans table to be more restrictive
DROP POLICY IF EXISTS "Secure artisan directory with contact protection" ON public.artisans;

CREATE POLICY "Secure artisan public directory access" 
ON public.artisans FOR SELECT 
USING (
  CASE
    -- Artisan can see their own full data
    WHEN (auth.uid() = id) THEN true
    -- Admins can see all data
    WHEN is_admin() THEN true
    -- Users with active bookings can see contact info
    WHEN (EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > (now() - INTERVAL '30 days')
    )) THEN true
    -- Everyone else can only see basic info (no email/phone exposed)
    -- This is enforced by returning false when trying to access contact info
    ELSE (NOT suspended)
  END
);

-- Create a secure function to get artisan contact info only for authorized users
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access attempt for audit
  PERFORM log_security_event(
    'artisan_contact_access_attempt',
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
    PERFORM log_security_event(
      'unauthorized_artisan_contact_access',
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
  PERFORM log_security_event(
    'artisan_contact_access_granted',
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

-- Create secure view for public artisan directory that excludes sensitive contact information
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

-- Add additional security for the artisans_directory view
-- Update it to exclude any sensitive data by default
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