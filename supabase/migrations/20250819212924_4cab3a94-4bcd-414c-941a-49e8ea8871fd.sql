-- Check what triggers exist on auth.users and profiles tables
SELECT schemaname, tablename, triggername, tgtype, proname 
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE schemaname IN ('auth', 'public') 
AND tablename IN ('users', 'profiles');