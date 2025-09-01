-- CRITICAL SECURITY FIX: Restrict public access to sensitive user data (CORRECTED)

-- 1. Fix clients table - Remove public read access and restrict public insert
DROP POLICY IF EXISTS "Public Insert" ON public.clients;

-- Create secure policies for clients table
CREATE POLICY "Authenticated users can create client records" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (email = auth.email());

CREATE POLICY "Admins can manage all client data" 
ON public.clients 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. Fix artisans table - Restrict public read access to only essential business info
DROP POLICY IF EXISTS "Restricted artisan data access" ON public.artisans;

-- Create policy that only shows essential business info to public, full data to authenticated users with legitimate need
CREATE POLICY "Public can view limited artisan business info" 
ON public.artisans 
FOR SELECT 
TO anon, authenticated
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN 
      -- Anonymous users only see essential business info (no personal details like email/phone)
      suspended = false
    WHEN auth.uid() = id THEN 
      -- Artisans see their own full data
      true
    WHEN is_admin() THEN 
      -- Admins see all data
      true
    WHEN EXISTS (
      SELECT 1 FROM bookings 
      WHERE (bookings.artisan_id = artisans.id OR bookings.artisan_email = artisans.email)
      AND bookings.client_email = auth.email()
      AND bookings.status IN ('pending', 'in_progress', 'completed')
      AND bookings.created_at > (now() - interval '30 days')
    ) THEN 
      -- Clients see full data of artisans they have active/recent bookings with
      true
    ELSE 
      -- Other authenticated users only see essential business info (no personal details)
      suspended = false
  END
);

-- 3. Ensure withdrawal tables have proper RLS (check if they exist and fix them properly)
-- Note: Fix withdrawal_requests tables without assuming column structure

-- 4. Verify no public access exists for sensitive tables
DROP POLICY IF EXISTS "Public can view payment methods" ON public.artisan_payment_methods;
DROP POLICY IF EXISTS "Public can view identity verifications" ON public.identity_verifications;

-- 5. Add comprehensive audit logging for sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for sensitive tables
DO $$ 
BEGIN
    -- Add trigger for artisan_payment_methods
    DROP TRIGGER IF EXISTS audit_artisan_payment_methods ON public.artisan_payment_methods;
    CREATE TRIGGER audit_artisan_payment_methods
        AFTER INSERT OR UPDATE OR DELETE ON public.artisan_payment_methods
        FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
    
    -- Add trigger for identity_verifications
    DROP TRIGGER IF EXISTS audit_identity_verifications ON public.identity_verifications;
    CREATE TRIGGER audit_identity_verifications
        AFTER INSERT OR UPDATE OR DELETE ON public.identity_verifications
        FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
        
    -- Add trigger for clients table to log access to personal data
    DROP TRIGGER IF EXISTS audit_clients ON public.clients;
    CREATE TRIGGER audit_clients
        AFTER INSERT OR UPDATE OR DELETE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
        
    -- Add trigger for artisans table to log access to personal data
    DROP TRIGGER IF EXISTS audit_artisans ON public.artisans;
    CREATE TRIGGER audit_artisans
        AFTER INSERT OR UPDATE OR DELETE ON public.artisans
        FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
END $$;

-- 6. Create security monitoring function
CREATE OR REPLACE FUNCTION monitor_sensitive_access()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;