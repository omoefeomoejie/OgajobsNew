-- Comprehensive Analytics Tables and Functions Implementation

-- 1. FRAUD DETECTION SYSTEM
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  fraud_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'false_positive')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  frequency INTEGER NOT NULL DEFAULT 1,
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. QUALITY PREDICTION SYSTEM
CREATE TABLE IF NOT EXISTS public.quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_rating NUMERIC(3,2) CHECK (predicted_rating >= 0 AND predicted_rating <= 5),
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  completion_probability NUMERIC(5,2) CHECK (completion_probability >= 0 AND completion_probability <= 100),
  on_time_probability NUMERIC(5,2) CHECK (on_time_probability >= 0 AND on_time_probability <= 100),
  quality_score NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
  risk_factors TEXT[] DEFAULT '{}',
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'declining', 'stable')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quality_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_outcome TEXT CHECK (predicted_outcome IN ('excellent', 'good', 'average', 'poor')),
  success_probability NUMERIC(5,2) CHECK (success_probability >= 0 AND success_probability <= 100),
  quality_factors JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RECOMMENDATION ENGINE
CREATE TABLE IF NOT EXISTS public.artisan_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  match_score NUMERIC(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  distance_km NUMERIC(8,2),
  price_estimate NUMERIC(12,2),
  availability_score NUMERIC(5,2) CHECK (availability_score >= 0 AND availability_score <= 100),
  booking_probability NUMERIC(5,2) CHECK (booking_probability >= 0 AND booking_probability <= 100),
  recommendation_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS public.service_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_service TEXT NOT NULL,
  recommendation_score NUMERIC(5,2) CHECK (recommendation_score >= 0 AND recommendation_score <= 100),
  predicted_budget NUMERIC(12,2),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'normal', 'high', 'emergency')),
  reason TEXT,
  historical_pattern TEXT,
  seasonal_factor NUMERIC(3,2) DEFAULT 1.0,
  location_match BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);

CREATE TABLE IF NOT EXISTS public.cross_sell_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_service TEXT NOT NULL,
  additional_services TEXT[] DEFAULT '{}',
  bundle_value NUMERIC(12,2),
  probability_score NUMERIC(5,2) CHECK (probability_score >= 0 AND probability_score <= 100),
  timing_recommendation TEXT,
  revenue_potential NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- 4. PREDICTIVE ANALYTICS
CREATE TABLE IF NOT EXISTS public.market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  trend_direction TEXT CHECK (trend_direction IN ('increasing', 'decreasing', 'stable')),
  growth_rate NUMERIC(5,2),
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  period TEXT NOT NULL,
  forecast_data JSONB DEFAULT '{}',
  key_drivers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_lifetime_value (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL,
  current_clv NUMERIC(12,2),
  predicted_clv NUMERIC(12,2),
  clv_trend TEXT CHECK (clv_trend IN ('increasing', 'decreasing', 'stable')),
  acquisition_cost NUMERIC(12,2),
  retention_rate NUMERIC(5,2) CHECK (retention_rate >= 0 AND retention_rate <= 100),
  average_order_value NUMERIC(12,2),
  frequency NUMERIC(5,2),
  churn_risk NUMERIC(5,2) CHECK (churn_risk >= 0 AND churn_risk <= 100),
  recommendations TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT CHECK (user_type IN ('client', 'artisan')),
  churn_probability NUMERIC(5,2) CHECK (churn_probability >= 0 AND churn_probability <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  key_indicators TEXT[] DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE,
  predicted_churn_date DATE,
  retention_strategies TEXT[] DEFAULT '{}',
  value_at_risk NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  current_value NUMERIC(15,2),
  predicted_value NUMERIC(15,2),
  change_percentage NUMERIC(5,2),
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
  confidence_interval JSONB DEFAULT '{}',
  factors_influencing TEXT[] DEFAULT '{}',
  forecast_period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PRICING SYSTEM TABLES (Already exist but let's ensure they're complete)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  adjustment_value NUMERIC(5,2) NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL,
  final_price NUMERIC(12,2) NOT NULL,
  applied_rules JSONB DEFAULT '[]',
  calculation_factors JSONB DEFAULT '{}',
  demand_score INTEGER,
  supply_score INTEGER,
  booking_id UUID REFERENCES public.bookings(id),
  client_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. SERVICE PRICING TRANSPARENCY
CREATE TABLE IF NOT EXISTS public.service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  city TEXT NOT NULL,
  min_price NUMERIC(12,2) NOT NULL,
  max_price NUMERIC(12,2) NOT NULL,
  recommended_price NUMERIC(12,2),
  price_factors TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_category, subcategory, city)
);

-- 7. PORTFOLIO ANALYTICS
CREATE TABLE IF NOT EXISTS public.portfolio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  view_date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(portfolio_id, view_date)
);

-- Enable RLS on all tables
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics Tables
-- Admins can manage all analytics data
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage behavior patterns" ON public.behavior_patterns FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quality metrics" ON public.quality_metrics FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quality predictions" ON public.quality_predictions FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage artisan recommendations" ON public.artisan_recommendations FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage service recommendations" ON public.service_recommendations FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage cross sell opportunities" ON public.cross_sell_opportunities FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage market trends" ON public.market_trends FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage customer lifetime value" ON public.customer_lifetime_value FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage churn predictions" ON public.churn_predictions FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage business forecasts" ON public.business_forecasts FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage pricing calculations" ON public.pricing_calculations FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage service pricing" ON public.service_pricing FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage portfolio analytics" ON public.portfolio_analytics FOR ALL USING (is_admin());

-- Users can view their own data
CREATE POLICY "Users can view their fraud alerts" ON public.fraud_alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view their behavior patterns" ON public.behavior_patterns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Artisans can view their quality metrics" ON public.quality_metrics FOR SELECT USING (artisan_id = auth.uid());
CREATE POLICY "Users can view recommendations for them" ON public.artisan_recommendations FOR SELECT USING (client_id = auth.uid() OR artisan_id = auth.uid());
CREATE POLICY "Users can view service recommendations for them" ON public.service_recommendations FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users can view cross sell opportunities for them" ON public.cross_sell_opportunities FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users can view their CLV data" ON public.customer_lifetime_value FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view their churn predictions" ON public.churn_predictions FOR SELECT USING (user_id = auth.uid());

-- Public read access for market data
CREATE POLICY "Public can view market trends" ON public.market_trends FOR SELECT USING (true);
CREATE POLICY "Public can view service pricing" ON public.service_pricing FOR SELECT USING (true);
CREATE POLICY "Public can view pricing calculations" ON public.pricing_calculations FOR SELECT USING (true);

-- Portfolio analytics policies
CREATE POLICY "Portfolio owners can view analytics" ON public.portfolio_analytics FOR SELECT USING (
  portfolio_id IN (SELECT id FROM public.portfolios WHERE artisan_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_risk_score ON public.fraud_alerts(risk_score);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user_id ON public.behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_risk_level ON public.behavior_patterns(risk_level);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_artisan_id ON public.quality_metrics(artisan_id);
CREATE INDEX IF NOT EXISTS idx_quality_predictions_booking_id ON public.quality_predictions(booking_id);
CREATE INDEX IF NOT EXISTS idx_artisan_recommendations_client_id ON public.artisan_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_artisan_recommendations_artisan_id ON public.artisan_recommendations(artisan_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_client_id ON public.service_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_cross_sell_opportunities_client_id ON public.cross_sell_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_category_location ON public.market_trends(category, location);
CREATE INDEX IF NOT EXISTS idx_customer_lifetime_value_user_id ON public.customer_lifetime_value(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_user_id ON public.churn_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk_level ON public.churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_pricing_calculations_service_category ON public.pricing_calculations(service_category);
CREATE INDEX IF NOT EXISTS idx_service_pricing_category_city ON public.service_pricing(service_category, city);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_portfolio_date ON public.portfolio_analytics(portfolio_id, view_date);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_behavior_patterns_updated_at BEFORE UPDATE ON public.behavior_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_trends_updated_at BEFORE UPDATE ON public.market_trends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_lifetime_value_updated_at BEFORE UPDATE ON public.customer_lifetime_value FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_churn_predictions_updated_at BEFORE UPDATE ON public.churn_predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_forecasts_updated_at BEFORE UPDATE ON public.business_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_analytics_updated_at BEFORE UPDATE ON public.portfolio_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO public.service_pricing (service_category, subcategory, city, min_price, max_price, recommended_price, price_factors) VALUES
('Plumbing', 'Basic Repairs', 'Lagos', 5000, 25000, 12000, ARRAY['Material cost', 'Labor time', 'Location accessibility']),
('Plumbing', 'Installation', 'Lagos', 15000, 100000, 45000, ARRAY['Material cost', 'Complexity', 'Labor time']),
('Electrical', 'Basic Wiring', 'Lagos', 8000, 50000, 25000, ARRAY['Wire quality', 'Distance', 'Safety requirements']),
('Cleaning', 'House Cleaning', 'Lagos', 5000, 20000, 10000, ARRAY['House size', 'Deep cleaning', 'Frequency']),
('Painting', 'Interior', 'Lagos', 20000, 150000, 75000, ARRAY['Paint quality', 'Room size', 'Preparation work']),
('Carpentry', 'Furniture Repair', 'Lagos', 10000, 80000, 35000, ARRAY['Material type', 'Complexity', 'Finishing quality']);

-- Insert initial pricing rules
INSERT INTO public.pricing_rules (name, description, category, rule_type, adjustment_value, priority, conditions) VALUES
('Peak Hours Multiplier', 'Increase pricing during peak hours (8-10 AM, 5-7 PM)', 'time', 'multiplier', 1.2, 10, '{"hours": [8,9,17,18]}'),
('Emergency Surcharge', 'Additional charge for emergency services', 'urgency', 'multiplier', 2.0, 20, '{"urgency": "emergency"}'),
('High Demand Adjustment', 'Increase price when demand is high', 'demand', 'multiplier', 1.5, 15, '{"demand_level": [4,5]}'),
('Weekend Premium', 'Weekend service premium', 'time', 'multiplier', 1.3, 8, '{"days": ["saturday", "sunday"]}'),
('Distance Surcharge', 'Additional charge for distant locations', 'distance', 'addition', 2000, 5, '{"distance_km": ">20"}');

-- Analytics summary functions
CREATE OR REPLACE FUNCTION get_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_bookings INTEGER;
  total_revenue NUMERIC;
  active_artisans INTEGER;
  avg_rating NUMERIC;
  completion_rate NUMERIC;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_bookings FROM public.bookings 
  WHERE created_at >= now() - (days_back || ' days')::INTERVAL;
  
  SELECT COALESCE(SUM(budget), 0) INTO total_revenue FROM public.bookings 
  WHERE created_at >= now() - (days_back || ' days')::INTERVAL AND status = 'completed';
  
  SELECT COUNT(DISTINCT id) INTO active_artisans FROM public.artisans WHERE suspended = false;
  
  SELECT COALESCE(AVG(rating), 0) INTO avg_rating FROM public.artisan_reviews;
  
  SELECT CASE WHEN total_bookings > 0 THEN 
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed' AND created_at >= now() - (days_back || ' days')::INTERVAL)::NUMERIC / total_bookings * 100
    ELSE 0 END INTO completion_rate;
  
  result := jsonb_build_object(
    'total_bookings', total_bookings,
    'total_revenue', total_revenue,
    'active_artisans', active_artisans,
    'average_rating', ROUND(avg_rating, 2),
    'completion_rate', ROUND(completion_rate, 2),
    'period_days', days_back,
    'generated_at', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;