-- ============================================================================
-- CRITICAL SECURITY FIXES FOR OGAJOBS PLATFORM - PART 1
-- ============================================================================

-- Fix 1: Create secure artisan public view (fixed - no verification_level column)
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

-- Enable RLS on the view
ALTER VIEW public.artisans_public_secure SET (security_barrier=true);

-- Fix 2: Add missing RLS policies for market_conditions table
CREATE POLICY "Anyone can view market conditions"
ON public.market_conditions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage market conditions"
ON public.market_conditions
FOR ALL
USING (is_admin());

-- Fix 3: Add RLS policies for trust_metrics table (if it exists)
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

-- Fix 5: Update all functions to have proper search_path
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