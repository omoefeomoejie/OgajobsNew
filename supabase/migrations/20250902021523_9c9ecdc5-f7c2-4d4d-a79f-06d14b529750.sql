-- Fix the handle_new_user function to remove the encode() function call
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            'confirmUrl', 'https://vclzkuzexsuhaaliweey.supabase.co/auth/v1/verify?token=' || NEW.confirmation_token || '&type=signup&redirect_to=' || current_setting('app.settings.site_url', true),
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
$function$