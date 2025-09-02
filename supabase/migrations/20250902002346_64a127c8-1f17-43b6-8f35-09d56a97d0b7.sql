-- PHASE 2: Streamline Trust Metrics - Make completely optional and non-blocking

-- First, drop the existing trust metrics trigger that might block signup
DROP TRIGGER IF EXISTS update_trust_metrics_trigger ON public.profiles;

-- Create a new non-blocking trigger that only logs for background processing
CREATE OR REPLACE FUNCTION public.queue_trust_metrics_calculation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only queue for artisan profiles, don't block if it fails
  IF NEW.role = 'artisan' THEN
    BEGIN
      -- Insert into a queue table for background processing
      INSERT INTO public.trust_metrics_queue (user_id, queued_at, status)
      VALUES (NEW.id, now(), 'pending')
      ON CONFLICT (user_id) DO UPDATE SET
        queued_at = now(),
        status = 'pending';
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the signup
      RAISE NOTICE 'Trust metrics queuing failed for user %: % - continuing signup', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create queue table for background trust metrics processing
CREATE TABLE IF NOT EXISTS public.trust_metrics_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  queued_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on queue table
ALTER TABLE public.trust_metrics_queue ENABLE ROW LEVEL SECURITY;

-- RLS policy for queue table
CREATE POLICY "Admins can manage trust metrics queue" ON public.trust_metrics_queue
FOR ALL USING (is_admin());

-- Create the new non-blocking trigger
CREATE TRIGGER queue_trust_metrics_on_profile_creation
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_trust_metrics_calculation();

-- Update the trust metrics calculation function to be more resilient
CREATE OR REPLACE FUNCTION public.process_trust_metrics_background(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  success boolean := false;
BEGIN
  -- Update queue status to processing
  UPDATE public.trust_metrics_queue 
  SET status = 'processing', processed_at = now()
  WHERE user_id = p_user_id;
  
  BEGIN
    -- Try to create/update trust metrics (non-blocking)
    INSERT INTO public.trust_metrics (artisan_id, identity_verified)
    VALUES (p_user_id, false)
    ON CONFLICT (artisan_id) 
    DO UPDATE SET 
      identity_verified = COALESCE((p_user_id IN (SELECT artisan_id FROM public.identity_verifications WHERE verification_status = 'verified')), false),
      last_updated = now();
    
    -- Try to calculate trust score (optional)
    PERFORM public.calculate_trust_score(p_user_id);
    PERFORM public.update_verification_level(p_user_id);
    
    -- Mark as completed
    UPDATE public.trust_metrics_queue 
    SET status = 'completed', processed_at = now(), error_message = NULL
    WHERE user_id = p_user_id;
    
    success := true;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail
    UPDATE public.trust_metrics_queue 
    SET status = 'failed', 
        processed_at = now(), 
        error_message = SQLERRM,
        retry_count = retry_count + 1
    WHERE user_id = p_user_id;
    
    RAISE NOTICE 'Trust metrics processing failed for user %: %', p_user_id, SQLERRM;
    success := false;
  END;
  
  RETURN success;
END;
$function$;