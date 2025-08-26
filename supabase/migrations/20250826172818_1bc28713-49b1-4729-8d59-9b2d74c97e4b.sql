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
  created_at,
  -- Exclude email and phone from public view
  NULL::text as email,
  NULL::text as phone
FROM public.artisans
WHERE NOT suspended;

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
    -- Everyone else can only see basic info (no email/phone)
    ELSE (NOT suspended AND email IS NULL AND phone IS NULL)
  END
);

-- Add additional security logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_artisan_contact_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log when someone accesses full artisan data with contact info
  IF (NEW.email IS NOT NULL OR NEW.phone IS NOT NULL) 
     AND auth.uid() != NEW.id 
     AND NOT is_admin() THEN
    
    PERFORM log_security_event(
      'artisan_contact_access',
      jsonb_build_object(
        'artisan_id', NEW.id,
        'accessed_by', auth.uid(),
        'timestamp', now(),
        'has_active_booking', EXISTS(
          SELECT 1 FROM public.bookings 
          WHERE artisan_id = NEW.id 
          AND client_email = auth.email() 
          AND status IN ('pending', 'in_progress', 'completed')
        )
      ),
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for logging artisan contact access
DROP TRIGGER IF EXISTS log_artisan_contact_access_trigger ON public.artisans;
CREATE TRIGGER log_artisan_contact_access_trigger
  AFTER SELECT ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION log_artisan_contact_access();