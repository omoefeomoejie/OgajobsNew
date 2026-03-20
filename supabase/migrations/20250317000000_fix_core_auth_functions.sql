-- Fix core authentication functions
-- Applied: 2025-03-17
-- Changes:
--   handle_new_user: removed HTTP calls during signup that caused crashes.
--   send_welcome_email_on_confirmation: now queues email asynchronously instead
--     of blocking the auth operation.
--   is_admin: reads exclusively from profiles table, not user_metadata.
--   get_user_role: reads exclusively from profiles table, not user_metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (NEW.id, NEW.email, user_role, NOW())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_welcome_email_on_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    BEGIN
      INSERT INTO public.email_queue (user_id, email, email_type, status, created_at)
      VALUES (NEW.id, NEW.email, 'welcome', 'pending', NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email queue insert failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_welcome_email_on_confirmation failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role IN ('admin', 'super_admin'), FALSE);
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'client');
EXCEPTION WHEN OTHERS THEN
  RETURN 'client';
END;
$$;
