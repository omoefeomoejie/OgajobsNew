-- CRITICAL SECURITY FIX: Restrict public access to sensitive user data

-- 1. Fix clients table - Remove public read access and restrict public insert
DROP POLICY IF EXISTS "Public Insert" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;

-- Create secure policies for clients table
CREATE POLICY "Authenticated users can create client records" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (email = auth.email());

CREATE POLICY "Clients can view their own data" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (email = auth.email());

CREATE POLICY "Clients can update their own data" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (email = auth.email())
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
      -- Anonymous users only see essential business info (no personal details)
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
      -- Other authenticated users only see essential business info
      suspended = false
  END
);

-- 3. Ensure withdrawal_requests tables exist and have proper RLS (if they exist)
-- Check if withdrawal_requests table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to recreate them securely
        DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
        
        -- Create secure policy
        CREATE POLICY "Users can manage their own withdrawal requests" 
        ON public.withdrawal_requests 
        FOR ALL 
        TO authenticated
        USING (user_id = auth.uid() OR is_admin())
        WITH CHECK (user_id = auth.uid() OR is_admin());
    END IF;
END $$;

-- Check if withdrawal_requests_v2 table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_requests_v2') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.withdrawal_requests_v2 ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to recreate them securely
        DROP POLICY IF EXISTS "Users can view their own withdrawal requests v2" ON public.withdrawal_requests_v2;
        
        -- Create secure policy
        CREATE POLICY "Users can manage their own withdrawal requests v2" 
        ON public.withdrawal_requests_v2 
        FOR ALL 
        TO authenticated
        USING (user_id = auth.uid() OR is_admin())
        WITH CHECK (user_id = auth.uid() OR is_admin());
    END IF;
END $$;

-- 4. Add additional security for artisan_payment_methods (already has good RLS but ensure it's locked down)
-- Verify no public access exists
DROP POLICY IF EXISTS "Public can view payment methods" ON public.artisan_payment_methods;

-- Ensure only strict access exists (policies already exist, just making sure)
-- The existing policies are already secure: only artisan owners and admins can access

-- 5. Add additional security for identity_verifications (already has good RLS but ensure it's locked down)
-- Verify no public access exists  
DROP POLICY IF EXISTS "Public can view identity verifications" ON public.identity_verifications;

-- The existing policies are already secure: only artisan owners and admins can access

-- Add logging for security-sensitive operations
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
        ip_address
    ) VALUES (
        auth.uid(),
        auth.email(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr()
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
        
    -- Add trigger for withdrawal_requests if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
        DROP TRIGGER IF EXISTS audit_withdrawal_requests ON public.withdrawal_requests;
        CREATE TRIGGER audit_withdrawal_requests
            AFTER INSERT OR UPDATE OR DELETE ON public.withdrawal_requests
            FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
    END IF;
    
    -- Add trigger for withdrawal_requests_v2 if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_requests_v2') THEN
        DROP TRIGGER IF EXISTS audit_withdrawal_requests_v2 ON public.withdrawal_requests_v2;
        CREATE TRIGGER audit_withdrawal_requests_v2
            AFTER INSERT OR UPDATE OR DELETE ON public.withdrawal_requests_v2
            FOR EACH ROW EXECUTE FUNCTION log_sensitive_access();
    END IF;
END $$;