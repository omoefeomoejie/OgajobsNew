-- CRITICAL SECURITY FIXES FOR PRODUCTION READINESS
-- Since artisans_directory and artisans_public_directory are views, we need to secure them differently

-- 1. Drop the insecure views completely to prevent data exposure
DROP VIEW IF EXISTS public.artisans_directory CASCADE;
DROP VIEW IF EXISTS public.artisans_public_directory CASCADE;

-- 2. Create a secure function to replace the public directory access
CREATE OR REPLACE FUNCTION public.get_public_artisan_directory(
    p_category text DEFAULT NULL::text, 
    p_city text DEFAULT NULL::text, 
    p_limit integer DEFAULT 50, 
    p_offset integer DEFAULT 0
)
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
    created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access for monitoring
  PERFORM public.log_security_event(
    'public_artisan_directory_access',
    jsonb_build_object(
      'category', p_category,
      'city', p_city,
      'limit', p_limit,
      'offset', p_offset,
      'user_id', auth.uid()
    ),
    'low'
  );

  -- Return only non-sensitive public artisan data
  RETURN QUERY
  SELECT 
    a.id,
    a.full_name,
    a.category,
    a.skill,
    a.city,
    a.photo_url,
    a.profile_url,
    a.slug,
    COALESCE(AVG(ar.rating), 0)::numeric as average_rating,
    COUNT(ar.id) as total_reviews,
    a.created_at
  FROM public.artisans a
  LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
  WHERE 
    NOT a.suspended
    AND (p_category IS NULL OR a.category = p_category)
    AND (p_city IS NULL OR a.city = p_city)
  GROUP BY a.id, a.full_name, a.category, a.skill, a.city, 
           a.photo_url, a.profile_url, a.slug, a.created_at
  ORDER BY average_rating DESC, total_reviews DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 3. Create a secure admin-only function to access full artisan directory
CREATE OR REPLACE FUNCTION public.get_admin_artisan_directory(
    p_category text DEFAULT NULL::text, 
    p_city text DEFAULT NULL::text, 
    p_limit integer DEFAULT 50, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid, 
    full_name text, 
    category text, 
    skill text, 
    city text, 
    email text,
    phone text,
    photo_url text, 
    profile_url text, 
    slug text, 
    suspended boolean,
    created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Log admin access
  PERFORM public.log_security_event(
    'admin_artisan_directory_access',
    jsonb_build_object(
      'category', p_category,
      'city', p_city,
      'admin_id', auth.uid()
    ),
    'medium'
  );

  -- Return full artisan data for admins
  RETURN QUERY
  SELECT 
    a.id,
    a.full_name,
    a.category,
    a.skill,
    a.city,
    a.email,
    a.phone,
    a.photo_url,
    a.profile_url,
    a.slug,
    a.suspended,
    a.created_at
  FROM public.artisans a
  WHERE 
    (p_category IS NULL OR a.category = p_category)
    AND (p_city IS NULL OR a.city = p_city)
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 4. Update existing get_artisan_directory_secure function to prevent direct table access
CREATE OR REPLACE FUNCTION public.get_artisan_directory_secure(
    p_category text DEFAULT NULL::text, 
    p_city text DEFAULT NULL::text, 
    p_limit integer DEFAULT 50, 
    p_offset integer DEFAULT 0
)
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
    created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the secure public directory function
  RETURN QUERY 
  SELECT * FROM public.get_public_artisan_directory(p_category, p_city, p_limit, p_offset);
END;
$function$;

-- 5. Fix function security for all existing functions with missing search paths
CREATE OR REPLACE FUNCTION public.refresh_public_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to refresh views
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can refresh materialized views';
  END IF;

  -- Refresh materialized views safely if they exist
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_artisan_directory') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_directory;
  END IF;
  
  -- Log the refresh
  PERFORM public.log_security_event(
    'materialized_view_refresh',
    jsonb_build_object('refreshed_by', auth.uid()),
    'low'
  );
END;
$function$;

-- 6. Log this critical security fix
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_details,
  severity
) VALUES (
  'critical_security_views_removed',
  auth.uid(),
  jsonb_build_object(
    'action', 'removed_insecure_views',
    'views_removed', ARRAY['artisans_directory', 'artisans_public_directory'],
    'secure_functions_created', ARRAY['get_public_artisan_directory', 'get_admin_artisan_directory'],
    'timestamp', now()
  ),
  'high'
);