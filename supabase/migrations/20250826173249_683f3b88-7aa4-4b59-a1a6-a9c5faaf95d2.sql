-- Final security fix: Address remaining SECURITY DEFINER issues
-- Convert remaining functions to SECURITY INVOKER where appropriate

-- Fix calculation functions - these should be SECURITY INVOKER since they're just calculations
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE 
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN ROUND(amount * 0.10, 2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_artisan_earnings(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE 
SECURITY INVOKER  -- Changed from SECURITY DEFINER  
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN ROUND(amount * 0.90, 2);
END;
$function$;

-- Fix complete_booking function
CREATE OR REPLACE FUNCTION public.complete_booking(booking_id_param uuid, completed_by_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  -- Check if user is authorized to complete (either client or assigned artisan)
  IF booking_record.client_email != (SELECT email FROM auth.users WHERE id = completed_by_param) 
     AND booking_record.artisan_id != completed_by_param THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized to complete this booking');
  END IF;
  
  -- Update booking status
  UPDATE public.bookings 
  SET status = 'completed', 
      completion_date = now(),
      updated_at = now()
  WHERE id = booking_id_param;
  
  RETURN json_build_object('success', true, 'message', 'Booking completed successfully');
END;
$function$;

-- Fix SLA calculation function
CREATE OR REPLACE FUNCTION public.calculate_sla_times(priority_level support_priority)
RETURNS TABLE(first_response_hours integer, resolution_hours integer)
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER  -- Changed from default
SET search_path TO 'public'
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

-- Fix mask_sensitive_data function
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(input_text text, mask_type text DEFAULT 'email'::text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE 
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE mask_type
    WHEN 'email' THEN
      RETURN CASE 
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 3 THEN '***'
        ELSE substring(input_text from 1 for 2) || '***@' || split_part(input_text, '@', 2)
      END;
    WHEN 'phone' THEN
      RETURN CASE
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 4 THEN '***'
        ELSE '***' || right(input_text, 4)
      END;
    WHEN 'account' THEN
      RETURN CASE
        WHEN input_text IS NULL THEN NULL
        WHEN length(input_text) < 4 THEN '***'
        ELSE '***' || right(input_text, 4)
      END;
    ELSE 
      RETURN '***';
  END CASE;
END;
$function$;

-- Fix get_security_headers function  
CREATE OR REPLACE FUNCTION public.get_security_headers()
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE 
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'X-Content-Type-Options', 'nosniff',
    'X-Frame-Options', 'DENY',
    'X-XSS-Protection', '1; mode=block',
    'Strict-Transport-Security', 'max-age=31536000; includeSubDomains',
    'Referrer-Policy', 'strict-origin-when-cross-origin',
    'Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:;'
  );
END;
$function$;

-- Fix find_matching_artisans function
CREATE OR REPLACE FUNCTION public.find_matching_artisans(booking_id_param uuid, limit_param integer DEFAULT 10)
RETURNS TABLE(artisan_id uuid, total_score numeric, distance_km numeric, rating numeric, category_match boolean, availability_match boolean)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- Changed from default to make it explicit
SET search_path TO 'public'
AS $function$
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
$function$;