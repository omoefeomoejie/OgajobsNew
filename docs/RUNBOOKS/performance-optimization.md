# Performance Optimization Runbook

## Frontend Performance

### Bundle Optimization

#### Daily Monitoring
```bash
# Run bundle analysis
npm run build
node scripts/analyze-bundle.js

# Check bundle size thresholds
node scripts/performance-audit.js

# Monitor bundle changes
git diff HEAD~1 --name-only | grep -E '\.(js|ts|tsx)$' | xargs wc -l
```

#### Bundle Size Alerts
- **Initial Bundle**: > 500KB (Warning), > 1MB (Critical)
- **Chunk Size**: > 250KB (Warning), > 500KB (Critical)
- **CSS Bundle**: > 100KB (Warning), > 200KB (Critical)
- **Total Assets**: > 2MB (Warning), > 5MB (Critical)

#### Optimization Actions
```bash
# Analyze large chunks
npx webpack-bundle-analyzer dist/assets/*.js

# Check for duplicate dependencies
npx duplicate-package-checker

# Audit unused code
npx unimported

# Check for large libraries
npx bundlephobia [package-name]
```

### React Performance

#### Component Optimization
```typescript
// Memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
});

// Lazy loading for routes
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

#### Performance Monitoring
```typescript
// Measure component render time
const MeasuredComponent = ({ children }) => {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      if (end - start > 16) { // > 1 frame
        console.warn(`Slow render: ${end - start}ms`);
      }
    };
  });
  
  return children;
};
```

### Image Optimization

#### Responsive Images
```tsx
// Use optimized images from Supabase
const OptimizedImage = ({ src, alt, width, height }) => (
  <img
    src={`${src}?width=${width}&height=${height}&quality=80`}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);
```

#### Image Performance Audit
```bash
# Check image sizes in public folder
find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs ls -lh

# Optimize images
npx imagemin public/images/* --out-dir=public/images/optimized
```

## Backend Performance

### Database Query Optimization

#### Slow Query Analysis
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- > 100ms average
ORDER BY mean_time DESC 
LIMIT 20;
```

#### Index Optimization
```sql
-- Find missing indexes
SELECT 
  schemaname, 
  tablename, 
  seq_scan, 
  seq_tup_read,
  seq_tup_read / seq_scan as avg_tup_read
FROM pg_stat_user_tables 
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Check index usage
SELECT 
  i.relname as index_name,
  t.relname as table_name,
  s.idx_scan,
  s.idx_tup_read,
  s.idx_tup_fetch,
  pg_size_pretty(pg_relation_size(i.oid)) as index_size
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON ix.indrelid = t.oid
JOIN pg_stat_user_indexes s ON i.relname = s.indexname
WHERE i.relkind = 'i'
AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY s.idx_scan DESC;
```

#### Query Performance Improvements
```sql
-- Add composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_bookings_status_date 
ON public.bookings (status, created_at) 
WHERE status IN ('pending', 'in_progress');

-- Add partial indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_artisans_active 
ON public.artisans (city, category) 
WHERE suspended = false;

-- Add covering indexes
CREATE INDEX CONCURRENTLY idx_profiles_role_covering 
ON public.profiles (role) INCLUDE (email, created_at);
```

### Connection Pool Optimization

#### Monitor Connection Usage
```sql
-- Check active connections
SELECT 
  state,
  count(*),
  round(100.0 * count(*) / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'), 2) as percent
FROM pg_stat_activity 
GROUP BY state;

-- Check connection source
SELECT 
  client_addr,
  usename,
  datname,
  state,
  count(*)
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY client_addr, usename, datname, state
ORDER BY count DESC;
```

#### Optimize Connection Settings
```sql
-- Monitor connection pool settings
SHOW max_connections;
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;
```

## Performance Monitoring

### Web Vitals Tracking
```typescript
// Core Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance Budgets
```javascript
// Performance budgets in CI/CD
const PERFORMANCE_BUDGETS = {
  FCP: 1800, // First Contentful Paint
  LCP: 2500, // Largest Contentful Paint
  FID: 100,  // First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  TTI: 3800, // Time to Interactive
};
```

### Monitoring Dashboards

#### Key Metrics to Track
1. **Response Times**: P50, P95, P99
2. **Error Rates**: 4xx, 5xx responses
3. **Database Performance**: Query time, connection count
4. **Bundle Size**: JS, CSS, total assets
5. **Core Web Vitals**: LCP, FID, CLS
6. **User Experience**: Page load time, interaction delay

#### Alert Thresholds
```yaml
# Example alerting configuration
performance_alerts:
  bundle_size:
    warning: 500KB
    critical: 1MB
  
  response_time:
    warning: 500ms
    critical: 1000ms
  
  error_rate:
    warning: 1%
    critical: 5%
  
  database_connections:
    warning: 80%
    critical: 90%
```

## Optimization Checklist

### Daily
- [ ] Check bundle size reports
- [ ] Review error logs
- [ ] Monitor database performance
- [ ] Check Web Vitals metrics

### Weekly  
- [ ] Analyze slow queries
- [ ] Review performance budgets
- [ ] Check for unused code
- [ ] Optimize images and assets

### Monthly
- [ ] Full performance audit
- [ ] Database index review
- [ ] Bundle analysis deep dive
- [ ] Performance regression testing

## Emergency Performance Issues

### High Response Times
1. Check database query performance
2. Review application logs for errors
3. Monitor server resource usage
4. Check for blocking queries
5. Scale resources if needed

### Memory Leaks
1. Monitor JavaScript heap size
2. Check for component memory leaks
3. Review event listener cleanup
4. Analyze bundle for duplicate code
5. Profile with React DevTools

### Database Performance
1. Check for lock contention
2. Monitor connection pool usage
3. Review slow query log
4. Check for missing indexes
5. Analyze query execution plans

## Performance Best Practices

1. **Code Splitting**: Split bundles by route and feature
2. **Lazy Loading**: Load components and routes on demand
3. **Image Optimization**: Use appropriate formats and sizes
4. **Caching**: Implement proper browser and server caching
5. **Database Indexing**: Create indexes for frequent queries
6. **Connection Pooling**: Optimize database connections
7. **Monitoring**: Continuous performance monitoring
8. **Testing**: Regular performance regression testing