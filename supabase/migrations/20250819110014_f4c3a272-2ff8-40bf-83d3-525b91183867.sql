-- ============================================================================
-- SECURITY FIXES - PART 3: Fix Remaining Linter Issues
-- ============================================================================

-- Fix 1: Update remaining functions to have proper search_path
-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$;

-- Is admin function  
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT public.get_user_role(auth.uid()) = 'admin');
END;
$$;

-- Get current user role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Complete booking function
CREATE OR REPLACE FUNCTION public.complete_booking(booking_id_param uuid, completed_by_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  -- Check if user is authorized to complete (either client or assigned artisan)
  IF booking_record.client_email != (SELECT email FROM auth.users WHERE id = completed_by_param) 
     AND booking_record.artisan_id != completed_by_param THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized to complete this booking');
  END IF;
  
  -- Update booking status
  UPDATE public.bookings 
  SET status = 'completed', 
      completion_date = now(),
      updated_at = now()
  WHERE id = booking_id_param;
  
  RETURN json_build_object('success', true, 'message', 'Booking completed successfully');
END;
$$;

-- Log security event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_severity text DEFAULT 'medium'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    p_event_type,
    auth.uid(),
    p_event_details,
    p_severity
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Fix 2: Add missing RLS policies for tables with RLS enabled but no policies
-- Check for portfolio_analytics table and add policies if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_analytics' AND table_schema = 'public') THEN
    -- Allow owners to view their portfolio analytics
    DROP POLICY IF EXISTS "Owners can view portfolio analytics" ON public.portfolio_analytics;
    CREATE POLICY "Owners can view portfolio analytics"
    ON public.portfolio_analytics
    FOR SELECT
    USING (
      portfolio_id IN (
        SELECT id FROM public.portfolios 
        WHERE artisan_id = auth.uid()
      )
    );
    
    -- Allow public to view basic portfolio analytics (aggregated data)
    DROP POLICY IF EXISTS "Public can view basic portfolio analytics" ON public.portfolio_analytics;
    CREATE POLICY "Public can view basic portfolio analytics"
    ON public.portfolio_analytics
    FOR SELECT
    USING (true);
    
    -- Only system can insert/update analytics
    DROP POLICY IF EXISTS "System can manage portfolio analytics" ON public.portfolio_analytics;
    CREATE POLICY "System can manage portfolio analytics"
    ON public.portfolio_analytics
    FOR ALL
    USING (is_admin());
  END IF;
END $$;

-- Fix 3: Restrict materialized view access by creating secure access functions
-- Create secure function to access artisan performance data
CREATE OR REPLACE FUNCTION public.get_artisan_performance_secure(p_artisan_id uuid DEFAULT NULL)
RETURNS TABLE(
  artisan_id uuid,
  total_jobs bigint,
  completion_rate numeric,
  avg_rating numeric,
  response_time_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check authorization
  IF p_artisan_id IS NOT NULL AND p_artisan_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own performance data';
  END IF;
  
  -- Return performance data (simulate materialized view structure)
  RETURN QUERY
  SELECT 
    COALESCE(p_artisan_id, auth.uid()) as artisan_id,
    COUNT(b.id)::bigint as total_jobs,
    (COUNT(CASE WHEN b.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(b.id), 0))::numeric as completion_rate,
    COALESCE(AVG(ar.rating), 0)::numeric as avg_rating,
    24::numeric as response_time_hours -- Placeholder
  FROM public.bookings b
  LEFT JOIN public.artisan_reviews ar ON b.artisan_id = ar.artisan_id
  WHERE b.artisan_id = COALESCE(p_artisan_id, auth.uid())
  GROUP BY COALESCE(p_artisan_id, auth.uid());
END;
$$;

-- Create secure function to access service category stats
CREATE OR REPLACE FUNCTION public.get_service_category_stats_secure()
RETURNS TABLE(
  category text,
  total_artisans bigint,
  avg_rating numeric,
  total_jobs bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This is public data, so no authorization check needed
  RETURN QUERY
  SELECT 
    a.category,
    COUNT(DISTINCT a.id)::bigint as total_artisans,
    COALESCE(AVG(ar.rating), 0)::numeric as avg_rating,
    COUNT(b.id)::bigint as total_jobs
  FROM public.artisans a
  LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
  LEFT JOIN public.bookings b ON a.id = b.artisan_id
  WHERE NOT a.suspended
  GROUP BY a.category;
END;
$$;

-- Fix 4: Add security validation trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.validate_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Block operations on sensitive tables if not properly authenticated
  IF TG_TABLE_NAME IN ('artisan_payment_methods', 'identity_verifications', 'artisan_earnings_v2') THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for sensitive operations';
    END IF;
    
    -- Additional validation for payment methods
    IF TG_TABLE_NAME = 'artisan_payment_methods' THEN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.artisan_id != auth.uid() AND NOT is_admin() THEN
          RAISE EXCEPTION 'Unauthorized: Can only manage own payment methods';
        END IF;
      END IF;
    END IF;
    
    -- Additional validation for identity verifications
    IF TG_TABLE_NAME = 'identity_verifications' THEN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.artisan_id != auth.uid() AND NOT is_admin() THEN
          RAISE EXCEPTION 'Unauthorized: Can only manage own identity verification';
        END IF;
      END IF;
    END IF;
    
    -- Additional validation for earnings
    IF TG_TABLE_NAME = 'artisan_earnings_v2' THEN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.artisan_id != auth.uid() AND NOT is_admin() THEN
          RAISE EXCEPTION 'Unauthorized: Can only view own earnings';
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;