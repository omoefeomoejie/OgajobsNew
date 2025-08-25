-- Secure the artisans_directory view to prevent data harvesting
DROP VIEW IF EXISTS public.artisans_directory CASCADE;

-- Create a secure artisans directory view that requires authentication
CREATE VIEW public.artisans_directory AS
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
  AND (auth.uid() IS NOT NULL) -- Require authentication to prevent harvesting
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- Add missing RLS policies for tables that have RLS enabled but no policies
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Find tables with RLS enabled but no policies
  FOR rec IN 
    SELECT t.table_name
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND c.relrowsecurity = true
    AND t.table_name NOT LIKE 'pg_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p WHERE p.tablename = t.table_name
    )
  LOOP
    -- Add a default policy for authenticated users
    EXECUTE format(
      'CREATE POLICY "Authenticated users only" ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', 
      rec.table_name
    );
    
    -- Add admin management policy for analytics tables
    IF rec.table_name IN ('market_conditions', 'demand_analytics', 'demand_predictions', 'demand_trends') THEN
      EXECUTE format(
        'CREATE POLICY "Admins can manage data" ON public.%I FOR ALL USING (is_admin()) WITH CHECK (is_admin())', 
        rec.table_name
      );
    END IF;
  END LOOP;
END $$;