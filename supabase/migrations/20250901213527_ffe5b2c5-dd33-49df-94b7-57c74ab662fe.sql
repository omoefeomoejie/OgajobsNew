-- Create handle_new_user function to properly manage new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
  full_name_val TEXT;
  phone_val TEXT;
BEGIN
  -- Extract role and other data from raw_user_meta_data
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  full_name_val := NEW.raw_user_meta_data->>'full_name';
  phone_val := NEW.raw_user_meta_data->>'phone';
  
  -- Create profile record
  INSERT INTO public.profiles (id, email, role, full_name, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_role,
    full_name_val,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  
  -- Create role-specific records
  IF user_role = 'artisan' THEN
    INSERT INTO public.artisans (id, email, full_name, phone)
    VALUES (NEW.id, NEW.email, full_name_val, phone_val)
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone;
  ELSIF user_role = 'client' THEN
    INSERT INTO public.clients (email, full_name, phone)
    VALUES (NEW.email, full_name_val, phone_val)
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone;
  END IF;
  
  -- Send welcome email notification (only after email is confirmed)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    PERFORM pg_notify(
      'welcome_email_needed',
      json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'template', CASE WHEN user_role = 'client' THEN 'welcome_client' ELSE 'welcome_artisan' END,
        'full_name', full_name_val,
        'role', user_role
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for email confirmation to send welcome email
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
  full_name_val TEXT;
BEGIN
  -- Only proceed if email was just confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Get user data from profiles
    SELECT role, full_name INTO user_role, full_name_val
    FROM public.profiles 
    WHERE id = NEW.id;
    
    -- Trigger welcome email via edge function
    PERFORM pg_notify(
      'send_welcome_email',
      json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'template', CASE WHEN user_role = 'client' THEN 'welcome_client' ELSE 'welcome_artisan' END,
        'full_name', COALESCE(full_name_val, NEW.raw_user_meta_data->>'full_name', 'Valued User'),
        'role', COALESCE(user_role, 'client')
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.send_welcome_email_on_confirmation();