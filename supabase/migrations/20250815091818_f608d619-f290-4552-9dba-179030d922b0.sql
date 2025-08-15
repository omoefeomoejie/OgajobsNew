-- Fix the critical security issues detected by the linter

-- 1. Fix the security definer function by setting proper search path
CREATE OR REPLACE FUNCTION public.get_artisan_contact_info(artisan_id_param uuid)
RETURNS TABLE(
  email text,
  phone text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 2. Fix the notification function
CREATE OR REPLACE FUNCTION public.notify_artisan_policy_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 3. Re-create the view without SECURITY DEFINER (which was implicitly set)
-- Drop and recreate the view to ensure it's not security definer
DROP VIEW IF EXISTS public.artisans_public;

CREATE VIEW public.artisans_public AS
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

-- 4. Add RLS policies to tables that currently have RLS enabled but no policies
-- This will address the RLS enabled but no policy warnings

-- Check for tables with RLS enabled but no policies and add basic ones
-- For matching_preferences table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'matching_preferences' AND schemaname = 'public'
  ) THEN
    -- Add basic policies for matching_preferences if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'matching_preferences' AND schemaname = 'public'
    ) THEN
      EXECUTE 'CREATE POLICY "Users can manage their own preferences" ON public.matching_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
  END IF;
END $$;

-- Add similar policies for other tables that might need them
-- This is a defensive approach to prevent RLS enabled without policies warnings