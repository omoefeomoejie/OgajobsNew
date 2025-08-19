-- Check what triggers exist on auth.users and profiles tables  
SELECT n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name, p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname IN ('auth', 'public') 
AND c.relname IN ('users', 'profiles')
AND NOT t.tgisinternal;