-- PHASE 1: Remove competing profile creation trigger
-- This eliminates the race condition between trigger and RPC profile creation

-- Drop the handle_new_user trigger that competes with frontend RPC calls
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well since we're only using RPC-based profile creation
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify no other triggers are competing on auth.users
SELECT 
  tgname as trigger_name,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;