-- Fix Security Definer View issue by removing SECURITY DEFINER from functions that don't need it
-- The get_artisans_directory function doesn't need SECURITY DEFINER since it can rely on RLS policies

CREATE OR REPLACE FUNCTION public.get_artisans_directory()
RETURNS TABLE(id uuid, full_name text, category text, skill text, city text, photo_url text, profile_url text, slug text, average_rating numeric, total_reviews bigint, suspended boolean, created_at timestamp without time zone)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
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
$$;