-- Create demand analytics tables for ML pipeline
CREATE TABLE public.demand_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  booking_count INTEGER NOT NULL DEFAULT 0,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  average_budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demand predictions table
CREATE TABLE public.demand_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_date DATE NOT NULL,
  prediction_hour INTEGER NOT NULL CHECK (prediction_hour >= 0 AND prediction_hour <= 23),
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  predicted_demand INTEGER NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  historical_avg NUMERIC,
  trend_factor NUMERIC,
  seasonality_factor NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create demand trends table for tracking patterns
CREATE TABLE public.demand_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  trend_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'seasonal'
  trend_value NUMERIC NOT NULL,
  trend_direction TEXT NOT NULL, -- 'increasing', 'decreasing', 'stable'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_demand_analytics_date_city_category ON public.demand_analytics(date, city, category);
CREATE INDEX idx_demand_analytics_day_hour ON public.demand_analytics(day_of_week, hour_of_day);
CREATE INDEX idx_demand_predictions_date_city ON public.demand_predictions(prediction_date, city, category);
CREATE INDEX idx_demand_trends_city_category ON public.demand_trends(city, category, trend_type);

-- Enable RLS
ALTER TABLE public.demand_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_trends ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins can manage, users can view
CREATE POLICY "Admins can manage demand analytics" ON public.demand_analytics FOR ALL USING (is_admin());
CREATE POLICY "Users can view demand analytics" ON public.demand_analytics FOR SELECT USING (true);

CREATE POLICY "Admins can manage demand predictions" ON public.demand_predictions FOR ALL USING (is_admin());
CREATE POLICY "Users can view demand predictions" ON public.demand_predictions FOR SELECT USING (true);

CREATE POLICY "Admins can manage demand trends" ON public.demand_trends FOR ALL USING (is_admin());
CREATE POLICY "Users can view demand trends" ON public.demand_trends FOR SELECT USING (true);

-- Function to aggregate booking data for demand analysis
CREATE OR REPLACE FUNCTION public.aggregate_demand_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to calculate demand predictions
CREATE OR REPLACE FUNCTION public.calculate_demand_predictions(prediction_days INTEGER DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
    WITH trend_data AS (
      SELECT 
        date,
        booking_count,
        ROW_NUMBER() OVER (ORDER BY date) as day_num
      FROM public.demand_analytics
      WHERE city = city_cat_record.city 
      AND category = city_cat_record.category
      AND date >= CURRENT_DATE - INTERVAL '14 days'
    )
    SELECT COALESCE(
      (COUNT(*) * SUM(day_num * booking_count) - SUM(day_num) * SUM(booking_count)) / 
      NULLIF(COUNT(*) * SUM(day_num * day_num) - SUM(day_num) * SUM(day_num), 0), 
      0
    ) INTO trend_factor
    FROM trend_data;
    
    -- Simple seasonality factor (day of week pattern)
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

-- Create updated_at trigger
CREATE TRIGGER update_demand_analytics_updated_at
  BEFORE UPDATE ON public.demand_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();