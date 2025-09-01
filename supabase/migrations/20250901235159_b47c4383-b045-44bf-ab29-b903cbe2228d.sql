-- Fix the profiles table structure to remove conflicting defaults
-- The id column should not have auth.uid() as default when we're explicitly setting it

-- Remove the problematic default from the id column
ALTER TABLE public.profiles 
ALTER COLUMN id DROP DEFAULT;

-- Also ensure the primary key constraint exists properly
-- This should already exist but let's make sure
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_pkey' 
        AND contype = 'p'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Add a function to safely handle profile creation with better error handling
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'client',
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_profile JSONB;
BEGIN
    -- Insert or update profile
    INSERT INTO public.profiles (
        id, 
        email, 
        role,
        full_name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_role,
        p_full_name,
        p_phone,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW()
    RETURNING to_jsonb(profiles.*) INTO result_profile;
    
    RETURN jsonb_build_object(
        'success', true,
        'profile', result_profile
    );
    
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$;