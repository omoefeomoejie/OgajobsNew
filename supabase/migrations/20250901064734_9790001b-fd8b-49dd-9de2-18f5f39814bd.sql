-- Fix infinite recursion by temporarily disabling triggers and fixing the role
-- First, disable the problematic triggers temporarily
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_trust_metrics_trigger_on_profiles ON public.profiles;

-- Directly update the user's role without triggering other functions
UPDATE public.profiles 
SET role = 'artisan'
WHERE id = '6186ed43-a06c-4314-bdc8-660a5c572cc8';

-- Fix the calculate_trust_score function to prevent recursive calls
CREATE OR REPLACE FUNCTION public.calculate_trust_score(artisan_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  identity_points INTEGER := 0;
  skills_points INTEGER := 0;
  performance_points INTEGER := 0;
  total_score INTEGER := 0;
  metrics RECORD;
BEGIN
  -- Get trust metrics
  SELECT * INTO metrics FROM public.trust_metrics WHERE artisan_id = artisan_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Identity verification (30 points max)
  IF metrics.identity_verified THEN
    identity_points := 30;
  END IF;
  
  -- Skills verification (25 points max)
  skills_points := LEAST(metrics.skills_verified * 5, 25);
  
  -- Performance metrics (45 points max)
  performance_points := LEAST(
    (metrics.average_rating * 10) + 
    (metrics.on_time_completion_rate * 0.15) + 
    (metrics.repeat_client_rate * 0.1) + 
    ((100 - metrics.dispute_rate) * 0.1) +
    (CASE WHEN metrics.response_time_hours <= 2 THEN 10 
          WHEN metrics.response_time_hours <= 6 THEN 7
          WHEN metrics.response_time_hours <= 24 THEN 5
          ELSE 0 END), 
    45
  );
  
  total_score := identity_points + skills_points + performance_points;
  
  -- Update the trust score WITHOUT triggering profile updates (to prevent recursion)
  UPDATE public.trust_metrics 
  SET trust_score = total_score, last_updated = now()
  WHERE artisan_id = artisan_user_id;
  
  RETURN total_score;
END;
$$;

-- Fix the update_trust_metrics_trigger to prevent recursive calls
CREATE OR REPLACE FUNCTION public.update_trust_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if this is an artisan profile and we're not already in a recursive call
  IF NEW.role = 'artisan' AND TG_OP = 'INSERT' THEN
    -- Insert or update trust metrics, handling the case where identity_verified field may not exist
    INSERT INTO public.trust_metrics (artisan_id, identity_verified)
    VALUES (NEW.id, COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false))
    ON CONFLICT (artisan_id) 
    DO UPDATE SET 
      identity_verified = COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false),
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the triggers with safeguards
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trust_metrics_trigger_on_profiles
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_trust_metrics_trigger();