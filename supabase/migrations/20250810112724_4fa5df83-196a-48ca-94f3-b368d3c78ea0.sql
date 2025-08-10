-- Fix admin user setup for administration@ogajobs.com.ng
SELECT setup_admin_user('administration@ogajobs.com.ng', '8ea2c7b5-cd84-4e31-ad9a-e83b9c4c1234'::uuid);

-- Make sure we have all necessary role types in profiles enum (if it exists as enum)
-- This will help fix potential role matching issues

-- Insert a test admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, role, created_at)
VALUES (
  '8ea2c7b5-cd84-4e31-ad9a-e83b9c4c1234'::uuid,
  'administration@ogajobs.com.ng',
  'admin',
  now()
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;