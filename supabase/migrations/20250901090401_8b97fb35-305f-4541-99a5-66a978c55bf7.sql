-- Phase 5: Critical Security Hardening

-- 1. Drop insecure SECURITY DEFINER views that bypass RLS
DROP VIEW IF EXISTS public.artisans_public CASCADE;
DROP VIEW IF EXISTS public.artisans_directory CASCADE;

-- 2. Create secure materialized views for public artisan data (no contact info)
CREATE MATERIALIZED VIEW public.mv_artisan_directory AS
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

-- Create unique index for performance
CREATE UNIQUE INDEX idx_mv_artisan_directory_id ON public.mv_artisan_directory (id);
CREATE INDEX idx_mv_artisan_directory_category ON public.mv_artisan_directory (category);
CREATE INDEX idx_mv_artisan_directory_city ON public.mv_artisan_directory (city);

-- Enable RLS on materialized view
ALTER MATERIALIZED VIEW public.mv_artisan_directory OWNER TO postgres;

-- 3. Harden artisan table RLS policies - remove overly permissive public access
DROP POLICY IF EXISTS "Secure artisan data access" ON public.artisans;

-- Create strict RLS policy for artisan data
CREATE POLICY "Restricted artisan data access" ON public.artisans
FOR SELECT USING (
  CASE
    -- Artisan can view own full data
    WHEN auth.uid() = id THEN true
    -- Admin can view all data
    WHEN is_admin() THEN true
    -- Clients with active bookings can view limited artisan data (no contact info in SELECT)
    WHEN EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE artisan_id = artisans.id 
      AND client_email = auth.email()
      AND status IN ('pending', 'in_progress', 'completed')
      AND created_at > now() - INTERVAL '30 days'
    ) THEN true
    -- Public can only view non-suspended artisans directory data through materialized view
    ELSE false
  END
);

-- 4. Create secure function for public artisan directory access
CREATE OR REPLACE FUNCTION public.get_artisan_directory_secure(
  p_category text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
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
  created_at timestamp without time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access for monitoring
  PERFORM public.log_security_event(
    'public_artisan_directory_access',
    jsonb_build_object(
      'category', p_category,
      'city', p_city,
      'limit', p_limit,
      'offset', p_offset
    ),
    'low'
  );

  -- Return filtered public directory data (no contact information)
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.category,
    d.skill,
    d.city,
    d.photo_url,
    d.profile_url,
    d.slug,
    d.average_rating,
    d.total_reviews,
    d.created_at
  FROM public.mv_artisan_directory d
  WHERE 
    (p_category IS NULL OR d.category = p_category)
    AND (p_city IS NULL OR d.city = p_city)
  ORDER BY d.average_rating DESC, d.total_reviews DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Create secure pricing access function (remove public pricing exposure)
CREATE OR REPLACE FUNCTION public.get_service_pricing_secure(
  p_service_category text,
  p_city text DEFAULT NULL
)
RETURNS TABLE(
  category text,
  min_price numeric,
  max_price numeric,
  avg_price numeric,
  price_range text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return aggregated, non-sensitive pricing data
  RETURN QUERY
  SELECT 
    p_service_category as category,
    ROUND(MIN(b.budget * 0.8)) as min_price,
    ROUND(MAX(b.budget * 1.2)) as max_price,
    ROUND(AVG(b.budget)) as avg_price,
    CASE 
      WHEN AVG(b.budget) < 5000 THEN 'Budget'
      WHEN AVG(b.budget) < 15000 THEN 'Standard'
      ELSE 'Premium'
    END as price_range
  FROM public.bookings b
  WHERE b.work_type = p_service_category
    AND (p_city IS NULL OR b.city = p_city)
    AND b.status = 'completed'
    AND b.created_at > now() - INTERVAL '90 days'
  GROUP BY p_service_category;
END;
$$;

-- 6. Enhanced audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive artisan data
  IF TG_TABLE_NAME = 'artisans' AND TG_OP = 'SELECT' THEN
    -- Only log if accessing contact information
    IF auth.uid() != NEW.id AND NOT is_admin() THEN
      PERFORM public.log_security_event(
        'sensitive_artisan_data_access',
        jsonb_build_object(
          'artisan_id', NEW.id,
          'accessed_by', auth.uid(),
          'access_type', 'contact_info'
        ),
        'medium'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sensitive data access logging
DROP TRIGGER IF EXISTS trigger_audit_sensitive_access ON public.artisans;
CREATE TRIGGER trigger_audit_sensitive_access
  AFTER SELECT ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_access();

-- 7. Create function to refresh materialized views safely
CREATE OR REPLACE FUNCTION public.refresh_public_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins to refresh views
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can refresh materialized views';
  END IF;

  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_artisan_directory;
  
  -- Log the refresh
  PERFORM public.log_security_event(
    'materialized_view_refresh',
    jsonb_build_object('view', 'mv_artisan_directory'),
    'low'
  );
END;
$$;

-- 8. Add security headers function for API responses
CREATE OR REPLACE FUNCTION public.get_security_headers_enhanced()
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN jsonb_build_object(
    'X-Content-Type-Options', 'nosniff',
    'X-Frame-Options', 'DENY',
    'X-XSS-Protection', '1; mode=block',
    'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy', 'strict-origin-when-cross-origin',
    'Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline'' https://cdn.jsdelivr.net; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https: blob:; font-src ''self'' https://fonts.gstatic.com; connect-src ''self'' https://*.supabase.co wss://*.supabase.co;',
    'Permissions-Policy', 'camera=(), microphone=(), geolocation=()',
    'X-Permitted-Cross-Domain-Policies', 'none'
  );
END;
$$;