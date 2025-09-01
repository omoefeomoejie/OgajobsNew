-- Fix Security Definer Views by removing SECURITY DEFINER where inappropriate
-- and updating artisans_directory and artisans_public views

-- First, check if these views exist and recreate them without SECURITY DEFINER
DROP VIEW IF EXISTS public.artisans_directory;
DROP VIEW IF EXISTS public.artisans_public;

-- Recreate artisans_directory view without SECURITY DEFINER for public access
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
GROUP BY a.id, a.full_name, a.category, a.skill, a.city, a.photo_url, a.profile_url, a.slug, a.suspended, a.created_at;

-- Recreate artisans_public view without SECURITY DEFINER for public access
CREATE VIEW public.artisans_public AS
SELECT 
  id,
  full_name,
  category,
  skill,
  city,
  photo_url,
  profile_url,
  slug,
  suspended,
  created_at
FROM public.artisans
WHERE NOT suspended;

-- Enable RLS on views is not needed since they're just views
-- The underlying tables already have RLS policies

-- Add security improvements
-- Create trigger to log security events when sensitive data is accessed
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log admin access for security monitoring
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'admin_data_access',
    auth.uid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    ),
    'low'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to sensitive admin tables
CREATE TRIGGER admin_access_audit_trigger
  AFTER SELECT ON public.admin_messages
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

-- Update password security settings (this needs to be done via Supabase Dashboard)
-- The linter warning about leaked password protection needs to be enabled in:
-- Supabase Dashboard -> Authentication -> Settings -> Password Security
-- Enable "Leaked Password Protection"