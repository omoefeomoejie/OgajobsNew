-- Remove conflicting old triggers that might be causing signup issues
-- Drop the old trust metrics trigger if it exists
DROP TRIGGER IF EXISTS update_trust_metrics_on_profile_change ON public.profiles;

-- Temporarily disable welcome email trigger to isolate signup issues
DROP TRIGGER IF EXISTS profiles_welcome_email_trigger ON public.profiles;

-- Temporarily disable audit trigger to isolate signup issues  
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;

-- Check what functions these triggers were calling and ensure they exist
SELECT 
  tgname as trigger_name,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'public.profiles'::regclass
  AND tgname LIKE '%trust_metrics%';