-- Fix remaining Security Definer issues
-- Let's identify and fix remaining functions that should use SECURITY INVOKER

-- Fix the get_service_category_stats_secure function 
CREATE OR REPLACE FUNCTION public.get_service_category_stats_secure()
RETURNS TABLE(category text, total_artisans bigint, avg_rating numeric, total_jobs bigint)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix the get_artisan_performance_secure function to use SECURITY INVOKER where appropriate
CREATE OR REPLACE FUNCTION public.get_artisan_performance_secure(p_artisan_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(artisan_id uuid, total_jobs bigint, completion_rate numeric, avg_rating numeric, response_time_hours numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check authorization first
  IF p_artisan_id IS NOT NULL AND p_artisan_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own performance data';
  END IF;
  
  -- Return performance data (simulate materialized view structure)
  RETURN QUERY
  SELECT 
    COALESCE(p_artisan_id, auth.uid()) as artisan_id,
    COUNT(b.id)::bigint as total_jobs,
    (COUNT(CASE WHEN b.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(b.id), 0))::numeric as completion_rate,
    COALESCE(AVG(ar.rating), 0)::numeric as avg_rating,
    24::numeric as response_time_hours -- Placeholder
  FROM public.bookings b
  LEFT JOIN public.artisan_reviews ar ON b.artisan_id = ar.artisan_id
  WHERE b.artisan_id = COALESCE(p_artisan_id, auth.uid())
  GROUP BY COALESCE(p_artisan_id, auth.uid());
END;
$function$;

-- Check if there are any views that need to be addressed
-- Let's update the refresh_performance_views_secure function to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.refresh_performance_views_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER for this function
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to refresh materialized views
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can refresh performance views';
  END IF;
  
  -- Refresh materialized views if they exist
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_artisan_performance') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_performance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_client_analytics') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_analytics;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_service_category_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_service_category_stats;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_monthly_metrics') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_monthly_metrics;
  END IF;
END;
$function$;

-- Update any other functions that might be causing security issues
-- Fix get_all_users_with_roles to be more secure
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, email text, role text)
LANGUAGE sql
STABLE 
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $function$
-- Only allow admins to see all users
SELECT
  CASE WHEN is_admin() THEN au.id ELSE NULL END,
  CASE WHEN is_admin() THEN au.email ELSE NULL END,
  CASE WHEN is_admin() THEN p.role ELSE NULL END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE is_admin(); -- Only return data if user is admin
$function$;

-- Create secure alternative functions for specific use cases
-- These functions will maintain SECURITY DEFINER only where absolutely necessary
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER  -- Keep SECURITY DEFINER for this auth-related function
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$function$;

-- Keep is_admin as SECURITY DEFINER since it's used in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER  -- Keep SECURITY DEFINER for this auth function
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role(auth.uid()) = 'admin');
END;
$function$;