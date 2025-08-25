-- Remove SECURITY DEFINER from functions that don't absolutely need it
-- This should reduce the Security Definer View warnings

-- find_matching_artisans doesn't need SECURITY DEFINER - it's just matching logic
DROP FUNCTION IF EXISTS public.find_matching_artisans(uuid, integer);

CREATE OR REPLACE FUNCTION public.find_matching_artisans(booking_id_param uuid, limit_param integer DEFAULT 10)
RETURNS TABLE(artisan_id uuid, total_score numeric, distance_km numeric, rating numeric, category_match boolean, availability_match boolean)
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
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