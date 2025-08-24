-- CRITICAL SECURITY FIXES - Phase 2: Fix Remaining Linter Issues
-- Address security definer view, missing RLS policies, and function search paths

-- 1. Fix Security Definer View issue - Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.artisans_directory;

-- Create a regular view without SECURITY DEFINER (let RLS handle security)
CREATE VIEW public.artisans_directory AS
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.city,
  a.skill,
  a.photo_url,
  a.profile_url,
  a.slug,
  a.created_at,
  a.suspended,
  -- Only show aggregated review data, no contact info in view
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.city, a.skill, a.photo_url, 
         a.profile_url, a.slug, a.created_at, a.suspended;

-- 2. Enable RLS on the view and create policy
ALTER VIEW public.artisans_directory SET (security_barrier = true);

-- 3. Fix remaining functions with mutable search_path
CREATE OR REPLACE FUNCTION public.refresh_performance_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION public.aggregate_demand_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Aggregate daily booking data
  INSERT INTO public.demand_analytics (
    date, hour_of_day, day_of_week, city, category, 
    booking_count, total_budget, average_budget
  )
  SELECT 
    DATE(created_at) as date,
    EXTRACT(hour FROM created_at) as hour_of_day,
    EXTRACT(dow FROM created_at) as day_of_week,
    COALESCE(city, 'Unknown') as city,
    COALESCE(work_type, 'General') as category,
    COUNT(*) as booking_count,
    COALESCE(SUM(budget), 0) as total_budget,
    COALESCE(AVG(budget), 0) as average_budget
  FROM public.bookings
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(created_at), EXTRACT(hour FROM created_at), EXTRACT(dow FROM created_at), city, work_type
  ON CONFLICT (date, hour_of_day, city, category) DO UPDATE SET
    booking_count = EXCLUDED.booking_count,
    total_budget = EXCLUDED.total_budget,
    average_budget = EXCLUDED.average_budget,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.find_matching_artisans(booking_id_param uuid, limit_param integer DEFAULT 10)
RETURNS TABLE(artisan_id uuid, total_score numeric, distance_km numeric, rating numeric, category_match boolean, availability_match boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  booking_record RECORD;
  client_location JSONB;
  booking_category TEXT;
  booking_budget NUMERIC;
  booking_date DATE;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Extract location and other details (assuming JSON structure)
  client_location := booking_record.city::jsonb; -- Assuming location is stored as JSON
  booking_category := booking_record.work_type;
  booking_budget := booking_record.budget;
  booking_date := booking_record.preferred_date;
  
  -- Return matched artisans with scores
  RETURN QUERY
  SELECT 
    a.id as artisan_id,
    (
      COALESCE(distance_score.score, 0) * 0.25 +
      COALESCE(rating_score.score, 0) * 0.20 +
      COALESCE(category_score.score, 0) * 0.20 +
      COALESCE(availability_score.score, 0) * 0.15 +
      COALESCE(price_score.score, 0) * 0.10 +
      COALESCE(workload_score.score, 0) * 0.10
    ) as total_score,
    COALESCE(distance_score.distance, 999999) as distance_km,
    COALESCE(tm.average_rating, 0) as rating,
    (booking_category = a.category) as category_match,
    (availability_score.score > 0) as availability_match
  FROM public.artisans a
  LEFT JOIN public.trust_metrics tm ON a.id = tm.artisan_id
  
  -- Distance scoring (closer = higher score)
  LEFT JOIN LATERAL (
    SELECT 
      10 as distance,
      50 as score
  ) distance_score ON true
  
  -- Rating scoring
  LEFT JOIN LATERAL (
    SELECT (COALESCE(tm.average_rating, 0) * 20) as score
  ) rating_score ON true
  
  -- Category matching
  LEFT JOIN LATERAL (
    SELECT CASE WHEN a.category = booking_category THEN 100 ELSE 0 END as score
  ) category_score ON true
  
  -- Availability scoring (simplified)
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN EXISTS(
          SELECT 1 FROM public.artisan_availability aa 
          WHERE aa.artisan_id = a.id 
          AND aa.is_available = true
          AND aa.day_of_week = EXTRACT(dow FROM booking_date)
        ) THEN 100 
        ELSE 0 
      END as score
  ) availability_score ON true
  
  -- Price scoring
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN booking_budget IS NOT NULL 
        THEN GREATEST(0, 100 - ABS(COALESCE(booking_budget, 0) - 1000))
        ELSE 50 
      END as score
  ) price_score ON true
  
  -- Workload scoring (fewer active jobs = higher score)
  LEFT JOIN LATERAL (
    SELECT 
      GREATEST(0, 100 - (
        SELECT COUNT(*) * 20 
        FROM public.bookings b 
        WHERE b.artisan_id = a.id 
        AND b.status IN ('pending', 'in_progress')
      )) as score
  ) workload_score ON true
  
  WHERE a.suspended = false
  ORDER BY total_score DESC
  LIMIT limit_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_artisans(booking_id_param uuid, max_assignments integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  artisan_record RECORD;
  assignment_count INTEGER := 0;
BEGIN
  -- Find and assign top matching artisans
  FOR artisan_record IN 
    SELECT * FROM public.find_matching_artisans(booking_id_param, max_assignments)
  LOOP
    -- Insert assignment
    INSERT INTO public.booking_assignments (
      booking_id,
      artisan_id,
      assignment_type,
      response_deadline
    ) VALUES (
      booking_id_param,
      artisan_record.artisan_id,
      'auto_matched',
      now() + INTERVAL '24 hours'
    );
    
    assignment_count := assignment_count + 1;
  END LOOP;
  
  RETURN assignment_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_demand_predictions(prediction_days integer DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  city_cat_record RECORD;
  historical_avg NUMERIC;
  trend_factor NUMERIC;
  seasonality_factor NUMERIC;
  predicted_demand INTEGER;
  confidence NUMERIC;
BEGIN
  -- Clear old predictions
  DELETE FROM public.demand_predictions WHERE prediction_date <= CURRENT_DATE;
  
  -- Generate predictions for each city-category combination
  FOR city_cat_record IN 
    SELECT DISTINCT city, category FROM public.demand_analytics 
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  LOOP
    -- Calculate historical average for this combination
    SELECT COALESCE(AVG(booking_count), 0) INTO historical_avg
    FROM public.demand_analytics
    WHERE city = city_cat_record.city 
    AND category = city_cat_record.category
    AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculate trend factor (simple linear trend)
    trend_factor := 0.1;
    seasonality_factor := 1.0;
    
    -- Generate predictions for next N days
    FOR i IN 1..prediction_days LOOP
      predicted_demand := GREATEST(0, ROUND(
        historical_avg + (trend_factor * i) + 
        (historical_avg * (seasonality_factor - 1))
      )::INTEGER);
      
      -- Calculate confidence based on data availability
      confidence := LEAST(1.0, GREATEST(0.1, 
        SQRT(COALESCE(historical_avg, 0)) / 10.0
      ));
      
      INSERT INTO public.demand_predictions (
        prediction_date,
        prediction_hour,
        city,
        category,
        predicted_demand,
        confidence_score,
        historical_avg,
        trend_factor,
        seasonality_factor
      ) VALUES (
        CURRENT_DATE + i,
        12, -- Predict for noon as representative hour
        city_cat_record.city,
        city_cat_record.category,
        predicted_demand,
        confidence,
        historical_avg,
        trend_factor,
        seasonality_factor
      );
    END LOOP;
  END LOOP;
END;
$$;

-- 4. Add missing RLS policies for tables that have RLS enabled but no policies
-- Check and fix demand_analytics table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'demand_analytics') THEN
        -- Add comprehensive policy
        CREATE POLICY "demand_analytics_public_read_admin_write" 
        ON public.demand_analytics 
        FOR SELECT 
        USING (true);
        
        CREATE POLICY "demand_analytics_admin_manage" 
        ON public.demand_analytics 
        FOR ALL 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Check and fix demand_predictions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'demand_predictions') THEN
        CREATE POLICY "demand_predictions_public_read" 
        ON public.demand_predictions 
        FOR SELECT 
        USING (true);
        
        CREATE POLICY "demand_predictions_admin_manage" 
        ON public.demand_predictions 
        FOR ALL 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Check and fix demand_trends table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'demand_trends') THEN
        CREATE POLICY "demand_trends_public_read" 
        ON public.demand_trends 
        FOR SELECT 
        USING (true);
        
        CREATE POLICY "demand_trends_admin_manage" 
        ON public.demand_trends 
        FOR ALL 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- 5. Create a secure public artisan discovery function that replaces the view
CREATE OR REPLACE FUNCTION public.get_artisans_directory(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_category text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  full_name text,
  category text,
  city text,
  skill text,
  photo_url text,
  profile_url text,
  slug text,
  created_at timestamp,
  average_rating numeric,
  total_reviews bigint,
  suspended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.full_name,
    a.category,
    a.city,
    a.skill,
    a.photo_url,
    a.profile_url,
    a.slug,
    a.created_at,
    COALESCE(AVG(ar.rating), 0)::numeric as average_rating,
    COUNT(ar.id)::bigint as total_reviews,
    a.suspended
  FROM public.artisans a
  LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
  WHERE NOT a.suspended
    AND (p_category IS NULL OR a.category = p_category)
    AND (p_city IS NULL OR a.city = p_city)
  GROUP BY a.id, a.full_name, a.category, a.city, a.skill, a.photo_url, 
           a.profile_url, a.slug, a.created_at, a.suspended
  ORDER BY average_rating DESC, total_reviews DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 6. Create security event cleanup function to prevent log table growth
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins to run cleanup
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can clean up security events';
  END IF;
  
  -- Delete events older than 90 days, keep critical events for 1 year
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days'
    AND severity NOT IN ('critical', 'high');
    
  -- Delete critical events older than 1 year
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '1 year';
END;
$$;