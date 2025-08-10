-- Fix admin user setup by updating existing profile
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'administration@ogajobs.com.ng';

-- Check if profile exists for the admin user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'administration@ogajobs.com.ng') THEN
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (
      gen_random_uuid(),
      'administration@ogajobs.com.ng',
      'admin',
      now()
    );
  END IF;
END $$;