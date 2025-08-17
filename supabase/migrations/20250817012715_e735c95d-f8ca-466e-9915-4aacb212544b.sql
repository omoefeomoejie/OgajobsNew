-- Security Fix Migration Phase 5: Final security hardening

-- Fix the remaining functions that need search_path
CREATE OR REPLACE FUNCTION public.aggregate_demand_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_demand_predictions(prediction_days integer DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_dynamic_price(p_service_category text, p_base_price numeric, p_city text, p_booking_time timestamp with time zone DEFAULT now(), p_client_id uuid DEFAULT NULL::uuid, p_booking_urgency text DEFAULT 'normal'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  final_price NUMERIC := p_base_price;
  applied_rules JSON[] := '{}';
  calculation_factors JSON;
  demand_multiplier NUMERIC := 1.0;
  supply_multiplier NUMERIC := 1.0;
  time_multiplier NUMERIC := 1.0;
  urgency_multiplier NUMERIC := 1.0;
  rule_record RECORD;
  current_hour INTEGER;
  current_dow INTEGER;
  market_data RECORD;
BEGIN
  -- Get current time factors
  current_hour := EXTRACT(hour FROM p_booking_time);
  current_dow := EXTRACT(dow FROM p_booking_time);
  
  -- Get market conditions
  SELECT * INTO market_data 
  FROM public.market_conditions 
  WHERE city = p_city 
  AND service_category = p_service_category 
  AND date = DATE(p_booking_time)
  AND hour_of_day = current_hour;
  
  -- Calculate demand multiplier
  IF market_data.demand_level IS NOT NULL THEN
    demand_multiplier := CASE 
      WHEN market_data.demand_level = 5 THEN 1.5  -- Very high demand
      WHEN market_data.demand_level = 4 THEN 1.2  -- High demand
      WHEN market_data.demand_level = 3 THEN 1.0  -- Normal demand
      WHEN market_data.demand_level = 2 THEN 0.9  -- Low demand
      ELSE 0.8  -- Very low demand
    END;
  END IF;
  
  -- Calculate supply multiplier
  IF market_data.supply_level IS NOT NULL THEN
    supply_multiplier := CASE 
      WHEN market_data.supply_level = 1 THEN 1.3  -- Very low supply
      WHEN market_data.supply_level = 2 THEN 1.1  -- Low supply
      WHEN market_data.supply_level = 3 THEN 1.0  -- Normal supply
      WHEN market_data.supply_level = 4 THEN 0.95 -- High supply
      ELSE 0.9  -- Very high supply
    END;
  END IF;
  
  -- Time-based multiplier (peak hours)
  IF current_hour BETWEEN 8 AND 10 OR current_hour BETWEEN 17 AND 19 THEN
    time_multiplier := 1.1; -- Peak hours
  ELSIF current_hour BETWEEN 22 AND 6 THEN
    time_multiplier := 1.2; -- Night hours
  END IF;
  
  -- Urgency multiplier
  urgency_multiplier := CASE p_booking_urgency
    WHEN 'emergency' THEN 2.0
    WHEN 'urgent' THEN 1.5
    WHEN 'high' THEN 1.2
    ELSE 1.0
  END;
  
  -- Apply all multipliers
  final_price := final_price * demand_multiplier * supply_multiplier * time_multiplier * urgency_multiplier;
  
  -- Round to nearest 50 Naira
  final_price := ROUND(final_price / 50) * 50;
  
  -- Ensure minimum price (at least 80% of base price)
  final_price := GREATEST(final_price, p_base_price * 0.8);
  
  -- Build calculation factors
  calculation_factors := json_build_object(
    'demand_multiplier', demand_multiplier,
    'supply_multiplier', supply_multiplier,
    'time_multiplier', time_multiplier,
    'urgency_multiplier', urgency_multiplier,
    'hour_of_day', current_hour,
    'day_of_week', current_dow
  );
  
  RETURN json_build_object(
    'base_price', p_base_price,
    'final_price', final_price,
    'applied_rules', applied_rules,
    'calculation_factors', calculation_factors,
    'savings_percentage', ROUND(((p_base_price - final_price) / p_base_price * 100)::NUMERIC, 2)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_market_conditions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  city_category_record RECORD;
  booking_count INTEGER;
  artisan_count INTEGER;
  demand_level INTEGER;
  supply_level INTEGER;
BEGIN
  -- Update market conditions for each city-category combination
  FOR city_category_record IN 
    SELECT DISTINCT city, work_type as service_category 
    FROM public.bookings 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    -- Count bookings in the last hour for this city-category
    SELECT COUNT(*) INTO booking_count
    FROM public.bookings
    WHERE city = city_category_record.city
    AND work_type = city_category_record.service_category
    AND created_at >= now() - INTERVAL '1 hour';
    
    -- Count available artisans
    SELECT COUNT(*) INTO artisan_count
    FROM public.artisans
    WHERE city = city_category_record.city
    AND category = city_category_record.service_category
    AND suspended = false;
    
    -- Calculate demand level (1-5 scale)
    demand_level := CASE 
      WHEN booking_count >= 10 THEN 5
      WHEN booking_count >= 7 THEN 4
      WHEN booking_count >= 4 THEN 3
      WHEN booking_count >= 2 THEN 2
      ELSE 1
    END;
    
    -- Calculate supply level (1-5 scale)
    supply_level := CASE 
      WHEN artisan_count >= 20 THEN 5
      WHEN artisan_count >= 15 THEN 4
      WHEN artisan_count >= 10 THEN 3
      WHEN artisan_count >= 5 THEN 2
      ELSE 1
    END;
    
    -- Insert or update market conditions
    INSERT INTO public.market_conditions (
      city,
      service_category,
      date,
      hour_of_day,
      demand_level,
      supply_level
    ) VALUES (
      city_category_record.city,
      city_category_record.service_category,
      CURRENT_DATE,
      EXTRACT(hour FROM now()),
      demand_level,
      supply_level
    ) ON CONFLICT (city, service_category, date, hour_of_day)
    DO UPDATE SET 
      demand_level = EXCLUDED.demand_level,
      supply_level = EXCLUDED.supply_level;
  END LOOP;
END;
$function$;

-- Add missing RLS policies for tables without coverage
-- Add basic policy for portfolio_analytics if it exists
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portfolio_analytics') THEN
    DROP POLICY IF EXISTS "Users can view portfolio analytics" ON public.portfolio_analytics;
    CREATE POLICY "Users can view portfolio analytics" 
    ON public.portfolio_analytics 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Add basic policy for withdrawal_settings if it exists
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_settings') THEN
    DROP POLICY IF EXISTS "Artisans can manage their withdrawal settings" ON public.withdrawal_settings;
    CREATE POLICY "Artisans can manage their withdrawal settings" 
    ON public.withdrawal_settings 
    FOR ALL 
    USING (artisan_id = auth.uid())
    WITH CHECK (artisan_id = auth.uid());
  END IF;
END $$;