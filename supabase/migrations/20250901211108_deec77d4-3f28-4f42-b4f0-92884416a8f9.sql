-- Fix the remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fix get_all_users_with_roles function
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, email text, role text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
-- Only allow admins to see all users
SELECT
  CASE WHEN is_admin() THEN au.id ELSE NULL END,
  CASE WHEN is_admin() THEN au.email ELSE NULL END,
  CASE WHEN is_admin() THEN p.role ELSE NULL END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE is_admin(); -- Only return data if user is admin
$$;