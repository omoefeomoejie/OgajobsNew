-- PRODUCTION SECURITY FIXES - FINAL VERSION

-- 1. Clean up existing problematic policies first
DROP POLICY IF EXISTS "Public can view limited artisan business info" ON public.artisans;
DROP POLICY IF EXISTS "Public can view business profiles only" ON public.artisans;
DROP POLICY IF EXISTS "Public directory access only via secure view" ON public.artisans;

-- 2. Create secure artisan access policy
CREATE POLICY "Secure artisan data access" ON public.artisans
FOR SELECT TO anon, authenticated
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false  -- No direct table access for anonymous users
    WHEN auth.uid() = id THEN true      -- Artisans can see their own full data
    WHEN is_admin() THEN true           -- Admins can see all data
    WHEN EXISTS(
      SELECT 1 FROM bookings 
      WHERE ((artisan_id = artisans.id OR artisan_email = artisans.email) 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days')
    ) THEN true                         -- Clients with recent bookings can see contact info
    ELSE false                          -- Everyone else denied
  END
);

-- 3. Clean up email queue policies and create secure one
DROP POLICY IF EXISTS "System can manage email queue" ON public.email_notifications_queue;
DROP POLICY IF EXISTS "System processes only" ON public.email_notifications_queue;
DROP POLICY IF EXISTS "System functions only - no public access" ON public.email_notifications_queue;

-- Email queue should be completely private - only admin access
CREATE POLICY "Admin only email queue access" ON public.email_notifications_queue
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Create public artisan directory view (business info only, no contact data)
CREATE OR REPLACE VIEW public.artisans_public_directory AS
SELECT 
  id,
  full_name,
  category,
  skill,
  city,
  photo_url,
  profile_url,
  slug,
  created_at
FROM public.artisans
WHERE suspended = false;

-- Grant public access to the safe directory view
GRANT SELECT ON public.artisans_public_directory TO anon, authenticated;

-- 5. Update search_path for critical security functions
CREATE OR REPLACE FUNCTION public.get_artisan_contact_secure(p_artisan_id uuid)
RETURNS TABLE(email text, phone text, full_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check authorization first
  IF NOT (
    is_admin() OR
    p_artisan_id = auth.uid() OR
    EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = p_artisan_id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access artisan contact information';
  END IF;

  -- Return contact info if authorized
  RETURN QUERY
  SELECT a.email, a.phone, a.full_name
  FROM public.artisans a
  WHERE a.id = p_artisan_id;
END;
$function$;

-- 6. Fix other functions with search_path issues  
CREATE OR REPLACE FUNCTION public.log_sensitive_access_secure(p_table_name text, p_operation text, p_record_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'sensitive_data_access',
    auth.uid(),
    jsonb_build_object(
      'table', p_table_name,
      'operation', p_operation,
      'record_id', p_record_id,
      'timestamp', now(),
      'user_email', auth.email()
    ),
    'medium'
  );
END;
$function$;