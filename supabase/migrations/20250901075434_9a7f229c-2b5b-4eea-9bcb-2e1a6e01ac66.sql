-- Fix Security Definer Views by removing SECURITY DEFINER where inappropriate
-- and updating artisans_directory and artisans_public views

-- First, check if these views exist and recreate them without SECURITY DEFINER
DROP VIEW IF EXISTS public.artisans_directory CASCADE;
DROP VIEW IF EXISTS public.artisans_public CASCADE;

-- Recreate artisans_directory view without SECURITY DEFINER for public access
CREATE VIEW public.artisans_directory AS
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

-- Recreate artisans_public view without SECURITY DEFINER for public access
CREATE VIEW public.artisans_public AS
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

-- Add enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access_secure(
  p_table_name text,
  p_operation text,
  p_record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'sensitive_data_access',
    auth.uid(),
    jsonb_build_object(
      'table', p_table_name,
      'operation', p_operation,
      'record_id', p_record_id,
      'timestamp', now(),
      'user_email', auth.email()
    ),
    'medium'
  );
END;
$$;