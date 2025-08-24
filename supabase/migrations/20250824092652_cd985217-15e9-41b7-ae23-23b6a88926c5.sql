-- Final security fixes to resolve remaining linter issues

-- Fix all remaining functions with mutable search_path
-- Check and fix all functions that might be missing search_path

CREATE OR REPLACE FUNCTION public.onboard_artisan_by_agent(p_agent_user_id uuid, p_artisan_name character varying, p_artisan_phone character varying, p_artisan_email character varying, p_service_category character varying, p_location jsonb, p_referral_code character varying DEFAULT NULL::character varying)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_agent_id UUID;
    v_artisan_id UUID;
    v_user_id UUID;
    v_referral_code VARCHAR;
    result JSONB;
BEGIN
    -- Get agent ID
    SELECT id INTO v_agent_id 
    FROM public.pos_agents 
    WHERE user_id = p_agent_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Agent not found');
    END IF;
    
    -- Generate referral code if not provided
    IF p_referral_code IS NULL THEN
        v_referral_code := 'REF_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
    ELSE
        v_referral_code := p_referral_code;
    END IF;
    
    -- Create artisan record (simplified - no direct auth.users access)
    INSERT INTO public.artisans (
        email,
        phone,
        full_name,
        category,
        city
    ) VALUES (
        p_artisan_email,
        p_artisan_phone,
        p_artisan_name,
        p_service_category,
        (p_location->>'city')::text
    ) RETURNING id INTO v_artisan_id;
    
    -- Create referral record
    INSERT INTO public.agent_referrals (
        agent_id,
        artisan_id,
        referral_code,
        verification_status
    ) VALUES (
        v_agent_id,
        v_artisan_id,
        v_referral_code,
        'pending'
    );
    
    -- Update agent's total artisans onboarded
    UPDATE public.pos_agents 
    SET total_artisans_onboarded = total_artisans_onboarded + 1,
        updated_at = NOW()
    WHERE id = v_agent_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'artisan_id', v_artisan_id,
        'referral_code', v_referral_code,
        'message', 'Artisan onboarded successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agent_dashboard_stats(p_agent_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_agent_id UUID;
    v_stats JSONB;
BEGIN
    -- Get agent ID
    SELECT id INTO v_agent_id 
    FROM public.pos_agents 
    WHERE user_id = p_agent_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Agent not found');
    END IF;
    
    -- Build comprehensive stats
    SELECT jsonb_build_object(
        'total_artisans', COALESCE(COUNT(ar.id), 0),
        'active_artisans', COALESCE(COUNT(ar.id) FILTER (WHERE ar.verification_status = 'verified'), 0),
        'pending_artisans', COALESCE(COUNT(ar.id) FILTER (WHERE ar.verification_status = 'pending'), 0),
        'total_commission_earned', COALESCE(pa.total_commission_earned, 0),
        'monthly_commission', COALESCE(SUM(ct.amount) FILTER (WHERE ct.created_at >= date_trunc('month', CURRENT_DATE)), 0),
        'pending_commission', COALESCE(SUM(ct.amount) FILTER (WHERE ct.status = 'pending'), 0),
        'total_jobs_facilitated', COALESCE(SUM(ar.total_jobs_completed), 0)
    ) INTO v_stats
    FROM public.pos_agents pa
    LEFT JOIN public.agent_referrals ar ON pa.id = ar.agent_id
    LEFT JOIN public.commission_transactions ct ON pa.id = ct.agent_id
    WHERE pa.id = v_agent_id
    GROUP BY pa.id, pa.total_commission_earned;
    
    RETURN v_stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user(uid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  delete from auth.users where id = uid;
$$;

CREATE OR REPLACE FUNCTION public.increment_portfolio_views(portfolio_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_sla_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_support_ticket(ticket_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_sla_on_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_security_headers()
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Add RLS policies for any remaining tables that might be missing them

-- Check if pos_agents table exists and has RLS but no policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_agents') THEN
        -- Add policies if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pos_agents') THEN
            CREATE POLICY "pos_agents_own_data" 
            ON public.pos_agents 
            FOR ALL 
            USING (user_id = auth.uid());
        END IF;
    END IF;
END $$;

-- Check if trust_metrics table exists and has proper policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_metrics') THEN
        -- Add policies if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trust_metrics' AND policyname = 'trust_metrics_artisan_access') THEN
            CREATE POLICY "trust_metrics_artisan_access" 
            ON public.trust_metrics 
            FOR ALL 
            USING (artisan_id = auth.uid() OR is_admin());
        END IF;
    END IF;
END $$;

-- Check if portfolios table exists and has proper policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolios') THEN
        -- Add policies if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'portfolios_owner_access') THEN
            CREATE POLICY "portfolios_owner_access" 
            ON public.portfolios 
            FOR ALL 
            USING (artisan_id = auth.uid() OR is_admin());
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'portfolios_public_view') THEN
            CREATE POLICY "portfolios_public_view" 
            ON public.portfolios 
            FOR SELECT 
            USING (true);
        END IF;
    END IF;
END $$;

-- Check if portfolio_analytics table exists and has proper policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_analytics') THEN
        -- Add policies if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolio_analytics') THEN
            CREATE POLICY "portfolio_analytics_owner_access" 
            ON public.portfolio_analytics 
            FOR ALL 
            USING (
              portfolio_id IN (
                SELECT id FROM public.portfolios WHERE artisan_id = auth.uid()
              ) OR is_admin()
            );
        END IF;
    END IF;
END $$;