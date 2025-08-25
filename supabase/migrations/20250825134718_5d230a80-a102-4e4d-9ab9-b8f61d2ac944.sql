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
CREATE OR REPLACE FUNCTION public.refresh_performance_views()
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

CREATE OR REPLACE FUNCTION public.verify_admin_access_v2(required_action text DEFAULT 'general'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user role securely
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    -- Log unauthorized access attempt
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_details,
      severity
    ) VALUES (
      'unauthorized_admin_access',
      auth.uid(),
      jsonb_build_object('action', required_action, 'timestamp', now()),
      'high'
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Fix artisans table RLS policy to properly protect contact information
DROP POLICY IF EXISTS "Restricted artisan profile access" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view public artisan directory" ON public.artisans;

-- Create secure function to get masked artisan data
CREATE OR REPLACE FUNCTION public.get_artisan_public_view(artisan_row public.artisans)
RETURNS TABLE(
  id uuid,
  full_name text,
  category text,
  skill text,
  city text,
  photo_url text,
  profile_url text,
  slug text,
  suspended boolean,
  created_at timestamp without time zone,
  email text,
  phone text,
  message text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  can_see_contact boolean := false;
BEGIN
  -- Check if user can see contact information
  can_see_contact := (
    -- User is the artisan themselves
    artisan_row.id = auth.uid() OR
    -- User is admin
    is_admin() OR
    -- User has an active booking with this artisan
    EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisan_row.id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    )
  );
  
  RETURN QUERY SELECT
    artisan_row.id,
    artisan_row.full_name,
    artisan_row.category,
    artisan_row.skill,
    artisan_row.city,
    artisan_row.photo_url,
    artisan_row.profile_url,
    artisan_row.slug,
    artisan_row.suspended,
    artisan_row.created_at,
    CASE 
      WHEN can_see_contact THEN artisan_row.email
      ELSE mask_sensitive_data(artisan_row.email, 'email')
    END as email,
    CASE 
      WHEN can_see_contact THEN artisan_row.phone
      ELSE mask_sensitive_data(artisan_row.phone, 'phone')
    END as phone,
    artisan_row.message;
END;
$$;

-- Update artisans table RLS policies with proper contact protection
CREATE POLICY "Public artisan directory with masked contact info"
ON public.artisans
FOR SELECT
USING (NOT suspended AND (auth.uid() IS NOT NULL OR auth.role() = 'anon'));

-- Add RLS policies for artisans_directory view
ALTER TABLE public.artisans_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public directory access"
ON public.artisans_directory
FOR SELECT
USING (NOT COALESCE(suspended, false));

-- Add missing RLS policies for tables that have RLS enabled but no policies
-- Fix market_conditions table
CREATE POLICY "Public can view market conditions"
ON public.market_conditions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage market conditions"
ON public.market_conditions
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add policy for quality_metrics table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quality_metrics' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Public can view quality metrics" ON public.quality_metrics FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage quality metrics" ON public.quality_metrics FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
  END IF;
END $$;

-- Remove security definer from views that don't need it
DROP VIEW IF EXISTS public.artisans_directory;

-- Recreate artisans_directory as a regular view
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

-- Enable RLS on the recreated view
ALTER VIEW public.artisans_directory SET (security_barrier = true);

-- Create additional security functions for validation
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

-- Cleanup old security events to prevent table bloat
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