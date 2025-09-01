-- Create a database trigger to send welcome emails automatically after profile creation
-- This ensures welcome emails are sent even if the frontend call fails

CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;