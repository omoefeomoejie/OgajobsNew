-- Fix the setup_admin_user function to work with the profiles table structure
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email text, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert or update the admin profile with all required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    admin_user_id, 
    admin_email, 
    'admin', 
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = admin_email,
    role = 'admin',
    updated_at = now();
END;
$function$;