-- Automated Artisan Matching Algorithm Database Schema

-- Create matching preferences table
CREATE TABLE public.matching_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  max_distance_km INTEGER DEFAULT 50,
  min_rating NUMERIC(2,1) DEFAULT 0.0,
  max_budget NUMERIC(10,2),
  preferred_categories TEXT[],
  availability_requirements JSONB, -- {"days": ["monday", "tuesday"], "time_ranges": [{"start": "09:00", "end": "17:00"}]}
  urgent_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create artisan availability table
CREATE TABLE public.artisan_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artisan_id, day_of_week, start_time, end_time)
);

-- Create matching scores table for tracking algorithm performance
CREATE TABLE public.matching_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  distance_score NUMERIC(5,2) DEFAULT 0,
  rating_score NUMERIC(5,2) DEFAULT 0,
  availability_score NUMERIC(5,2) DEFAULT 0,
  category_score NUMERIC(5,2) DEFAULT 0,
  price_score NUMERIC(5,2) DEFAULT 0,
  workload_score NUMERIC(5,2) DEFAULT 0,
  response_time_score NUMERIC(5,2) DEFAULT 0,
  algorithm_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking assignments tracking
CREATE TABLE public.booking_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'auto_matched', -- 'auto_matched', 'manual_assigned', 'artisan_applied'
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  artisan_response_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matching_preferences
CREATE POLICY "Users can manage their own matching preferences" ON public.matching_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for artisan_availability
CREATE POLICY "Artisans can manage their own availability" ON public.artisan_availability
  FOR ALL USING (artisan_id = auth.uid());

CREATE POLICY "Public can view artisan availability" ON public.artisan_availability
  FOR SELECT USING (true);

-- RLS Policies for matching_scores
CREATE POLICY "Admins can view all matching scores" ON public.matching_scores
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can view scores for their bookings" ON public.matching_scores
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE client_email = auth.email() OR artisan_id = auth.uid()
    )
  );

-- RLS Policies for booking_assignments
CREATE POLICY "Users can view assignments for their bookings/jobs" ON public.booking_assignments
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE client_email = auth.email() OR artisan_id = auth.uid()
    ) OR artisan_id = auth.uid()
  );

CREATE POLICY "Artisans can update their assignment responses" ON public.booking_assignments
  FOR UPDATE USING (artisan_id = auth.uid());

CREATE POLICY "Admins can manage all assignments" ON public.booking_assignments
  FOR ALL USING (is_admin());

-- Update triggers
CREATE TRIGGER update_matching_preferences_updated_at
  BEFORE UPDATE ON public.matching_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artisan_availability_updated_at
  BEFORE UPDATE ON public.artisan_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_assignments_updated_at
  BEFORE UPDATE ON public.booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate distance between two points (simplified)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC, lon1 NUMERIC, 
  lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
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
$$;

-- Main artisan matching function
CREATE OR REPLACE FUNCTION public.find_matching_artisans(
  booking_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE(
  artisan_id UUID,
  total_score NUMERIC,
  distance_km NUMERIC,
  rating NUMERIC,
  category_match BOOLEAN,
  availability_match BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
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
  FROM artisans a
  LEFT JOIN trust_metrics tm ON a.id = tm.artisan_id
  
  -- Distance scoring (closer = higher score)
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN client_location ? 'lat' AND client_location ? 'lng' 
        THEN public.calculate_distance(
          (client_location->>'lat')::numeric,
          (client_location->>'lng')::numeric,
          0, -- Default artisan location, would need proper location data
          0
        )
        ELSE 999999
      END as distance,
      CASE 
        WHEN client_location ? 'lat' AND client_location ? 'lng' 
        THEN GREATEST(0, 100 - public.calculate_distance(
          (client_location->>'lat')::numeric,
          (client_location->>'lng')::numeric,
          0, 0
        ))
        ELSE 0
      END as score
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
          SELECT 1 FROM artisan_availability aa 
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
        THEN GREATEST(0, 100 - ABS(COALESCE(booking_budget, 0) - COALESCE(a.id::numeric, 0)))
        ELSE 50 
      END as score
  ) price_score ON true
  
  -- Workload scoring (fewer active jobs = higher score)
  LEFT JOIN LATERAL (
    SELECT 
      GREATEST(0, 100 - (
        SELECT COUNT(*) * 20 
        FROM bookings b 
        WHERE b.artisan_id = a.id 
        AND b.status IN ('pending', 'in_progress')
      )) as score
  ) workload_score ON true
  
  WHERE a.suspended = false
  ORDER BY total_score DESC
  LIMIT limit_param;
END;
$$;

-- Function to auto-assign artisans to bookings
CREATE OR REPLACE FUNCTION public.auto_assign_artisans(
  booking_id_param UUID,
  max_assignments INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    -- Log matching score
    INSERT INTO public.matching_scores (
      booking_id,
      artisan_id,
      total_score,
      distance_score,
      rating_score,
      category_score,
      availability_score
    ) VALUES (
      booking_id_param,
      artisan_record.artisan_id,
      artisan_record.total_score,
      GREATEST(0, 100 - artisan_record.distance_km),
      artisan_record.rating * 20,
      CASE WHEN artisan_record.category_match THEN 100 ELSE 0 END,
      CASE WHEN artisan_record.availability_match THEN 100 ELSE 0 END
    );
    
    assignment_count := assignment_count + 1;
  END LOOP;
  
  RETURN assignment_count;
END;
$$;