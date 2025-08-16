-- Security Fix Migration: Critical RLS and Function Security
-- Phase 1: Secure database functions by fixing search_path vulnerabilities

-- Fix function search paths to prevent SQL injection
CREATE OR REPLACE FUNCTION public.calculate_agent_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Update other critical functions
CREATE OR REPLACE FUNCTION public.calculate_trust_score(artisan_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Create proper RLS policies for missing tables
-- Fix market_conditions table access
DROP POLICY IF EXISTS "Users can view market conditions" ON public.market_conditions;
CREATE POLICY "Users can view market conditions" 
ON public.market_conditions 
FOR SELECT 
USING (true);

-- Secure demand_analytics with proper admin access
DROP POLICY IF EXISTS "Admins can manage demand analytics" ON public.demand_analytics;
CREATE POLICY "Admins can manage demand analytics" 
ON public.demand_analytics 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add RLS policy for demand_predictions
DROP POLICY IF EXISTS "Users can view demand predictions" ON public.demand_predictions;
CREATE POLICY "Users can view demand predictions" 
ON public.demand_predictions 
FOR SELECT 
USING (true);

-- Secure audit_logs properly
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.is_admin());

-- Add missing RLS for escrow_payments
DROP POLICY IF EXISTS "Users can view their escrow payments" ON public.escrow_payments;
CREATE POLICY "Users can view their escrow payments" 
ON public.escrow_payments 
FOR SELECT 
USING ((client_id = auth.uid()) OR (artisan_id = auth.uid()) OR public.is_admin());

-- Add missing RLS for earnings table
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.earnings;
CREATE POLICY "Users can view their own earnings v2" 
ON public.earnings 
FOR SELECT 
USING ((artisan_id = auth.uid()) OR (client_id = auth.uid()) OR public.is_admin());

-- Create secure function for getting user role to prevent recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;