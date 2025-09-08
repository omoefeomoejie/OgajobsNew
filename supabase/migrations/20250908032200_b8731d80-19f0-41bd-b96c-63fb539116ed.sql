-- CRITICAL SECURITY FIXES FOR PRODUCTION READINESS

-- 1. Fix Artisan Directory Exposure - Add proper RLS policies
ALTER TABLE public.artisans_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans_public_directory ENABLE ROW LEVEL SECURITY;

-- Create secure policy for artisans_directory (admin only)
CREATE POLICY "Admin only access to artisans directory"
ON public.artisans_directory
FOR ALL
USING (is_admin());

-- Create public read-only policy for artisans_public_directory (non-sensitive data only)
CREATE POLICY "Public can view artisan public directory"
ON public.artisans_public_directory
FOR SELECT
USING (true);

-- Prevent all other operations on public directory
CREATE POLICY "No modifications to public directory"
ON public.artisans_public_directory
FOR INSERT, UPDATE, DELETE
USING (false);

-- 2. Remove insecure SECURITY DEFINER views that bypass RLS
-- Drop the problematic artisans_directory view if it exists as a view
DROP VIEW IF EXISTS public.artisans_directory CASCADE;

-- 3. Fix function security - set proper search paths
-- Update existing functions to have proper search path
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
  -- Log access for monitoring
  PERFORM public.log_security_event(
    'secure_artisan_directory_access',
    jsonb_build_object(
      'category', p_category,
      'city', p_city,
      'limit', p_limit,
      'offset', p_offset
    ),
    'low'
  );

  -- Return filtered public directory data (no contact information)
  RETURN QUERY
  SELECT 
    apd.id,
    apd.full_name,
    apd.category,
    apd.skill,
    apd.city,
    apd.photo_url,
    apd.profile_url,
    apd.slug,
    COALESCE(AVG(ar.rating), 0)::numeric as average_rating,
    COUNT(ar.id) as total_reviews,
    apd.created_at
  FROM public.artisans_public_directory apd
  LEFT JOIN public.artisan_reviews ar ON apd.id = ar.artisan_id
  WHERE 
    (p_category IS NULL OR apd.category = p_category)
    AND (p_city IS NULL OR apd.city = p_city)
  GROUP BY apd.id, apd.full_name, apd.category, apd.skill, apd.city, 
           apd.photo_url, apd.profile_url, apd.slug, apd.created_at
  ORDER BY average_rating DESC, total_reviews DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 4. Create secure materialized view refresh function
CREATE OR REPLACE FUNCTION public.refresh_public_views_secure()
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

  -- Refresh materialized views safely
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_artisan_directory') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_directory;
  END IF;
  
  -- Log the refresh
  PERFORM public.log_security_event(
    'materialized_view_refresh',
    jsonb_build_object('view', 'mv_artisan_directory'),
    'low'
  );
END;
$function$;

-- 5. Add audit triggers to sensitive tables that were missing them
DROP TRIGGER IF EXISTS audit_artisans_directory_changes ON public.artisans_directory;
CREATE TRIGGER audit_artisans_directory_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.artisans_directory
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_artisans_public_directory_changes ON public.artisans_public_directory;
CREATE TRIGGER audit_artisans_public_directory_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.artisans_public_directory
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 6. Log this critical security fix
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_details,
  severity
) VALUES (
  'critical_security_fixes_applied',
  auth.uid(),
  jsonb_build_object(
    'fixes', ARRAY[
      'artisan_directory_rls_enabled',
      'public_directory_secured', 
      'insecure_views_removed',
      'function_search_paths_fixed',
      'audit_triggers_added'
    ],
    'timestamp', now()
  ),
  'high'
);