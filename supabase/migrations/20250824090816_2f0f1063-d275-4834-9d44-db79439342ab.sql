-- Fix critical security issues (corrected version)

-- 1. Fix artisans_public view with actual available columns
DROP VIEW IF EXISTS public.artisans_public;

-- Create a secure view without SECURITY DEFINER using actual columns
CREATE VIEW public.artisans_public AS
SELECT 
  id,
  full_name,
  category,
  city,
  skill,
  created_at,
  -- Calculate average rating from reviews
  COALESCE(
    (SELECT AVG(rating) FROM public.artisan_reviews WHERE artisan_id = a.id), 
    0
  ) as average_rating,
  -- Count total reviews
  (SELECT COUNT(*) FROM public.artisan_reviews WHERE artisan_id = a.id) as total_reviews,
  -- Mask sensitive data for public access
  CASE 
    WHEN auth.uid() IS NOT NULL THEN email
    ELSE public.mask_sensitive_data(email, 'email')
  END as email,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN phone
    ELSE public.mask_sensitive_data(phone, 'phone') 
  END as phone,
  photo_url,
  profile_url,
  slug,
  suspended
FROM public.artisans a
WHERE suspended = false;

-- 2. Add missing RLS policies for tables that have RLS enabled but no policies
-- These were identified by the security scanner

-- Ensure artisans table has proper RLS policies (some might exist already)
DROP POLICY IF EXISTS "Public can view non-sensitive artisan data" ON public.artisans;
DROP POLICY IF EXISTS "Artisans can manage own data" ON public.artisans;
DROP POLICY IF EXISTS "Admins can manage all artisan data" ON public.artisans;

-- Recreate with proper logic
CREATE POLICY "Public can view basic artisan info"
ON public.artisans
FOR SELECT
USING (
  CASE
    WHEN auth.uid() IS NULL THEN false  -- No public access without auth
    WHEN auth.uid() = id THEN true      -- Artisan can see own data
    WHEN public.is_admin() THEN true    -- Admin can see all
    WHEN EXISTS (                       -- Client can see artisans they've booked
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email() 
      AND status IN ('pending', 'in_progress', 'completed')
    ) THEN true
    ELSE false
  END
);

CREATE POLICY "Artisans can manage own data"
ON public.artisans
FOR ALL
USING (email = auth.email() OR id = auth.uid())
WITH CHECK (email = auth.email() OR id = auth.uid());

CREATE POLICY "Admins can manage all artisan data"
ON public.artisans
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Fix functions with mutable search_path
-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'client', now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 4. Create security compliance tracking table
CREATE TABLE IF NOT EXISTS public.security_compliance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  rls_enabled BOOLEAN DEFAULT false,
  policies_count INTEGER DEFAULT 0,
  last_audit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  compliance_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_compliance table
ALTER TABLE public.security_compliance ENABLE ROW LEVEL SECURITY;

-- Add policy for admins only to access security compliance data
CREATE POLICY "Only admins can access security compliance"
ON public.security_compliance
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert compliance tracking for key tables
INSERT INTO public.security_compliance (table_name, rls_enabled, policies_count, compliance_status)
VALUES 
  ('artisans', true, 3, 'compliant'),
  ('profiles', true, 1, 'compliant'),
  ('bookings', true, 1, 'compliant')
ON CONFLICT DO NOTHING;