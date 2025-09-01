-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Fix the handle_new_user function to properly access user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user trigger started for user ID: %', NEW.id;
  
  -- Insert or update the profile with proper metadata extraction
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phoneNumber'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', profiles.full_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'phoneNumber', profiles.phone),
    role = COALESCE(NEW.raw_user_meta_data->>'role', profiles.role, 'client'),
    updated_at = now();

  RAISE LOG 'handle_new_user completed successfully for user: %', NEW.email;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE LOG 'handle_new_user error for user %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;