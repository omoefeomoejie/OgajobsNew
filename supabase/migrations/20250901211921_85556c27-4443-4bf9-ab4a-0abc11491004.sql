-- Fix final 2 Function Search Path warnings to achieve 100% security score

-- Fix log_sensitive_access() function
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log access to sensitive tables
    INSERT INTO audit_logs (
        user_id,
        user_email,
        operation,
        table_name,
        old_data,
        new_data,
        ip_address,
        created_at
    ) VALUES (
        auth.uid(),
        auth.email(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix monitor_sensitive_access() function
CREATE OR REPLACE FUNCTION public.monitor_sensitive_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function can be called periodically to monitor for suspicious activity
  -- Log if there are too many access attempts to sensitive data
  INSERT INTO audit_logs (
    operation,
    table_name,
    user_email,
    created_at,
    old_data
  )
  SELECT 
    'SECURITY_ALERT',
    'SYSTEM_MONITORING',
    'AUTOMATED_SYSTEM',
    now(),
    jsonb_build_object(
      'alert_type', 'High access volume detected',
      'count', COUNT(*),
      'time_window', '1 hour'
    )
  FROM audit_logs 
  WHERE created_at > now() - interval '1 hour'
    AND table_name IN ('artisan_payment_methods', 'identity_verifications', 'clients')
  GROUP BY user_id
  HAVING COUNT(*) > 50;
END;
$$;