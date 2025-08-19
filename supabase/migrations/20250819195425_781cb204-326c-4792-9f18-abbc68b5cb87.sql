-- Create function to create admin users with proper authentication
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Unauthorized: Only admins can create admin users'
    );
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('admin', 'super_admin') THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid role. Must be admin or super_admin'
    );
  END IF;
  
  -- Validate email format
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid email format'
    );
  END IF;
  
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Email already exists'
    );
  END IF;
  
  -- Log the admin creation attempt
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_details,
    severity
  ) VALUES (
    'admin_user_creation_attempted',
    auth.uid(),
    json_build_object(
      'target_email', p_email,
      'target_role', p_role,
      'created_by', auth.email()
    ),
    'medium'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Admin user creation request validated. Proceed with user creation.',
    'email', p_email,
    'role', p_role
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$;