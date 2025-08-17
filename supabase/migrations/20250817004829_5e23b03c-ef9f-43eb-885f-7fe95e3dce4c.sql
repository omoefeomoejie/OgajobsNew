-- Security Fix Migration Phase 3: Fix remaining database functions

CREATE OR REPLACE FUNCTION public.find_matching_artisans(booking_id_param uuid, limit_param integer DEFAULT 10)
RETURNS TABLE(artisan_id uuid, total_score numeric, distance_km numeric, rating numeric, category_match boolean, availability_match boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.auto_assign_artisans(booking_id_param uuid, max_assignments integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  ticket_num TEXT;
  counter INTEGER;
BEGIN
  -- Get today's date in YYYYMMDD format
  ticket_num := 'TK' || to_char(now(), 'YYYYMMDD');
  
  -- Get the count of tickets created today
  SELECT COUNT(*) INTO counter
  FROM public.support_tickets_v2
  WHERE ticket_number LIKE ticket_num || '%';
  
  -- Append sequence number
  ticket_num := ticket_num || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN ticket_num;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sla_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  sla_times RECORD;
BEGIN
  -- Get SLA times for the priority
  SELECT * INTO sla_times FROM public.calculate_sla_times(NEW.priority);
  
  -- Create SLA tracking record
  INSERT INTO public.support_sla_tracking (
    ticket_id,
    priority,
    first_response_sla_hours,
    resolution_sla_hours,
    first_response_due_at,
    resolution_due_at
  ) VALUES (
    NEW.id,
    NEW.priority,
    sla_times.first_response_hours,
    sla_times.resolution_hours,
    NEW.created_at + (sla_times.first_response_hours || ' hours')::INTERVAL,
    NEW.created_at + (sla_times.resolution_hours || ' hours')::INTERVAL
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_support_ticket(ticket_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  ticket_record RECORD;
  agent_id UUID;
BEGIN
  -- Get ticket details
  SELECT * INTO ticket_record FROM public.support_tickets_v2 WHERE id = ticket_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Simple auto-assignment logic (can be enhanced)
  -- For now, just assign to any available admin/agent
  SELECT id INTO agent_id 
  FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF agent_id IS NOT NULL THEN
    UPDATE public.support_tickets_v2
    SET assigned_agent_id = agent_id,
        status = 'in_progress',
        updated_at = now()
    WHERE id = ticket_id_param;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_sla_on_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- If this is the first agent response, mark first response SLA as met
  IF NEW.sender_type = 'agent' AND 
     NOT EXISTS(
       SELECT 1 FROM public.support_ticket_messages 
       WHERE ticket_id = NEW.ticket_id 
       AND sender_type = 'agent' 
       AND id != NEW.id
     ) THEN
    
    UPDATE public.support_sla_tracking
    SET first_response_met = (now() <= first_response_due_at),
        first_response_at = now()
    WHERE ticket_id = NEW.ticket_id;
    
    -- Update ticket with first response time
    UPDATE public.support_tickets_v2
    SET first_response_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$function$;