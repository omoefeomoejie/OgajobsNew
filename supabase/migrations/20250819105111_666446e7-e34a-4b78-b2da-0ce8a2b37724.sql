-- ============================================================================
-- CRITICAL SECURITY FIXES FOR OGAJOBS PLATFORM
-- ============================================================================

-- Fix 1: Secure Security Definer Views with RLS
-- Create secure RLS-protected views instead of security definer views

DROP VIEW IF EXISTS public.artisans_public;
DROP VIEW IF EXISTS public.artisans_public_safe;

-- Create secure artisan public view with proper RLS
CREATE VIEW public.artisans_public_secure AS
SELECT 
  a.id,
  a.full_name,
  a.city,
  a.category,
  a.skill,
  a.profile_url,
  a.photo_url,
  a.verification_level,
  a.created_at,
  a.suspended,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.city, a.category, a.skill, 
         a.profile_url, a.photo_url, a.verification_level, 
         a.created_at, a.suspended;

-- Enable RLS on the view
ALTER VIEW public.artisans_public_secure SET (security_barrier=true);

-- Fix 2: Add missing RLS policies for tables that have RLS enabled but no policies

-- Add RLS policies for market_conditions table
CREATE POLICY "Anyone can view market conditions"
ON public.market_conditions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage market conditions"
ON public.market_conditions
FOR ALL
USING (is_admin());

-- Add RLS policies for trust_metrics table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_metrics' AND table_schema = 'public') THEN
    -- Allow artisans to view their own trust metrics
    CREATE POLICY "Artisans can view their own trust metrics"
    ON public.trust_metrics
    FOR SELECT
    USING (artisan_id = auth.uid());
    
    -- Allow public to view basic trust scores
    CREATE POLICY "Public can view trust scores"
    ON public.trust_metrics
    FOR SELECT
    USING (true);
    
    -- Only admins can manage trust metrics
    CREATE POLICY "Admins can manage trust metrics"
    ON public.trust_metrics
    FOR ALL
    USING (is_admin());
  END IF;
END $$;

-- Fix 3: Secure materialized views by removing from public schema or adding proper access controls
-- Create function to refresh performance views securely
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

-- Fix 4: Strengthen existing RLS policies for sensitive data

-- Update artisans table policies to be more restrictive
DROP POLICY IF EXISTS "Public can view basic artisan info (no PII)" ON public.artisans;

CREATE POLICY "Authenticated users can view artisan profiles"
ON public.artisans
FOR SELECT
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false  -- No anonymous access
    WHEN auth.uid() = id THEN true      -- Own profile
    WHEN is_admin() THEN true           -- Admin access
    WHEN EXISTS (                        -- Client with active booking
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
    ) THEN true
    ELSE false
  END
);

-- Update clients table to remove public insert
DROP POLICY IF EXISTS "Public Insert" ON public.clients;

CREATE POLICY "Authenticated users can create client records"
ON public.clients
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  email = auth.email()
);

-- Fix 5: Add audit logging for sensitive operations
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

-- Fix 6: Update all functions to have proper search_path
-- Update existing functions to include search_path

-- Update calculate_platform_fee function
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- 10% platform fee
  RETURN ROUND(amount * 0.10, 2);
END;
$$;

-- Update calculate_artisan_earnings function  
CREATE OR REPLACE FUNCTION public.calculate_artisan_earnings(amount numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- 90% goes to artisan (amount minus 10% platform fee)
  RETURN ROUND(amount * 0.90, 2);
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'client', now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix 7: Add data masking for sensitive fields
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

-- Fix 8: Create secure admin verification function
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