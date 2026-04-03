-- Add name/email columns to conversations so both sides can display
-- the other party's name without needing a cross-user profiles lookup
-- (which RLS blocks for regular authenticated users).

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS artisan_email TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS artisan_name  TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_name   TEXT;

-- SECURITY DEFINER: lets the artisan look up the client's display name
-- by email at the moment they accept a booking, bypassing RLS.
CREATE OR REPLACE FUNCTION public.get_display_name_by_email(user_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(full_name, split_part(user_email, '@', 1))
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;
$$;
