-- Security Fix Migration Phase 4: Complete remaining function fixes

CREATE OR REPLACE FUNCTION public.validate_withdrawal_request_v2(artisan_id_param uuid, amount_param numeric)
RETURNS TABLE(is_valid boolean, error_message text, available_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  balance_info RECORD;
  settings_info RECORD;
  today_withdrawals NUMERIC;
  week_withdrawals NUMERIC;
  month_withdrawals NUMERIC;
BEGIN
  -- Get artisan balance
  SELECT * INTO balance_info FROM public.get_artisan_balance_v2(artisan_id_param);
  
  -- Get withdrawal settings
  SELECT * INTO settings_info FROM public.withdrawal_settings WHERE artisan_id = artisan_id_param;
  
  -- If no settings exist, use defaults
  IF NOT FOUND THEN
    settings_info.min_withdrawal_amount := 1000.00;
    settings_info.max_withdrawal_amount := 500000.00;
    settings_info.daily_withdrawal_limit := 100000.00;
    settings_info.weekly_withdrawal_limit := 500000.00;
    settings_info.monthly_withdrawal_limit := 2000000.00;
  END IF;
  
  -- Check if sufficient balance
  IF amount_param > balance_info.available_balance THEN
    RETURN QUERY SELECT false, 'Insufficient available balance', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check minimum amount
  IF amount_param < settings_info.min_withdrawal_amount THEN
    RETURN QUERY SELECT false, 'Amount below minimum withdrawal limit', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check maximum amount
  IF amount_param > settings_info.max_withdrawal_amount THEN
    RETURN QUERY SELECT false, 'Amount exceeds maximum withdrawal limit', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- Check daily limit
  SELECT COALESCE(SUM(amount), 0) INTO today_withdrawals
  FROM public.withdrawal_requests_v2
  WHERE artisan_id = artisan_id_param
  AND DATE(created_at) = CURRENT_DATE
  AND status NOT IN ('rejected', 'cancelled');
  
  IF (today_withdrawals + amount_param) > settings_info.daily_withdrawal_limit THEN
    RETURN QUERY SELECT false, 'Daily withdrawal limit exceeded', balance_info.available_balance;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, 'Validation successful', balance_info.available_balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    old_data jsonb;
    new_data jsonb;
    changed_fields text[] := '{}';
    field_name text;
BEGIN
    -- Get user context (simplified for now)
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Identify changed fields
        FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Insert audit record
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        user_email,
        old_data,
        new_data,
        changed_fields,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        auth.email(),
        old_data,
        new_data,
        changed_fields,
        now()
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_performance_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_service_category_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_monthly_metrics;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.live_chat_typing 
  WHERE created_at < now() - INTERVAL '10 seconds';
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_chat_session(session_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  available_agent_id UUID;
BEGIN
  -- Find an available agent (simplified logic)
  SELECT p.id INTO available_agent_id
  FROM public.profiles p
  WHERE p.role IN ('admin', 'agent')
  AND NOT EXISTS (
    SELECT 1 FROM public.live_chat_sessions s
    WHERE s.agent_id = p.id 
    AND s.status = 'active'
  )
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF available_agent_id IS NOT NULL THEN
    UPDATE public.live_chat_sessions
    SET agent_id = available_agent_id,
        status = 'active',
        assigned_at = now(),
        updated_at = now()
    WHERE id = session_id_param;
    
    -- Send system message
    INSERT INTO public.live_chat_messages (
      session_id,
      sender_type,
      sender_name,
      message,
      message_type
    ) VALUES (
      session_id_param,
      'system',
      'System',
      'An agent has joined the chat',
      'system'
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_ai_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    config_data RECORD;
    conversation_data RECORD;
    should_respond BOOLEAN := false;
BEGIN
    -- Only process customer messages
    IF NEW.sender_type != 'customer' THEN
        RETURN NEW;
    END IF;
    
    -- Get AI config
    SELECT * INTO config_data FROM public.ai_chat_config LIMIT 1;
    
    -- Skip if AI is disabled
    IF NOT config_data.enabled THEN
        RETURN NEW;
    END IF;
    
    -- Get or create conversation tracking
    INSERT INTO public.ai_chat_conversations (session_id)
    VALUES (NEW.session_id)
    ON CONFLICT (session_id) DO NOTHING;
    
    SELECT * INTO conversation_data 
    FROM public.ai_chat_conversations 
    WHERE session_id = NEW.session_id;
    
    -- Check if we should respond
    IF conversation_data.escalated_to_human = false 
       AND conversation_data.ai_responses_count < config_data.max_auto_responses THEN
        should_respond := true;
    END IF;
    
    -- Check for escalation keywords
    IF should_respond THEN
        FOR i IN 1..array_length(config_data.escalation_keywords, 1) LOOP
            IF lower(NEW.message) LIKE '%' || config_data.escalation_keywords[i] || '%' THEN
                -- Mark as escalated
                UPDATE public.ai_chat_conversations 
                SET escalated_to_human = true, 
                    escalation_reason = 'Keyword detected: ' || config_data.escalation_keywords[i]
                WHERE session_id = NEW.session_id;
                should_respond := false;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- Trigger AI response if conditions are met
    IF should_respond THEN
        -- This will be handled by the edge function
        -- We just mark that we need an AI response
        PERFORM pg_notify('ai_response_needed', json_build_object(
            'session_id', NEW.session_id,
            'message', NEW.message,
            'customer_name', NEW.sender_name
        )::text);
    END IF;
    
    RETURN NEW;
END;
$function$;