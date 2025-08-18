-- Phase 1: Critical Security Fixes (Fixed)

-- 1. Create secure view for public artisan data (excluding PII)
CREATE OR REPLACE VIEW public.artisans_public_safe AS
SELECT 
  a.id,
  a.full_name,
  a.city,
  a.category,
  a.skill,
  a.photo_url,
  a.profile_url,
  a.slug,
  a.created_at,
  a.suspended,
  p.verification_level,
  COALESCE(tm.average_rating, 0) as average_rating,
  COALESCE(review_counts.total_reviews, 0) as total_reviews
FROM public.artisans a
LEFT JOIN public.profiles p ON a.id = p.id
LEFT JOIN public.trust_metrics tm ON a.id = tm.artisan_id
LEFT JOIN (
  SELECT artisan_id, COUNT(*) as total_reviews
  FROM public.artisan_reviews
  GROUP BY artisan_id
) review_counts ON a.id = review_counts.artisan_id
WHERE a.suspended = false;

-- 2. Update artisan RLS policies to restrict PII access
DROP POLICY IF EXISTS "Public can view basic artisan info" ON public.artisans;

-- New policy that restricts PII fields for public access
CREATE POLICY "Public can view basic artisan info (no PII)" ON public.artisans
FOR SELECT USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false  -- No public access to artisans table directly
    WHEN auth.uid() = id THEN true      -- Artisans can see their own data
    WHEN is_admin() THEN true           -- Admins can see all
    WHEN EXISTS(                        -- Clients with bookings can see contact info
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
    ) THEN true
    ELSE false
  END
);

-- 3. Fix database functions with missing search_path
CREATE OR REPLACE FUNCTION public.aggregate_demand_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.update_market_conditions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 4. Create security events table for logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  event_details JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events" ON public.security_events
FOR SELECT USING (public.is_admin());

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_details JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    p_event_type,
    auth.uid(),
    p_event_details,
    p_severity
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;