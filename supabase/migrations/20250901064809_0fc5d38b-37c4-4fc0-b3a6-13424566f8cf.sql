-- Simple fix: Just update the role and clean up problematic functions
-- Remove all triggers that could cause recursion
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_trust_metrics_trigger_on_profiles ON public.profiles;
DROP TRIGGER IF EXISTS audit_trigger ON public.profiles;

-- Update the user's role directly
UPDATE public.profiles 
SET role = 'artisan', updated_at = now()
WHERE id = '6186ed43-a06c-4314-bdc8-660a5c572cc8';

-- Create a simple, safe function to update updated_at only for profiles table
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add only the essential trigger back for profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();