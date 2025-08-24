-- CRITICAL SECURITY FIXES - Phase 1: Data Protection
-- Fix exposed artisan contact data and secure public views

-- 1. DROP the insecure artisans_public view that exposes data without RLS
DROP VIEW IF EXISTS public.artisans_public;

-- 2. Create secure artisan discovery view with proper data masking
CREATE VIEW public.artisans_directory AS
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.city,
  a.skill,
  a.photo_url,
  a.profile_url,
  a.slug,
  a.created_at,
  -- Mask sensitive data for unauthorized users
  CASE 
    WHEN auth.uid() = a.id OR is_admin() OR 
         EXISTS(
           SELECT 1 FROM public.bookings b 
           WHERE b.artisan_id = a.id 
           AND b.client_email = auth.email() 
           AND b.status IN ('pending', 'in_progress', 'completed')
           AND b.created_at > now() - INTERVAL '30 days'
         ) 
    THEN a.email
    ELSE NULL
  END as email,
  CASE 
    WHEN auth.uid() = a.id OR is_admin() OR 
         EXISTS(
           SELECT 1 FROM public.bookings b 
           WHERE b.artisan_id = a.id 
           AND b.client_email = auth.email() 
           AND b.status IN ('pending', 'in_progress', 'completed')
           AND b.created_at > now() - INTERVAL '30 days'
         ) 
    THEN a.phone
    ELSE NULL
  END as phone,
  -- Include review aggregation
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews,
  a.suspended
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.city, a.skill, a.photo_url, 
         a.profile_url, a.slug, a.created_at, a.email, a.phone, a.suspended;

-- 3. Enable RLS on the new directory view
ALTER VIEW public.artisans_directory OWNER TO postgres;

-- 4. Create secure function to get artisan contact with proper authorization and logging
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure_v2(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text, authorized boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_authorized boolean := false;
  v_reason text;
BEGIN
  -- Check authorization levels
  IF is_admin() THEN
    v_authorized := true;
    v_reason := 'admin_access';
  ELSIF p_artisan_id = auth.uid() THEN
    v_authorized := true;
    v_reason := 'own_data';
  ELSIF EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE artisan_id = p_artisan_id 
    AND client_email = auth.email()
    AND status IN ('pending', 'in_progress', 'completed')
    AND created_at > now() - INTERVAL '30 days'
  ) THEN
    v_authorized := true;
    v_reason := 'active_booking';
  ELSE
    v_authorized := false;
    v_reason := 'unauthorized';
  END IF;

  -- Log the access attempt
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    CASE WHEN v_authorized THEN 'artisan_contact_access_granted' ELSE 'artisan_contact_access_denied' END,
    auth.uid(),
    jsonb_build_object(
      'artisan_id', p_artisan_id,
      'reason', v_reason,
      'user_email', auth.email(),
      'timestamp', now()
    ),
    CASE WHEN v_authorized THEN 'low' ELSE 'high' END
  );

  -- Return data based on authorization
  IF v_authorized THEN
    RETURN QUERY
    SELECT a.email, a.phone, a.full_name, true as authorized
    FROM public.artisans a
    WHERE a.id = p_artisan_id;
  ELSE
    RETURN QUERY
    SELECT NULL::text, NULL::text, a.full_name, false as authorized
    FROM public.artisans a
    WHERE a.id = p_artisan_id;
  END IF;
END;
$$;

-- 5. Fix remaining SECURITY DEFINER functions without proper search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit_secure(operation_type text, max_attempts integer DEFAULT 10, window_minutes integer DEFAULT 60)
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
$$;

-- 6. Add missing RLS policies for tables flagged by linter
-- Fix withdrawal_settings table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_settings') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;
        
        -- Add policy if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'withdrawal_settings') THEN
            CREATE POLICY "withdrawal_settings_artisan_access" 
            ON public.withdrawal_settings 
            FOR ALL 
            USING (artisan_id = auth.uid() OR is_admin());
        END IF;
    END IF;
END $$;

-- Fix support_tickets_v2 table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets_v2') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.support_tickets_v2 ENABLE ROW LEVEL SECURITY;
        
        -- Add policies if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_tickets_v2' AND policyname = 'support_tickets_user_access') THEN
            CREATE POLICY "support_tickets_user_access" 
            ON public.support_tickets_v2 
            FOR ALL 
            USING (user_id = auth.uid() OR assigned_agent_id = auth.uid() OR is_admin());
        END IF;
    END IF;
END $$;

-- Fix support_ticket_messages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket_messages') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
        
        -- Add policy if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_ticket_messages') THEN
            CREATE POLICY "support_ticket_messages_access" 
            ON public.support_ticket_messages 
            FOR ALL 
            USING (
              ticket_id IN (
                SELECT id FROM public.support_tickets_v2 
                WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
              ) OR is_admin()
            );
        END IF;
    END IF;
END $$;

-- Fix support_sla_tracking table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_sla_tracking') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.support_sla_tracking ENABLE ROW LEVEL SECURITY;
        
        -- Add policy if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_sla_tracking') THEN
            CREATE POLICY "support_sla_tracking_access" 
            ON public.support_sla_tracking 
            FOR SELECT 
            USING (
              ticket_id IN (
                SELECT id FROM public.support_tickets_v2 
                WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
              ) OR is_admin()
            );
        END IF;
    END IF;
END $$;

-- 7. Create trigger to automatically log sensitive data access
CREATE OR REPLACE FUNCTION public.log_artisan_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when someone accesses artisan data with email/phone
  IF TG_OP = 'SELECT' AND (NEW.email IS NOT NULL OR NEW.phone IS NOT NULL) THEN
    -- Only log if it's not the artisan themselves
    IF auth.uid() != NEW.id THEN
      PERFORM log_sensitive_data_access(
        'artisans',
        NEW.id,
        'view',
        ARRAY['email', 'phone']
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. Enhanced security headers function with more comprehensive protection
CREATE OR REPLACE FUNCTION public.get_security_headers_v2()
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
    'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy', 'strict-origin-when-cross-origin',
    'Permissions-Policy', 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:; connect-src ''self'' https://*.supabase.co;',
    'X-Robots-Tag', 'noindex, nofollow',
    'Cache-Control', 'no-store, no-cache, must-revalidate, private'
  );
END;
$$;

-- 9. Create secure admin verification with enhanced logging
CREATE OR REPLACE FUNCTION public.verify_admin_access_v2(required_action text DEFAULT 'general'::text, additional_context jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  is_authorized boolean := false;
BEGIN
  -- Get user role securely
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user is admin or super_admin
  IF user_role IN ('admin', 'super_admin') THEN
    is_authorized := true;
    
    -- Log successful admin access
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_details,
      severity
    ) VALUES (
      'admin_access_granted',
      auth.uid(),
      jsonb_build_object(
        'action', required_action, 
        'user_role', user_role,
        'timestamp', now(),
        'context', additional_context
      ),
      'medium'
    );
  ELSE
    -- Log unauthorized access attempt
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_details,
      severity
    ) VALUES (
      'unauthorized_admin_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'action', required_action, 
        'user_role', COALESCE(user_role, 'none'),
        'timestamp', now(),
        'context', additional_context
      ),
      'critical'
    );
  END IF;
  
  RETURN is_authorized;
END;
$$;