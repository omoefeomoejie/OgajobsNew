-- Enable pg_net extension for HTTP calls from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configure service role key as database setting (placeholder - user needs to set actual key)
-- This needs to be set by admin: SELECT set_config('app.settings.service_role_key', 'your_service_role_key_here', false);

-- Improved welcome email function with proper error handling and fallback
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  template_name TEXT;
  template_data JSONB;
  http_response JSONB;
  service_key TEXT;
BEGIN
  -- Only send welcome email when user confirms their email
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get service role key
    BEGIN
      service_key := current_setting('app.settings.service_role_key', true);
      IF service_key IS NULL OR service_key = '' THEN
        RAISE NOTICE 'Service role key not configured - skipping HTTP call';
        -- Fall back to simple queue insertion
        INSERT INTO public.email_notifications_queue (
          user_id, user_email, template, status, data, created_at
        ) VALUES (
          NEW.id, NEW.email, 'welcome_client', 'pending', 
          jsonb_build_object('fullName', NEW.email, 'userEmail', NEW.email),
          NOW()
        );
        RETURN NEW;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not get service key: %', SQLERRM;
      RETURN NEW;
    END;
    
    -- Get user profile to determine role and name
    SELECT role, full_name, email INTO user_profile
    FROM public.profiles 
    WHERE id = NEW.id;
    
    -- Determine template based on role
    template_name := CASE 
      WHEN user_profile.role = 'artisan' THEN 'welcome_artisan'
      WHEN user_profile.role = 'pos_agent' THEN 'welcome_pos_agent'
      ELSE 'welcome_client'
    END;
    
    -- Prepare template data
    template_data := jsonb_build_object(
      'fullName', COALESCE(user_profile.full_name, NEW.email),
      'userEmail', NEW.email,
      'role', COALESCE(user_profile.role, 'client'),
      'appUrl', 'https://vclzkuzexsuhaaliweey.supabase.co'
    );
    
    -- Try to call send-notification function via HTTP
    BEGIN
      SELECT INTO http_response net.http_post(
        'https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/send-notification',
        jsonb_build_object(
          'userId', NEW.id,
          'userEmail', NEW.email,
          'type', 'email',
          'template', template_name,
          'data', template_data,
          'priority', 'normal'
        ),
        'application/json',
        jsonb_build_object(
          'Authorization', 'Bearer ' || service_key
        )
      );
      
      RAISE NOTICE 'HTTP call successful for user %: %', NEW.email, http_response;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'HTTP call failed for user %: %, falling back to queue', NEW.email, SQLERRM;
      
      -- Fallback: Insert into queue for manual processing
      INSERT INTO public.email_notifications_queue (
        user_id, user_email, template, status, data, created_at
      ) VALUES (
        NEW.id, NEW.email, template_name, 'pending', template_data, NOW()
      );
    END;
    
    -- Log the welcome email attempt
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      status,
      created_at
    ) VALUES (
      NEW.id,
      'welcome_email_triggered',
      'success',
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;
CREATE TRIGGER send_welcome_email_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.send_welcome_email_on_confirmation();