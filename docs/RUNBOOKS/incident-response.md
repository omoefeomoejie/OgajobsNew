# Incident Response Runbook

## Emergency Contacts
- **On-Call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info] 
- **DevOps Lead**: [Contact Info]
- **Product Manager**: [Contact Info]

## Severity Levels

### Critical (P0) - 15min Response
- Complete service outage
- Data loss or corruption
- Security breach
- Payment system failure

### High (P1) - 1hr Response  
- Partial service degradation
- Database performance issues
- Authentication failures
- Core feature unavailable

### Medium (P2) - 4hr Response
- Non-critical feature issues
- UI/UX problems
- Performance degradation
- Integration failures

### Low (P3) - 24hr Response
- Minor bugs
- Documentation issues
- Enhancement requests

## Common Incident Scenarios

### Database Issues

#### High CPU Usage
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

# Kill problematic queries
SELECT pg_terminate_backend(pid);
```

#### Connection Pool Exhaustion
```bash
# Check connection stats
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# Check RLS policies causing issues
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Performance Issues

#### Bundle Size Alerts
```bash
# Run bundle analysis
npm run build
node scripts/analyze-bundle.js

# Check for large chunks
node scripts/bundle-analyzer.js

# Performance audit
node scripts/performance-audit.js
```

#### Memory Leaks
```bash
# Check heap usage in browser
performance.memory.usedJSHeapSize
performance.memory.totalJSHeapSize

# Monitor component renders
React DevTools Profiler
```

### Authentication Issues

#### Supabase Auth Problems
```sql
-- Check auth users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC LIMIT 10;

-- Check profiles sync
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### Deployment Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm ci
npm run build

# Check for TypeScript errors
npm run type-check

# Verify environment variables
node -e "console.log(process.env)"
```

## Escalation Procedures

1. **Acknowledge** - Respond within SLA timeframe
2. **Assess** - Determine severity and impact
3. **Act** - Implement immediate fixes
4. **Communicate** - Update stakeholders
5. **Document** - Record resolution for future reference

## Post-Incident Review

1. Timeline of events
2. Root cause analysis
3. Action items to prevent recurrence
4. Documentation updates needed

## Monitoring Dashboards

- **Application Health**: [Dashboard URL]
- **Database Performance**: [Dashboard URL]  
- **Error Tracking**: [Dashboard URL]
- **User Analytics**: [Dashboard URL]

## Recovery Procedures

### Database Recovery
```sql
-- Create backup before recovery
pg_dump -h [host] -U [user] -d [database] > backup_$(date +%Y%m%d_%H%M%S).sql

-- Point-in-time recovery
SELECT pg_create_restore_point('before_fix');
```

### Application Recovery
```bash
# Rollback deployment
git revert [commit-hash]
npm run build
npm run deploy

# Restore from backup
# [Backup restoration steps]
```