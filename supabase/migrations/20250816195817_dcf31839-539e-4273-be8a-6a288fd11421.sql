-- Security Fix Migration Phase 2: Fix remaining function search paths
-- and address critical security definer issues

-- Fix all remaining functions with missing search_path
CREATE OR REPLACE FUNCTION public.update_verification_level(artisan_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_trust_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert or update trust metrics
  INSERT INTO public.trust_metrics (artisan_id, identity_verified)
  VALUES (NEW.id, NEW.identity_verified)
  ON CONFLICT (artisan_id) 
  DO UPDATE SET 
    identity_verified = NEW.identity_verified,
    last_updated = now();
  
  -- Calculate new trust score
  PERFORM public.calculate_trust_score(NEW.id);
  PERFORM public.update_verification_level(NEW.id);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.onboard_artisan_by_agent(p_agent_user_id uuid, p_artisan_name character varying, p_artisan_phone character varying, p_artisan_email character varying, p_service_category character varying, p_location jsonb, p_referral_code character varying DEFAULT NULL::character varying)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_agent_dashboard_stats(p_agent_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.increment_portfolio_views(portfolio_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.log_dispute_activity(dispute_id_param uuid, action_param text, performed_by_param uuid, details_param jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.dispute_activities (dispute_id, action, performed_by, details)
  VALUES (dispute_id_param, action_param, performed_by_param, details_param);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_dispute_status(dispute_id_param uuid, new_status_param dispute_status, resolution_param text DEFAULT NULL::text, admin_notes_param text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  old_status public.dispute_status;
  admin_id UUID;
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM public.disputes WHERE id = dispute_id_param;
  
  -- Update dispute
  UPDATE public.disputes 
  SET status = new_status_param,
      resolution = COALESCE(resolution_param, resolution),
      admin_notes = COALESCE(admin_notes_param, admin_notes),
      resolved_by = CASE WHEN new_status_param = 'resolved' THEN auth.uid() ELSE resolved_by END,
      resolved_at = CASE WHEN new_status_param = 'resolved' THEN now() ELSE resolved_at END,
      updated_at = now()
  WHERE id = dispute_id_param;
  
  -- Log activity
  PERFORM public.log_dispute_activity(
    dispute_id_param,
    'status_changed',
    auth.uid(),
    jsonb_build_object(
      'old_status', old_status,
      'new_status', new_status_param,
      'resolution', resolution_param
    )
  );
END;
$function$;