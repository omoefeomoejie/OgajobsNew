-- Add search_path to critical functions missing it
CREATE OR REPLACE FUNCTION public.get_artisans_directory()
RETURNS TABLE(
  id uuid,
  full_name text,
  category text,
  skill text,
  city text,
  photo_url text,
  profile_url text,
  slug text,
  average_rating numeric,
  total_reviews bigint,
  suspended boolean,
  created_at timestamp without time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
SELECT 
  a.id,
  a.full_name,
  a.category,
  a.skill,
  a.city,
  a.photo_url,
  a.profile_url,
  a.slug,
  COALESCE(AVG(ar.rating), 0) as average_rating,
  COUNT(ar.id) as total_reviews,
  a.suspended,
  a.created_at
FROM public.artisans a
LEFT JOIN public.artisan_reviews ar ON a.id = ar.artisan_id
WHERE NOT a.suspended
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;
$$;

-- Fix the most critical security issue: artisans table contact info exposure
DROP POLICY IF EXISTS "Restricted artisan profile access" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view public artisan directory" ON public.artisans;

-- Create secure RLS policy that only shows contact info to authorized users
CREATE POLICY "Secure artisan directory with contact protection"
ON public.artisans
FOR SELECT
USING (
  NOT suspended AND 
  CASE 
    WHEN auth.uid() = id THEN true  -- Artisan themselves
    WHEN is_admin() THEN true       -- Admin users
    WHEN EXISTS(                    -- Users with recent active bookings
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    ) THEN true
    ELSE (email IS NULL AND phone IS NULL)  -- Only allow if no contact data
  END
);

-- Add missing RLS policies for market_conditions if it exists and has RLS enabled but no policies
DO $$
BEGIN
  -- Check if market_conditions table exists and has RLS enabled but no policies
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_name = 'market_conditions' 
    AND t.table_schema = 'public'
    AND c.relrowsecurity = true
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'market_conditions'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view market conditions" ON public.market_conditions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage market conditions" ON public.market_conditions FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
  END IF;
END $$;

-- Cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
BEGIN
  -- Delete security events older than 90 days
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete audit logs older than 1 year  
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - INTERVAL '1 year';
END;
$$;