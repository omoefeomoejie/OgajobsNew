-- Create the first admin user
-- Note: This user will need to be created manually in Supabase Auth UI first, then we update their profile

-- Insert admin profile (assuming the user will be created via Supabase Auth UI)
INSERT INTO public.profiles (id, email, role, created_at)
VALUES (
  gen_random_uuid(), -- This will be replaced with actual user ID after manual creation
  'adminstration@ogajobs.com.ng',
  'admin',
  now()
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Alternative: If we want to handle this programmatically later,
-- we can create a function to promote users to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;