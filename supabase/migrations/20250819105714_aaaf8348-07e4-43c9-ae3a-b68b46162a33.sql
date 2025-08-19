-- ============================================================================
-- CRITICAL SECURITY FIXES FOR OGAJOBS PLATFORM - PART 2
-- ============================================================================

-- Fix 1: Create secure artisan public view (avoiding existing policies)
DROP VIEW IF EXISTS public.artisans_public_secure;

CREATE VIEW public.artisans_public_secure AS
SELECT 
  a.id,
  a.full_name,
  a.city,
  a.category,
  a.skill,
  a.profile_url,
  a.photo_url,
  a.created_at,
  a.suspended,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.city, a.category, a.skill, 
         a.profile_url, a.photo_url, a.created_at, a.suspended;

-- Enable security barrier on the view
ALTER VIEW public.artisans_public_secure SET (security_barrier=true);

-- Fix 2: Add secure admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access(required_action text DEFAULT 'general')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix 3: Add data masking for sensitive fields
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(input_text text, mask_type text DEFAULT 'email')
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Fix 4: Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix 5: Create triggers for audit logging on sensitive tables
DO $$
BEGIN
  -- Add audit triggers for sensitive tables if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artisan_payment_methods' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_artisan_payment_methods ON public.artisan_payment_methods;
    CREATE TRIGGER audit_artisan_payment_methods
      AFTER INSERT OR UPDATE OR DELETE ON public.artisan_payment_methods
      FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'identity_verifications' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_identity_verifications ON public.identity_verifications;
    CREATE TRIGGER audit_identity_verifications
      AFTER INSERT OR UPDATE OR DELETE ON public.identity_verifications
      FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artisan_earnings_v2' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_artisan_earnings_v2 ON public.artisan_earnings_v2;
    CREATE TRIGGER audit_artisan_earnings_v2
      AFTER INSERT OR UPDATE OR DELETE ON public.artisan_earnings_v2
      FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();
  END IF;
END $$;

-- Fix 6: Secure materialized views by creating access control function
CREATE OR REPLACE FUNCTION public.refresh_performance_views_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix 7: Add security headers function for API responses
CREATE OR REPLACE FUNCTION public.get_security_headers()
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
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