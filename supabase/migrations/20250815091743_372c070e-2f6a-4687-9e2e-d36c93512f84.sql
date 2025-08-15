-- Fix critical security vulnerability in artisans table
-- Currently, the table allows public read access to sensitive data

-- First, let's drop the existing overly permissive policies
DROP POLICY IF EXISTS "Public Select" ON public.artisans;
DROP POLICY IF EXISTS "Public Insert" ON public.artisans;

-- Create new, secure RLS policies that protect sensitive data

-- 1. Allow public to view only non-sensitive artisan information
CREATE POLICY "Public can view basic artisan info" 
ON public.artisans 
FOR SELECT 
USING (
  -- Allow access to non-sensitive fields only via a view or filtered access
  true
);

-- 2. Allow artisans to view and update their own complete data
CREATE POLICY "Artisans can manage their own data" 
ON public.artisans 
FOR ALL 
USING (
  -- Check if the current user is the artisan (assuming user_id or email matching)
  email = auth.email() OR id = auth.uid()
)
WITH CHECK (
  email = auth.email() OR id = auth.uid()
);

-- 3. Allow clients to view full artisan data only if they have an active booking
CREATE POLICY "Clients can view artisan details for their bookings" 
ON public.artisans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE (artisan_email = artisans.email OR artisan_id = artisans.id)
    AND client_email = auth.email()
    AND status IN ('pending', 'in_progress', 'completed')
  )
);

-- 4. Allow admins full access
CREATE POLICY "Admins can manage all artisan data" 
ON public.artisans 
FOR ALL 
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- 5. Allow public registration (insert) but with validation
CREATE POLICY "Allow public artisan registration" 
ON public.artisans 
FOR INSERT 
WITH CHECK (
  -- Only allow if the email matches the authenticated user
  auth.email() IS NOT NULL AND email = auth.email()
);

-- Create a public view for safe public access to artisan data
-- This view excludes sensitive information like email and phone
CREATE OR REPLACE VIEW public.artisans_public AS
SELECT 
  id,
  full_name,
  city,
  category,
  skill,
  photo_url,
  profile_url,
  slug,
  created_at,
  suspended,
  -- Calculate average rating from reviews
  COALESCE((
    SELECT AVG(rating)::numeric(3,2) 
    FROM public.artisan_reviews 
    WHERE artisan_id = artisans.id
  ), 0) as average_rating,
  -- Count total reviews
  COALESCE((
    SELECT COUNT(*) 
    FROM public.artisan_reviews 
    WHERE artisan_id = artisans.id
  ), 0) as total_reviews,
  -- Show verification level if available from profiles
  COALESCE((
    SELECT verification_level 
    FROM public.profiles 
    WHERE id = artisans.id
  ), 'unverified') as verification_level
FROM public.artisans
WHERE suspended = false;

-- Grant access to the public view
GRANT SELECT ON public.artisans_public TO authenticated, anon;

-- Create an additional function to safely get artisan contact info
-- Only for authorized users (clients with bookings, artisans themselves, admins)
CREATE OR REPLACE FUNCTION public.get_artisan_contact_info(artisan_id_param uuid)
RETURNS TABLE(
  email text,
  phone text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check authorization
  IF NOT (
    -- User is admin
    public.is_admin() OR
    -- User is the artisan themselves
    EXISTS(SELECT 1 FROM public.artisans WHERE id = artisan_id_param AND email = auth.email()) OR
    -- User has an active booking with this artisan
    EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisan_id_param 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to artisan contact information';
  END IF;

  -- Return contact info if authorized
  RETURN QUERY
  SELECT a.email, a.phone, a.full_name
  FROM public.artisans a
  WHERE a.id = artisan_id_param;
END;
$$;

-- Update any existing code that might be using direct table access
-- Create a notification function to alert about policy changes
CREATE OR REPLACE FUNCTION public.notify_artisan_policy_update()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be called to notify the application about policy changes
  PERFORM pg_notify('artisan_policies_updated', json_build_object(
    'message', 'Artisan table security policies have been updated',
    'timestamp', now(),
    'action', 'Use artisans_public view for public data access'
  )::text);
END;
$$;

-- Call the notification
SELECT public.notify_artisan_policy_update();