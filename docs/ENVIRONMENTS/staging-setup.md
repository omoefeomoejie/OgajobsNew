# Staging Environment Setup

## Purpose and Scope

The staging environment is a production-like environment used for:
- **Pre-production Testing**: Final testing before production deployment
- **Integration Testing**: Testing with production-like data and services
- **User Acceptance Testing**: Client and stakeholder validation
- **Performance Testing**: Load and stress testing
- **Security Testing**: Penetration testing and vulnerability assessment

## Infrastructure Requirements

### Server Specifications (Minimum)
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)  
- **Storage**: SSD with 50GB+ available space
- **Network**: Stable internet connection
- **OS**: Ubuntu 20.04 LTS or similar

### Domain Configuration
```bash
# Staging subdomain setup
# staging.yourdomain.com or yourdomain-staging.com
# Configure DNS A record to point to staging server IP

# SSL Certificate for staging
sudo certbot --nginx -d staging.yourdomain.com
```

## Environment Configuration

### Staging Environment Variables
```bash
# .env.staging
NODE_ENV=staging
VITE_APP_TITLE="OgaJobs (Staging) - Professional Services Marketplace"
VITE_APP_URL=https://staging.yourdomain.com

# Supabase Configuration (Staging Project)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key_here

# Analytics & Monitoring (Separate from production)
VITE_SENTRY_DSN=https://your-staging-sentry-dsn
VITE_GA_MEASUREMENT_ID=G-STAGING-XXXXXXXXXX

# Feature Flags (More permissive than production)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_DEBUG_MODE=true

# Testing Features
VITE_ENABLE_TEST_DATA=true
VITE_ENABLE_MOCK_PAYMENTS=true
VITE_BYPASS_EMAIL_VERIFICATION=true

# Security (Less restrictive for testing)
VITE_CSP_NONCE=staging-nonce
VITE_TRUSTED_DOMAINS=staging.yourdomain.com,*.staging.yourdomain.com

# Rate Limiting (Higher limits for testing)
VITE_API_RATE_LIMIT=5000
VITE_API_RATE_WINDOW=3600

# Staging-specific settings
VITE_STAGING_BANNER=true
VITE_AUTO_LOGIN_TEST_USER=true
```

### Nginx Configuration for Staging
```nginx
# /etc/nginx/sites-available/ogajobs-staging
server {
    listen 80;
    server_name staging.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.yourdomain.com/privkey.pem;
    
    # Staging banner injection
    sub_filter '<body>' '<body><div class="staging-banner">⚠️ STAGING ENVIRONMENT - NOT FOR PRODUCTION USE</div>';
    sub_filter_once on;
    
    # Less restrictive security headers for testing
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Staging-specific CSP (more permissive)
    add_header Content-Security-Policy "
        default-src 'self' 'unsafe-inline' 'unsafe-eval';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://your-staging-project.supabase.co wss://your-staging-project.supabase.co;
    ";
    
    # Basic auth for staging (optional)
    # auth_basic "Staging Environment";
    # auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        root /var/www/ogajobs-staging/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # No caching for staging
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma no-cache;
        add_header Expires 0;
    }
}
```

## Database Setup

### Supabase Staging Project
```sql
-- Create staging-specific configuration
-- Use a separate Supabase project for staging

-- Staging-specific settings
INSERT INTO public.system_settings (key, value) VALUES
('environment', 'staging'),
('auto_approve_test_users', 'true'),
('enable_test_payments', 'true'),
('bypass_email_verification', 'true');

-- Create test data
INSERT INTO public.profiles (id, email, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@staging.com', 'admin', now()),
('22222222-2222-2222-2222-222222222222', 'artisan@staging.com', 'artisan', now()),
('33333333-3333-3333-3333-333333333333', 'client@staging.com', 'client', now());

-- Create test artisans
INSERT INTO public.artisans (id, email, full_name, category, city, phone) VALUES
('22222222-2222-2222-2222-222222222222', 'artisan@staging.com', 'Test Artisan', 'plumbing', 'Lagos', '+234-800-000-0001'),
('44444444-4444-4444-4444-444444444444', 'artisan2@staging.com', 'Test Artisan 2', 'electrical', 'Abuja', '+234-800-000-0002');

-- Create test bookings
INSERT INTO public.bookings (id, client_email, artisan_id, work_type, description, total_amount, status) VALUES
('55555555-5555-5555-5555-555555555555', 'client@staging.com', '22222222-2222-2222-2222-222222222222', 'plumbing', 'Test plumbing job', 5000.00, 'pending'),
('66666666-6666-6666-6666-666666666666', 'client@staging.com', '44444444-4444-4444-4444-444444444444', 'electrical', 'Test electrical job', 7500.00, 'in_progress');
```

### Database Migration Strategy
```bash
# Automated staging database refresh
#!/bin/bash
# /usr/local/bin/refresh-staging-db.sh

# Backup current staging data
pg_dump -h staging-db-host -U staging_user -d staging_db > /tmp/staging_backup_$(date +%Y%m%d).sql

# Reset staging database to match production structure
psql -h staging-db-host -U staging_user -d staging_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply latest migrations
supabase db reset --project-ref your-staging-project-ref

# Load test data
psql -h staging-db-host -U staging_user -d staging_db -f /var/staging-data/test-data.sql

echo "Staging database refreshed successfully"
```

## Deployment Pipeline

### Automated Staging Deployment
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm test -- --coverage
    
    - name: Run type checking
      run: npm run type-check

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build staging bundle
      run: npm run build:staging
      env:
        NODE_ENV: staging
        VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
        VITE_SENTRY_DSN: ${{ secrets.STAGING_SENTRY_DSN }}
    
    - name: Run bundle analysis
      run: |
        node scripts/analyze-bundle.js
        node scripts/performance-audit.js
    
    - name: Deploy to staging server
      run: |
        rsync -avz --delete dist/ user@staging-server:/var/www/ogajobs-staging/
        ssh user@staging-server 'sudo systemctl reload nginx'
    
    - name: Run smoke tests
      run: |
        npm run test:e2e:staging
    
    - name: Notify deployment
      run: |
        echo "🚀 Staging deployment completed: https://staging.yourdomain.com"
```

### Manual Staging Deployment
```bash
# Manual deployment script
#!/bin/bash
# /usr/local/bin/deploy-staging.sh

set -e

STAGING_DIR="/var/www/ogajobs-staging"
BACKUP_DIR="/var/backups/staging"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting staging deployment..."

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/staging_backup_$DATE.tar.gz -C /var/www ogajobs-staging

# Pull latest code
echo "📥 Pulling latest code..."
cd $STAGING_DIR
git fetch origin
git checkout develop
git pull origin develop

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

# Build application
echo "🏗️ Building application..."
npm run build:staging

# Reload web server
echo "🔄 Reloading web server..."
sudo systemctl reload nginx

# Run smoke tests
echo "🧪 Running smoke tests..."
curl -f https://staging.yourdomain.com/health || {
    echo "❌ Smoke test failed, rolling back..."
    tar -xzf $BACKUP_DIR/staging_backup_$DATE.tar.gz -C /var/www/
    sudo systemctl reload nginx
    exit 1
}

echo "✅ Staging deployment completed successfully!"
echo "🌐 Staging URL: https://staging.yourdomain.com"
```

## Testing Configuration

### E2E Testing for Staging
```typescript
// playwright.config.staging.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'https://staging.yourdomain.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

### Staging-Specific Test Data
```typescript
// tests/fixtures/staging-data.ts
export const STAGING_TEST_USERS = {
  admin: {
    email: 'admin@staging.com',
    password: 'staging123!',
    role: 'admin'
  },
  artisan: {
    email: 'artisan@staging.com',
    password: 'staging123!',
    role: 'artisan'
  },
  client: {
    email: 'client@staging.com',
    password: 'staging123!',
    role: 'client'
  }
};

export const STAGING_TEST_BOOKINGS = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    workType: 'plumbing',
    description: 'Test plumbing job',
    amount: 5000
  }
];
```

### Load Testing Configuration
```javascript
// k6-load-test-staging.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function() {
  let response = http.get('https://staging.yourdomain.com');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'page loads in < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
```

## Monitoring and Logging

### Staging-Specific Monitoring
```javascript
// Sentry configuration for staging
import * as Sentry from '@sentry/react';

if (process.env.NODE_ENV === 'staging') {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: 'staging',
    tracesSampleRate: 1.0, // 100% for staging
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    beforeSend: (event) => {
      // Add staging context
      event.tags = { ...event.tags, environment: 'staging' };
      return event;
    },
  });
}
```

### Log Management
```bash
# Staging log configuration
# /etc/rsyslog.d/50-staging.conf
:programname, isequal, "ogajobs-staging" /var/log/ogajobs-staging.log
:programname, isequal, "ogajobs-staging" stop

# Log rotation for staging
# /etc/logrotate.d/ogajobs-staging
/var/log/ogajobs-staging.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Security Considerations

### Staging Security Policy
```nginx
# Basic authentication for staging (optional)
location / {
    auth_basic "Staging Environment - Authorized Personnel Only";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # Continue with normal location block
    try_files $uri $uri/ /index.html;
}
```

### Test Data Privacy
```sql
-- Anonymize sensitive data for staging
UPDATE public.artisans SET 
  phone = '+234-800-000-' || LPAD((random() * 9999)::text, 4, '0'),
  email = 'test' || id::text || '@staging.com'
WHERE email NOT LIKE '%@staging.com';

-- Remove real payment information
DELETE FROM public.artisan_payment_methods WHERE bank_account_number NOT LIKE 'TEST%';
```

## Maintenance and Cleanup

### Automated Cleanup Scripts
```bash
#!/bin/bash
# /usr/local/bin/staging-cleanup.sh

# Clean old test data (older than 30 days)
psql -h staging-db -U staging_user -d staging_db -c "
DELETE FROM public.bookings WHERE created_at < NOW() - INTERVAL '30 days' AND description LIKE 'Test%';
DELETE FROM public.support_tickets_v2 WHERE created_at < NOW() - INTERVAL '7 days' AND subject LIKE 'Test%';
"

# Clean old log files
find /var/log -name "*staging*" -type f -mtime +7 -delete

# Clean old backups
find /var/backups/staging -type f -mtime +7 -delete

echo "Staging cleanup completed"
```

### Refresh from Production
```bash
#!/bin/bash
# /usr/local/bin/refresh-staging-from-prod.sh

# This script should be run periodically to keep staging in sync with production

echo "🔄 Refreshing staging from production..."

# Backup current staging
pg_dump staging_db > /tmp/staging_backup_$(date +%Y%m%d).sql

# Copy production schema (without sensitive data)
pg_dump --schema-only production_db | psql staging_db

# Copy non-sensitive production data
pg_dump --data-only --exclude-table=artisan_payment_methods --exclude-table=identity_verifications production_db | psql staging_db

# Apply staging-specific configurations
psql staging_db -f /var/staging-data/staging-config.sql

echo "✅ Staging refresh completed"
```

This staging environment setup provides a comprehensive testing platform that mirrors production while maintaining appropriate security and testing capabilities.