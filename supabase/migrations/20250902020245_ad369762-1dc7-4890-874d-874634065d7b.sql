-- First, let's check what functions already exist and then enhance them for branded emails

-- Enhanced function to handle new user signup with branded confirmation emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
    NOW(), 
    NOW()
  );

  -- Send branded confirmation email immediately upon signup
  BEGIN
    PERFORM
      net.http_post(
        url := 'https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'email',
          'user_id', NEW.id,
          'user_email', NEW.email,
          'template', 'email_confirmation',
          'template_data', jsonb_build_object(
            'confirmUrl', 'https://vclzkuzexsuhaaliweey.supabase.co/auth/v1/verify?token=' || NEW.confirmation_token || '&type=signup&redirect_to=' || encode(current_setting('app.settings.site_url', true), 'escape'),
            'userEmail', NEW.email,
            'fullName', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
            'appUrl', current_setting('app.settings.site_url', true)
          )
        )
      );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block signup
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      status,
      error_message,
      created_at
    ) VALUES (
      NEW.id,
      'email_confirmation_error',
      'failed',
      SQLERRM,
      NOW()
    );
  END;

  RETURN NEW;
END;
$$;

-- Enhanced function to send welcome email after email confirmation
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only send welcome email when user confirms their email (email_confirmed_at changes from null to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get user profile data
    DECLARE
      user_profile RECORD;
    BEGIN
      SELECT * INTO user_profile FROM public.profiles WHERE id = NEW.id;
      
      -- Send welcome email based on user role
      PERFORM
        net.http_post(
          url := 'https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/send-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'type', 'email',
            'user_id', NEW.id,
            'user_email', NEW.email,
            'template', CASE 
              WHEN user_profile.role = 'artisan' THEN 'welcome_artisan'
              WHEN user_profile.role = 'pos_agent' THEN 'welcome_pos_agent'
              ELSE 'welcome_client'
            END,
            'template_data', jsonb_build_object(
              'fullName', COALESCE(user_profile.full_name, NEW.email),
              'appUrl', current_setting('app.settings.site_url', true),
              'agentCode', CASE WHEN user_profile.role = 'pos_agent' THEN 'AG_' || SUBSTRING(NEW.id::text, 1, 8) ELSE NULL END
            )
          )
        );
        
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block the confirmation process
      INSERT INTO public.notification_logs (
        user_id,
        notification_type,
        status,
        error_message,
        created_at
      ) VALUES (
        NEW.id,
        'welcome_email_error',
        'failed',
        SQLERRM,
        NOW()
      );
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure triggers exist and are properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;  
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email_on_confirmation();

-- Create notification logs table if it doesn't exist for debugging
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view logs
CREATE POLICY "Admins can view notification logs" ON public.notification_logs
  FOR SELECT USING (is_admin());