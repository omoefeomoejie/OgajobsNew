-- Drop and recreate functions without SECURITY DEFINER where possible
-- This will fix the Security Definer View linter error

-- Drop the get_artisans_directory function first
DROP FUNCTION IF EXISTS public.get_artisans_directory();

-- Recreate without SECURITY DEFINER
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

-- Also fix get_service_category_stats_secure - it doesn't need SECURITY DEFINER
DROP FUNCTION IF EXISTS public.get_service_category_stats_secure();

CREATE OR REPLACE FUNCTION public.get_service_category_stats_secure()
RETURNS TABLE(category text, total_artisans bigint, avg_rating numeric, total_jobs bigint)
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
  -- This is public data, so no authorization check needed
  RETURN QUERY
  SELECT 
    a.category,
    COUNT(DISTINCT a.id)::bigint as total_artisans,
    COALESCE(AVG(ar.rating), 0)::numeric as avg_rating,
    COUNT(b.id)::bigint as total_jobs
  FROM public.artisans a
  LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
  LEFT JOIN public.bookings b ON a.id = b.artisan_id
  WHERE NOT a.suspended
  GROUP BY a.category;
END;
$$;