-- Fix search_path security issues for functions and create welcome email trigger
-- This addresses the security linter warnings

-- First fix the function with proper search_path
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  welcome_template TEXT;
BEGIN
  -- Determine the template based on role
  IF NEW.role = 'client' THEN
    welcome_template := 'welcome_client';
  ELSIF NEW.role = 'artisan' THEN
    welcome_template := 'welcome_artisan';
  ELSE
    -- Skip if role is not client or artisan (e.g., admin)
    RETURN NEW;
  END IF;

  -- Send welcome email using the notification function
  -- We'll use pg_notify to trigger an async process
  PERFORM pg_notify(
    'welcome_email_needed',
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'template', welcome_template,
      'full_name', COALESCE(NEW.full_name, 'Valued User'),
      'role', NEW.role
    )::text
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table to automatically send welcome emails
CREATE OR REPLACE TRIGGER profiles_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role IN ('client', 'artisan'))
  EXECUTE FUNCTION public.send_welcome_email_trigger();