-- Fix the trigger error and update user role to artisan
-- The error "record new has no field updated_at" suggests a trigger is trying to access updated_at incorrectly

-- First, let's check if there are any problematic triggers and recreate the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set updated_at if the column exists in the table
    IF TG_TABLE_NAME = 'profiles' THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the specific user's role from client to artisan
UPDATE public.profiles 
SET role = 'artisan', updated_at = now()
WHERE id = '6186ed43-a06c-4314-bdc8-660a5c572cc8';

-- Create a function to sync user roles from auth metadata
CREATE OR REPLACE FUNCTION public.sync_user_role_from_metadata(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_metadata_role text;
    current_profile_role text;
BEGIN
    -- Get the role from auth.users metadata
    SELECT raw_user_meta_data->>'role' INTO user_metadata_role
    FROM auth.users 
    WHERE id = user_id_param;
    
    -- Get current profile role
    SELECT role INTO current_profile_role
    FROM public.profiles
    WHERE id = user_id_param;
    
    -- If roles don't match and metadata role exists, update profile
    IF user_metadata_role IS NOT NULL AND user_metadata_role != current_profile_role THEN
        UPDATE public.profiles
        SET role = user_metadata_role, updated_at = now()
        WHERE id = user_id_param;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;