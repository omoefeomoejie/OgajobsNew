-- Fix the update_trust_metrics_trigger function to work with the current profiles table structure
CREATE OR REPLACE FUNCTION public.update_trust_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if this is an artisan profile
  IF NEW.role = 'artisan' THEN
    -- Insert or update trust metrics, handling the case where identity_verified field may not exist
    INSERT INTO public.trust_metrics (artisan_id, identity_verified)
    VALUES (NEW.id, COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false))
    ON CONFLICT (artisan_id) 
    DO UPDATE SET 
      identity_verified = COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false),
      last_updated = now();
    
    -- Calculate new trust score
    PERFORM public.calculate_trust_score(NEW.id);
    PERFORM public.update_verification_level(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;