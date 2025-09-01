# Database Maintenance Runbook

## Daily Maintenance

### Health Checks
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres')) as database_size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY bytes DESC;

-- Check index usage
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_tup_read, 
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Performance Monitoring
```sql
-- Slow query analysis
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Lock monitoring
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Weekly Maintenance

### Index Optimization
```sql
-- Check for unused indexes
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan < 100
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Rebuild fragmented indexes
REINDEX INDEX CONCURRENTLY [index_name];

-- Update table statistics
ANALYZE;
```

### Security Audit
```sql
-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- Check for tables without RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename 
  FROM pg_tables t, pg_class c, pg_namespace n
  WHERE t.tablename = c.relname 
  AND c.relnamespace = n.oid
  AND n.nspname = t.schemaname
  AND c.relrowsecurity = true
);

-- Audit sensitive data access
SELECT * FROM public.audit_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
AND table_name IN ('artisan_payment_methods', 'identity_verifications', 'artisan_earnings_v2')
ORDER BY created_at DESC;
```

## Monthly Maintenance

### Performance Tuning
```sql
-- Update query planner statistics
ANALYZE VERBOSE;

-- Check for missing foreign key indexes
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE tablename = tc.table_name 
  AND indexdef LIKE '%' || kcu.column_name || '%'
);
```

### Data Cleanup
```sql
-- Clean up old audit logs (older than 3 months)
DELETE FROM public.audit_logs 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Clean up old security events (older than 6 months)
DELETE FROM public.security_events 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Archive old booking data
-- [Archival procedures based on business requirements]
```

### Backup Verification
```bash
# Test backup restoration
pg_dump -h [host] -U [user] -d [database] -f test_backup.sql
createdb test_restore_db
psql -d test_restore_db -f test_backup.sql

# Verify data integrity
psql -d test_restore_db -c "SELECT COUNT(*) FROM public.profiles;"
```

## Emergency Procedures

### Connection Limit Reached
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < now() - interval '1 hour';
```

### Disk Space Issues
```sql
-- Check disk usage
SELECT 
  name,
  setting,
  unit,
  source
FROM pg_settings 
WHERE name LIKE '%dir%' OR name LIKE '%path%';

-- Archive old WAL files
SELECT pg_switch_wal();
```

### Query Performance Issues
```sql
-- Find blocking queries
SELECT 
  activity.pid,
  activity.usename,
  activity.query,
  activity.state,
  blocking.pid as blocked_by
FROM pg_stat_activity activity
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(activity.pid))
WHERE activity.state = 'active';

-- Kill problematic queries
SELECT pg_cancel_backend([pid]); -- Graceful
SELECT pg_terminate_backend([pid]); -- Forceful
```

## Monitoring Alerts

### Critical Thresholds
- **Connection Usage**: > 80% of max_connections
- **Disk Usage**: > 85% of available space
- **Query Duration**: > 30 seconds
- **Lock Waits**: > 5 seconds
- **Replication Lag**: > 1 minute

### Response Actions
1. **Immediate**: Check alert dashboard
2. **5 minutes**: Investigate root cause
3. **15 minutes**: Implement fix or escalate
4. **30 minutes**: Update stakeholders

## Best Practices

1. **Always backup before maintenance**
2. **Test changes in staging first**
3. **Monitor system during maintenance**
4. **Document all changes made**
5. **Verify system health after maintenance**
6. **Keep maintenance windows short**
7. **Have rollback plan ready**