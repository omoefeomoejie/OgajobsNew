-- Add unique constraint on email for profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create a function to set up the first admin user
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email text, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert or update the admin profile
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (admin_user_id, admin_email, 'admin', now())
  ON CONFLICT (id) DO UPDATE SET 
    email = admin_email,
    role = 'admin';
END;
$$;

-- Note: You'll need to:
-- 1. Go to Supabase Auth UI and create user: adminstration@ogajobs.com.ng with password: Blessed193
-- 2. Copy the user ID from the auth.users table
-- 3. Run: SELECT public.setup_admin_user('adminstration@ogajobs.com.ng', 'USER_ID_HERE');