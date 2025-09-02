-- Fix the trust metrics trigger to prevent signup failures
-- Step 1: Drop the existing problematic trigger
DROP TRIGGER IF EXISTS update_trust_metrics ON public.profiles;

-- Step 2: Add explicit unique constraint on trust_metrics.artisan_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trust_metrics_artisan_id_key'
  ) THEN
    ALTER TABLE public.trust_metrics ADD CONSTRAINT trust_metrics_artisan_id_key UNIQUE (artisan_id);
  END IF;
END $$;

-- Step 3: Create a resilient trust metrics update function
CREATE OR REPLACE FUNCTION public.update_trust_metrics_trigger_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if this is an artisan profile
  IF NEW.role = 'artisan' THEN
    BEGIN
      -- Try to insert or update trust metrics with proper error handling
      INSERT INTO public.trust_metrics (artisan_id, identity_verified)
      VALUES (NEW.id, COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false))
      ON CONFLICT (artisan_id) 
      DO UPDATE SET 
        identity_verified = COALESCE((NEW.id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false),
        last_updated = now();
      
      -- Try to calculate trust score, but don't fail if it errors
      BEGIN
        PERFORM public.calculate_trust_score(NEW.id);
      EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE NOTICE 'Trust score calculation failed for user %: %', NEW.id, SQLERRM;
      END;
      
      -- Try to update verification level, but don't fail if it errors
      BEGIN
        PERFORM public.update_verification_level(NEW.id);
      EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE NOTICE 'Verification level update failed for user %: %', NEW.id, SQLERRM;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      -- If trust metrics operations fail, log but don't abort the signup
      RAISE NOTICE 'Trust metrics setup failed for user % but signup will continue: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Create the new resilient trigger
CREATE TRIGGER update_trust_metrics_safe
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_metrics_trigger_safe();

-- Step 5: Initialize trust metrics for existing artisan profiles that don't have them
CREATE OR REPLACE FUNCTION public.initialize_missing_trust_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  artisan_record RECORD;
BEGIN
  -- Find artisan profiles without trust metrics
  FOR artisan_record IN 
    SELECT p.id 
    FROM public.profiles p 
    LEFT JOIN public.trust_metrics tm ON p.id = tm.artisan_id 
    WHERE p.role = 'artisan' AND tm.artisan_id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.trust_metrics (artisan_id, identity_verified)
      VALUES (artisan_record.id, false);
      
      RAISE NOTICE 'Initialized trust metrics for artisan %', artisan_record.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to initialize trust metrics for artisan %: %', artisan_record.id, SQLERRM;
    END;
  END LOOP;
END;
$function$;

-- Step 6: Run the initialization for existing artisans
SELECT public.initialize_missing_trust_metrics();