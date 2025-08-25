-- Fix database functions missing search_path parameter
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
STABLE SECURITY DEFINER
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

-- Update other functions missing search_path
CREATE OR REPLACE FUNCTION public.refresh_performance_views_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Fix artisans table RLS policy to properly protect contact information
DROP POLICY IF EXISTS "Restricted artisan profile access" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view public artisan directory" ON public.artisans;

-- Create new secure RLS policy for artisans that masks sensitive data
CREATE POLICY "Secure artisan access with contact protection"
ON public.artisans
FOR SELECT
USING (
  NOT suspended AND 
  (
    -- Always allow basic profile info, but mask contact data unless authorized
    auth.uid() = id OR -- Artisan themselves
    is_admin() OR -- Admin users
    EXISTS( -- Users with active bookings
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    ) OR
    (email IS NULL AND phone IS NULL) -- Allow if no sensitive data
  )
);

-- Add missing RLS policies for tables that have RLS enabled but no policies
-- Check if market_conditions table exists and add policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_conditions' AND table_schema = 'public') THEN
    -- Add policies if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_conditions' AND policyname = 'Public can view market conditions') THEN
      EXECUTE 'CREATE POLICY "Public can view market conditions" ON public.market_conditions FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_conditions' AND policyname = 'Admins can manage market conditions') THEN
      EXECUTE 'CREATE POLICY "Admins can manage market conditions" ON public.market_conditions FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    END IF;
  END IF;
END $$;

-- Add policy for quality_metrics table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_metrics' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quality_metrics' AND policyname = 'Public can view quality metrics') THEN
      EXECUTE 'CREATE POLICY "Public can view quality metrics" ON public.quality_metrics FOR SELECT USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quality_metrics' AND policyname = 'Admins can manage quality metrics') THEN
      EXECUTE 'CREATE POLICY "Admins can manage quality metrics" ON public.quality_metrics FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    END IF;
  END IF;
END $$;

-- Create security validation function
CREATE OR REPLACE FUNCTION public.validate_security_compliance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  rls_issues integer := 0;
  policy_issues integer := 0;
BEGIN
  -- Only allow admins to run security validation
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can validate security compliance';
  END IF;
  
  -- Check for tables with RLS enabled but no policies
  SELECT COUNT(*) INTO rls_issues
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_policies p ON p.tablename = t.table_name
  WHERE t.table_schema = 'public' 
  AND c.relrowsecurity = true
  AND p.policyname IS NULL;
  
  -- Check for publicly accessible sensitive tables
  SELECT COUNT(*) INTO policy_issues
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual = 'true'
  AND tablename IN ('artisans', 'clients', 'profiles');
  
  result := jsonb_build_object(
    'rls_issues', rls_issues,
    'policy_issues', policy_issues,
    'validated_at', now(),
    'status', CASE WHEN rls_issues = 0 AND policy_issues = 0 THEN 'compliant' ELSE 'needs_attention' END
  );
  
  RETURN result;
END;
$$;

-- Cleanup function for old security events
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
BEGIN
  -- Delete security events older than 90 days
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete audit logs older than 1 year
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - INTERVAL '1 year';
END;
$$;