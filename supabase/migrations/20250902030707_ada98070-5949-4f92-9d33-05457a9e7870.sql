-- Fix welcome email processing by calling send-notification directly
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
BEGIN
  -- Only send welcome email when user confirms their email
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
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
    
    -- Call send-notification function directly via HTTP
    PERFORM net.http_post(
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
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )
    );
    
    -- Update queue item as sent (if exists)
    UPDATE public.email_notifications_queue 
    SET status = 'sent', processed_at = NOW()
    WHERE user_id = NEW.id 
    AND user_email = NEW.email 
    AND status = 'pending'
    AND template = template_name;
    
    -- Log the welcome email trigger
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      status,
      created_at
    ) VALUES (
      NEW.id,
      'welcome_email_sent',
      'success',
      NOW()
    );
    
    RAISE NOTICE 'Welcome email sent for user: %', NEW.email;
    
  END IF;
  
  RETURN NEW;
END;
$$;