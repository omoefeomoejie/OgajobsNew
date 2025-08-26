-- Final comprehensive security definer fix
-- Address all remaining functions that should be SECURITY INVOKER

-- Fix the increment_portfolio_views function
CREATE OR REPLACE FUNCTION public.increment_portfolio_views(portfolio_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update main portfolio view count
  UPDATE public.portfolios 
  SET portfolio_views = portfolio_views + 1,
      updated_at = now()
  WHERE id = portfolio_id_param;
  
  -- Update daily analytics
  INSERT INTO public.portfolio_analytics (portfolio_id, view_date, total_views)
  VALUES (portfolio_id_param, CURRENT_DATE, 1)
  ON CONFLICT (portfolio_id, view_date)
  DO UPDATE SET total_views = portfolio_analytics.total_views + 1;
END;
$function$;

-- Fix the auto_assign_artisans function
CREATE OR REPLACE FUNCTION public.auto_assign_artisans(booking_id_param uuid, max_assignments integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix check_rate_limit_secure function
CREATE OR REPLACE FUNCTION public.check_rate_limit_secure(operation_type text, max_attempts integer DEFAULT 10, window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type = operation_type
    AND created_at > window_start;
    
  IF attempt_count >= max_attempts THEN
    PERFORM log_security_violation(
      'rate_limit_exceeded',
      jsonb_build_object(
        'operation', operation_type,
        'attempts', attempt_count,
        'window_minutes', window_minutes
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Fix cleanup_old_typing_indicators function
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.live_chat_typing 
  WHERE created_at < now() - INTERVAL '10 seconds';
END;
$function$;

-- Check if there are any views causing issues - let's recreate key views to ensure they're secure
DROP VIEW IF EXISTS public.artisans_directory CASCADE;
CREATE VIEW public.artisans_directory AS
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.skill,
  a.city,
  a.photo_url,
  a.profile_url,
  a.slug,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews,
  a.suspended,
  a.created_at
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- Ensure no RLS is enabled on the view (views inherit from underlying tables)
-- The view itself doesn't need RLS as the underlying tables have proper RLS

-- Final security check - ensure all sensitive functions maintain appropriate SECURITY DEFINER only where needed
-- Keep these functions as SECURITY DEFINER because they need elevated privileges

-- Re-confirm key auth functions remain SECURITY DEFINER (these SHOULD be SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER  -- Must remain SECURITY DEFINER for auth
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER  -- Must remain SECURITY DEFINER for RLS policies
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT public.get_user_role(auth.uid()) = 'admin');
END;
$function$;