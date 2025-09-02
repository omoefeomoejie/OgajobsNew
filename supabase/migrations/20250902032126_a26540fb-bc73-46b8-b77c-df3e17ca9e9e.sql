-- Set the service role key setting for the database to use in triggers
-- Note: The actual key value will be set via environment variable
-- This creates the setting so it can be referenced by triggers

-- Create a function to set the service role key (admin only)
CREATE OR REPLACE FUNCTION public.configure_service_role_key()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the service role key from environment variable
  -- This will be called during deployment/setup
  PERFORM set_config('app.settings.service_role_key', 
    COALESCE(current_setting('env.SUPABASE_SERVICE_ROLE_KEY', true), ''), 
    false
  );
END;
$$;

-- Create a simple function to process email queue manually
CREATE OR REPLACE FUNCTION public.process_pending_welcome_emails()
RETURNS TABLE(processed_count integer, errors text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_record RECORD;
  error_messages text[] := '{}';
  processed integer := 0;
BEGIN
  -- Process up to 10 pending emails
  FOR email_record IN 
    SELECT * FROM public.email_notifications_queue 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 10
  LOOP
    BEGIN
      -- Call the edge function via HTTP (if pg_net works)
      -- Otherwise, just mark as ready for manual processing
      
      -- For now, just mark as ready for the queue processor
      UPDATE public.email_notifications_queue 
      SET status = 'ready_for_processing', 
          updated_at = NOW()
      WHERE id = email_record.id;
      
      processed := processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_messages := array_append(error_messages, 
        'Email ID ' || email_record.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed, error_messages;
END;
$$;