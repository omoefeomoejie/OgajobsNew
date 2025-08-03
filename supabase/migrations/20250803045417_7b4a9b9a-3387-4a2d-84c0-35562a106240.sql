-- Create a trigger function to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, 'client', now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger to call the function after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the admin profile manually (replace with actual admin user ID)
-- First, we need to check if the admin user exists and create their profile
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the admin user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'adminstration@ogajobs.com.ng';
  
  -- If admin user exists, create/update their profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (admin_user_id, 'adminstration@ogajobs.com.ng', 'admin', now())
    ON CONFLICT (id) DO UPDATE SET 
      role = 'admin',
      email = 'adminstration@ogajobs.com.ng';
  END IF;
END $$;