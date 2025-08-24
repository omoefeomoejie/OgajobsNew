-- Fix remaining security linter issues

-- 1. Fix RLS policies for tables that have RLS enabled but no policies
-- Add policies for data_access_logs (just created)
CREATE POLICY "Users can view their own access logs" 
ON public.data_access_logs 
FOR SELECT 
USING (user_id = auth.uid());

-- Add missing policies for any other tables that need them
CREATE POLICY "Security events - users can view their own events" 
ON public.security_events 
FOR SELECT 
USING (user_id = auth.uid());

-- 2. Fix remaining functions with mutable search_path
CREATE OR REPLACE FUNCTION public.log_security_violation(violation_type text, details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    violation_type,
    auth.uid(),
    details,
    'high'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_access(required_action text DEFAULT 'general'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user role securely
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user is admin
  IF user_role != 'admin' THEN
    -- Log unauthorized access attempt
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_details,
      severity
    ) VALUES (
      'unauthorized_admin_access',
      auth.uid(),
      jsonb_build_object('action', required_action, 'timestamp', now()),
      'high'
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_attempts integer DEFAULT 10, window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    PERFORM public.log_security_violation(
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
$$;

CREATE OR REPLACE FUNCTION public.calculate_agent_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    agent_record RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Only process when booking is completed and payment is successful
    IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
        -- Find the agent who referred this artisan
        SELECT ar.agent_id, pa.commission_rate, ar.id as referral_id
        INTO agent_record
        FROM public.agent_referrals ar
        JOIN public.pos_agents pa ON ar.agent_id = pa.id
        WHERE ar.artisan_id = NEW.artisan_id
        AND ar.verification_status = 'verified';
        
        IF FOUND THEN
            -- Calculate commission (percentage of booking amount)
            commission_amount := (NEW.total_amount * agent_record.commission_rate / 100);
            
            -- Insert commission transaction
            INSERT INTO public.commission_transactions (
                agent_id,
                artisan_id,
                booking_id,
                transaction_type,
                amount,
                commission_rate,
                base_amount,
                status
            ) VALUES (
                agent_record.agent_id,
                NEW.artisan_id,
                NEW.id,
                'job_commission',
                commission_amount,
                agent_record.commission_rate,
                NEW.total_amount,
                'pending'
            );
            
            -- Update agent's total commission earned
            UPDATE public.pos_agents 
            SET total_commission_earned = total_commission_earned + commission_amount,
                updated_at = NOW()
            WHERE id = agent_record.agent_id;
            
            -- Update referral record
            UPDATE public.agent_referrals 
            SET total_jobs_completed = total_jobs_completed + 1,
                total_commission_generated = total_commission_generated + commission_amount
            WHERE id = agent_record.referral_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_verification_level(artisan_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score INTEGER;
  level TEXT;
BEGIN
  SELECT trust_score INTO score FROM public.profiles WHERE id = artisan_user_id;
  
  IF score >= 80 THEN
    level := 'premium';
  ELSIF score >= 60 THEN
    level := 'standard';
  ELSIF score >= 30 THEN
    level := 'basic';
  ELSE
    level := 'unverified';
  END IF;
  
  UPDATE public.profiles 
  SET verification_level = level
  WHERE id = artisan_user_id;
  
  RETURN level;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive tables
  IF TG_TABLE_NAME IN ('artisan_payment_methods', 'identity_verifications', 'artisan_earnings_v2') THEN
    INSERT INTO public.audit_logs (
      table_name,
      operation,
      user_id,
      user_email,
      old_data,
      new_data,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      auth.email(),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_artisan_policy_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function can be called to notify the application about policy changes
  PERFORM pg_notify('artisan_policies_updated', json_build_object(
    'message', 'Artisan table security policies have been updated',
    'timestamp', now(),
    'action', 'Use artisans_public view for public data access'
  )::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_trust_score(artisan_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  identity_points INTEGER := 0;
  skills_points INTEGER := 0;
  performance_points INTEGER := 0;
  total_score INTEGER := 0;
  metrics RECORD;
BEGIN
  -- Get trust metrics
  SELECT * INTO metrics FROM public.trust_metrics WHERE artisan_id = artisan_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Identity verification (30 points max)
  IF metrics.identity_verified THEN
    identity_points := 30;
  END IF;
  
  -- Skills verification (25 points max)
  skills_points := LEAST(metrics.skills_verified * 5, 25);
  
  -- Performance metrics (45 points max)
  performance_points := LEAST(
    (metrics.average_rating * 10) + 
    (metrics.on_time_completion_rate * 0.15) + 
    (metrics.repeat_client_rate * 0.1) + 
    ((100 - metrics.dispute_rate) * 0.1) +
    (CASE WHEN metrics.response_time_hours <= 2 THEN 10 
          WHEN metrics.response_time_hours <= 6 THEN 7
          WHEN metrics.response_time_hours <= 24 THEN 5
          ELSE 0 END), 
    45
  );
  
  total_score := identity_points + skills_points + performance_points;
  
  -- Update the trust score
  UPDATE public.trust_metrics 
  SET trust_score = total_score, last_updated = now()
  WHERE artisan_id = artisan_user_id;
  
  -- Update profile trust score
  UPDATE public.profiles 
  SET trust_score = total_score
  WHERE id = artisan_user_id;
  
  RETURN total_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_performance_views_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins to refresh materialized views
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can refresh performance views';
  END IF;
  
  -- Refresh materialized views if they exist
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_artisan_performance') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_performance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_client_analytics') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_analytics;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_service_category_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_service_category_stats;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_monthly_metrics') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_monthly_metrics;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;