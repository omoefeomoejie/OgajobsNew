-- Create the admin profile for the existing admin user
INSERT INTO public.profiles (id, email, role, created_at)
VALUES ('374e464d-4a62-4dc0-ad3e-9fa1e4017bba', 'administration@ogajobs.com.ng', 'admin', now())
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  email = 'administration@ogajobs.com.ng';