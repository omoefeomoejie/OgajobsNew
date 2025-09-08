-- CRITICAL SECURITY FIXES FOR PRODUCTION READINESS

-- 1. Fix artisan table - remove public access to sensitive personal data
-- Drop the problematic public policy that exposes email/phone
DROP POLICY IF EXISTS "Public can view limited artisan business info" ON public.artisans;

-- Create a secure public view policy that only shows business information, no contact details
CREATE POLICY "Public can view business profiles only" ON public.artisans
FOR SELECT TO anon, authenticated
USING (
  suspended = false 
  AND (
    -- Show only business info (no email/phone) for directory listings
    SELECT COUNT(*) = 0 FROM information_schema.columns 
    WHERE table_name = 'artisans' 
    AND column_name IN ('email', 'phone') 
    AND table_schema = 'public'
    -- This policy will be handled by a secure view instead
  )
);

-- Create secure public artisan directory view (business info only)
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
  created_at,
  updated_at
FROM public.artisans
WHERE suspended = false;

-- Grant access to the directory view
GRANT SELECT ON public.artisans_directory TO anon, authenticated;

-- 2. Fix email queue - restrict to system access only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage email queue" ON public.email_notifications_queue;

-- Create secure system-only policy
CREATE POLICY "System processes only" ON public.email_notifications_queue
FOR ALL 
USING (false)  -- Deny all access by default
WITH CHECK (false);

-- 3. Fix function search paths for security
-- Update functions to have secure search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role(auth.uid()) = 'admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$function$;

-- 4. Create secure artisan contact access function
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow access if:
  -- 1. User is admin
  -- 2. User is the artisan themselves  
  -- 3. User has active booking with this artisan
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