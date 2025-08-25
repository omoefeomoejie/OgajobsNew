-- Fix remaining functions missing search_path parameter
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

-- Add other critical functions with search_path
CREATE OR REPLACE FUNCTION public.auto_assign_chat_session(session_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  available_agent_id uuid;
BEGIN
  -- Find an available agent (admin or agent role)
  SELECT id INTO available_agent_id
  FROM public.profiles
  WHERE role IN ('admin', 'agent')
  AND id NOT IN (
    SELECT DISTINCT agent_id 
    FROM public.live_chat_sessions 
    WHERE status = 'active' 
    AND agent_id IS NOT NULL
  )
  LIMIT 1;
  
  IF available_agent_id IS NOT NULL THEN
    UPDATE public.live_chat_sessions
    SET 
      agent_id = available_agent_id,
      status = 'active',
      assigned_at = now(),
      updated_at = now()
    WHERE id = session_id_param;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Secure the artisans_directory table 
DROP VIEW IF EXISTS public.artisans_directory CASCADE;

-- Create a secure artisans directory view that doesn't expose sensitive data
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
  AND (auth.uid() IS NOT NULL) -- Require authentication
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- Add security policies for any tables with RLS enabled but no policies
DO $$
DECLARE
  table_name text;
BEGIN
  -- Get tables with RLS enabled but no policies
  FOR table_name IN 
    SELECT t.table_name
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_policies p ON p.tablename = t.table_name
    WHERE t.table_schema = 'public' 
    AND c.relrowsecurity = true
    AND p.policyname IS NULL
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT IN ('artisans_directory') -- Skip views
  LOOP
    -- Add a default restrictive policy for authenticated users
    EXECUTE format('CREATE POLICY "Default authenticated access" ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', table_name);
    
    -- If it's an admin-manageable table, add admin policies
    IF table_name IN ('market_conditions', 'demand_analytics', 'demand_predictions', 'demand_trends') THEN
      EXECUTE format('CREATE POLICY "Admins can manage %I" ON public.%I FOR ALL USING (is_admin()) WITH CHECK (is_admin())', table_name, table_name);
    END IF;
  END LOOP;
END $$;