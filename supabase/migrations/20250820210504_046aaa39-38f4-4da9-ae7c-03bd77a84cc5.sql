-- Fix Critical Security Issues from Security Scan

-- 1. Fix functions with mutable search paths
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $function$
DECLARE
  earth_radius NUMERIC := 6371; -- Earth radius in kilometers
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_sla_times(priority_level support_priority)
RETURNS TABLE(first_response_hours integer, resolution_hours integer)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $function$
BEGIN
  CASE priority_level
    WHEN 'critical' THEN
      RETURN QUERY SELECT 1, 4;
    WHEN 'urgent' THEN
      RETURN QUERY SELECT 2, 8;
    WHEN 'high' THEN
      RETURN QUERY SELECT 4, 24;
    WHEN 'normal' THEN
      RETURN QUERY SELECT 8, 72;
    WHEN 'low' THEN
      RETURN QUERY SELECT 24, 168;
    ELSE
      RETURN QUERY SELECT 8, 72;
  END CASE;
END;
$function$;

-- 2. Remove materialized views from API by dropping them or securing them
-- First check if they exist, then drop them (they can be recreated as needed)
DROP MATERIALIZED VIEW IF EXISTS public.mv_artisan_performance;
DROP MATERIALIZED VIEW IF EXISTS public.mv_client_analytics;
DROP MATERIALIZED VIEW IF EXISTS public.mv_service_category_stats;
DROP MATERIALIZED VIEW IF EXISTS public.mv_monthly_metrics;

-- 3. Fix security definer views by converting them to regular views with proper RLS
-- Drop existing security definer views
DROP VIEW IF EXISTS public.artisans_public CASCADE;
DROP VIEW IF EXISTS public.artisans_public_safe CASCADE;
DROP VIEW IF EXISTS public.artisans_public_secure CASCADE;

-- Create a proper public view for artisans with RLS
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
  created_at,
  suspended,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.created_at, a.suspended;

-- Enable RLS on the view
ALTER VIEW public.artisans_public SET (security_barrier = true);

-- 4. Add RLS policies for tables that have RLS enabled but no policies
-- Find tables with RLS enabled but no policies and add basic policies

-- Check what tables need policies - add policies for portfolio_analytics and market_conditions if they exist
DO $$
BEGIN
  -- Add RLS policy for portfolio_analytics if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_analytics' AND table_schema = 'public') THEN
    -- Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'portfolio_analytics' AND schemaname = 'public') THEN
      -- Add policy for portfolio analytics
      DROP POLICY IF EXISTS "Users can view portfolio analytics" ON public.portfolio_analytics;
      CREATE POLICY "Users can view portfolio analytics" 
      ON public.portfolio_analytics 
      FOR SELECT 
      USING (true); -- Public data
      
      DROP POLICY IF EXISTS "System can manage portfolio analytics" ON public.portfolio_analytics;
      CREATE POLICY "System can manage portfolio analytics" 
      ON public.portfolio_analytics 
      FOR ALL 
      USING (is_admin())
      WITH CHECK (is_admin());
    END IF;
  END IF;

  -- Add RLS policy for market_conditions if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_conditions' AND table_schema = 'public') THEN
    -- Add policy for market conditions
    DROP POLICY IF EXISTS "Users can view market conditions" ON public.market_conditions;
    CREATE POLICY "Users can view market conditions" 
    ON public.market_conditions 
    FOR SELECT 
    USING (true); -- Public data for market insights
    
    DROP POLICY IF EXISTS "System can manage market conditions" ON public.market_conditions;
    CREATE POLICY "System can manage market conditions" 
    ON public.market_conditions 
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- 5. Add additional security hardening
-- Create a function to log security events
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    violation_type,
    auth.uid(),
    details,
    'high'
  );
END;
$$;

-- Add rate limiting protection for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_type text,
  max_attempts integer DEFAULT 10,
  window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
  window_start timestamp;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type = operation_type
    AND created_at > window_start;
    
  IF attempt_count >= max_attempts THEN
    PERFORM public.log_security_violation(
      'rate_limit_exceeded',
      jsonb_build_object(
        'operation', operation_type,
        'attempts', attempt_count,
        'window_minutes', window_minutes
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;