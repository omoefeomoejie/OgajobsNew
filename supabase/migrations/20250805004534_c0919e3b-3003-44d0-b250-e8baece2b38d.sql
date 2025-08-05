-- Dynamic Pricing System Tables

-- Pricing rules configuration
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'base', 'demand', 'supply', 'location', 'time', 'seasonal'
  rule_type TEXT NOT NULL, -- 'multiplier', 'fixed_adjustment', 'percentage'
  conditions JSONB NOT NULL DEFAULT '{}', -- Conditions when rule applies
  adjustment_value NUMERIC NOT NULL, -- The adjustment amount/percentage/multiplier
  priority INTEGER NOT NULL DEFAULT 1, -- Higher priority rules apply first
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dynamic pricing calculations log
CREATE TABLE public.pricing_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_category TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  applied_rules JSONB NOT NULL DEFAULT '[]', -- Array of applied rule details
  calculation_factors JSONB NOT NULL DEFAULT '{}', -- Factors used in calculation
  location_data JSONB,
  demand_score NUMERIC,
  supply_score NUMERIC,
  time_factors JSONB,
  booking_id UUID,
  artisan_id UUID,
  client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Real-time pricing adjustments
CREATE TABLE public.pricing_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_category TEXT NOT NULL,
  city TEXT NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'surge', 'discount', 'seasonal'
  adjustment_value NUMERIC NOT NULL,
  reason TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market conditions tracking
CREATE TABLE public.market_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  service_category TEXT NOT NULL,
  date DATE NOT NULL,
  hour_of_day INTEGER NOT NULL,
  demand_level INTEGER NOT NULL CHECK (demand_level >= 1 AND demand_level <= 5), -- 1=very low, 5=very high
  supply_level INTEGER NOT NULL CHECK (supply_level >= 1 AND supply_level <= 5),
  average_response_time NUMERIC, -- in minutes
  completion_rate NUMERIC, -- percentage
  price_sensitivity NUMERIC, -- how price-sensitive customers are
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, service_category, date, hour_of_day)
);

-- Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
FOR ALL USING (is_admin());

CREATE POLICY "Users can view active pricing rules" ON public.pricing_rules
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all pricing calculations" ON public.pricing_calculations
FOR SELECT USING (is_admin());

CREATE POLICY "Users can view their own pricing calculations" ON public.pricing_calculations
FOR SELECT USING (client_id = auth.uid() OR artisan_id = auth.uid());

CREATE POLICY "System can create pricing calculations" ON public.pricing_calculations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage pricing adjustments" ON public.pricing_adjustments
FOR ALL USING (is_admin());

CREATE POLICY "Users can view active pricing adjustments" ON public.pricing_adjustments
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage market conditions" ON public.market_conditions
FOR ALL USING (is_admin());

CREATE POLICY "Users can view market conditions" ON public.market_conditions
FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_pricing_rules_category ON public.pricing_rules(category, is_active);
CREATE INDEX idx_pricing_rules_priority ON public.pricing_rules(priority DESC);
CREATE INDEX idx_pricing_calculations_service ON public.pricing_calculations(service_category, created_at);
CREATE INDEX idx_pricing_adjustments_location ON public.pricing_adjustments(city, service_category, is_active);
CREATE INDEX idx_market_conditions_lookup ON public.market_conditions(city, service_category, date, hour_of_day);

-- Triggers for updated_at
CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_adjustments_updated_at
BEFORE UPDATE ON public.pricing_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Dynamic pricing calculation function
CREATE OR REPLACE FUNCTION public.calculate_dynamic_price(
  p_service_category TEXT,
  p_base_price NUMERIC,
  p_city TEXT,
  p_booking_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_client_id UUID DEFAULT NULL,
  p_booking_urgency TEXT DEFAULT 'normal'
) RETURNS JSON AS $$
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
  
  -- Apply pricing rules in priority order
  FOR rule_record IN 
    SELECT * FROM public.pricing_rules 
    WHERE is_active = true 
    AND (valid_until IS NULL OR valid_until > p_booking_time)
    AND valid_from <= p_booking_time
    ORDER BY priority DESC
  LOOP
    -- Check if rule conditions are met (simplified logic)
    IF rule_record.category = 'demand' AND market_data.demand_level >= 4 THEN
      final_price := final_price * rule_record.adjustment_value;
      applied_rules := array_append(applied_rules, json_build_object(
        'rule_id', rule_record.id,
        'rule_name', rule_record.name,
        'adjustment', rule_record.adjustment_value
      ));
    ELSIF rule_record.category = 'time' AND 
          (current_hour BETWEEN 8 AND 10 OR current_hour BETWEEN 17 AND 19) THEN
      final_price := final_price * rule_record.adjustment_value;
      applied_rules := array_append(applied_rules, json_build_object(
        'rule_id', rule_record.id,
        'rule_name', rule_record.name,
        'adjustment', rule_record.adjustment_value
      ));
    END IF;
  END LOOP;
  
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
    'market_conditions', market_data,
    'hour_of_day', current_hour,
    'day_of_week', current_dow
  );
  
  -- Log the calculation
  INSERT INTO public.pricing_calculations (
    service_category,
    base_price,
    final_price,
    applied_rules,
    calculation_factors,
    demand_score,
    supply_score,
    client_id
  ) VALUES (
    p_service_category,
    p_base_price,
    final_price,
    to_jsonb(applied_rules),
    calculation_factors,
    market_data.demand_level,
    market_data.supply_level,
    p_client_id
  );
  
  RETURN json_build_object(
    'base_price', p_base_price,
    'final_price', final_price,
    'applied_rules', applied_rules,
    'calculation_factors', calculation_factors,
    'savings_percentage', ROUND(((p_base_price - final_price) / p_base_price * 100)::NUMERIC, 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update market conditions based on booking patterns
CREATE OR REPLACE FUNCTION public.update_market_conditions() RETURNS void AS $$
DECLARE
  city_category_record RECORD;
  booking_count INTEGER;
  artisan_count INTEGER;
  avg_response_time NUMERIC;
  completion_rate NUMERIC;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;