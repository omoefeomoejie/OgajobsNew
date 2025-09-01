# Production Environment Setup

## Infrastructure Requirements

### Server Specifications
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: SSD with 100GB+ available space
- **Network**: High-speed internet with low latency
- **OS**: Ubuntu 20.04 LTS or similar

### Domain and SSL
```bash
# Domain setup
# - Purchase domain from registrar
# - Configure DNS A records to point to server IP
# - Set up www and apex domain redirects

# SSL Certificate (Let's Encrypt)
sudo apt install certbot nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/ogajobs
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
    location / {
        root /var/www/ogajobs/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

### Production .env
```bash
# Application
NODE_ENV=production
VITE_APP_TITLE="OgaJobs - Professional Services Marketplace"
VITE_APP_URL=https://yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Analytics & Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# PWA Configuration
VITE_PWA_ENABLED=true
VITE_PWA_CACHE_NAME=ogajobs-v1

# Security
VITE_CSP_NONCE=auto-generated-nonce
VITE_TRUSTED_DOMAINS=yourdomain.com,*.yourdomain.com

# Rate Limiting
VITE_API_RATE_LIMIT=1000
VITE_API_RATE_WINDOW=3600

# Monitoring
VITE_HEALTH_CHECK_ENDPOINT=/health
VITE_METRICS_ENDPOINT=/metrics
```

### Environment Variable Security
```bash
# Set proper file permissions
chmod 600 .env
chown app:app .env

# Use environment variable management
# Option 1: systemd environment files
sudo systemctl edit your-app --force
# Add: Environment="NODE_ENV=production"

# Option 2: Docker secrets
docker secret create app_env .env
```

## Deployment Process

### Automated Deployment Pipeline
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run security audit
      run: npm audit --audit-level=high
    
    - name: Build production bundle
      run: npm run build
      env:
        NODE_ENV: production
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Run bundle analysis
      run: |
        node scripts/analyze-bundle.js
        node scripts/performance-audit.js
    
    - name: Deploy to server
      run: |
        rsync -avz --delete dist/ user@server:/var/www/ogajobs/
        ssh user@server 'sudo systemctl reload nginx'
```

### Manual Deployment Steps
```bash
# 1. Prepare deployment directory
sudo mkdir -p /var/www/ogajobs
sudo chown -R $USER:$USER /var/www/ogajobs

# 2. Clone repository
git clone https://github.com/your-org/ogajobs.git /var/www/ogajobs
cd /var/www/ogajobs

# 3. Install dependencies
npm ci --only=production

# 4. Set environment variables
cp .env.production .env
# Edit .env with production values

# 5. Build application
npm run build

# 6. Configure web server
sudo ln -s /etc/nginx/sites-available/ogajobs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Set up SSL
sudo certbot --nginx -d yourdomain.com

# 8. Configure firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Production monitoring setup
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
});
```

### Server Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo nano /etc/logrotate.d/ogajobs
```

```
/var/log/nginx/access.log /var/log/nginx/error.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

### Health Checks
```bash
# Create health check script
#!/bin/bash
# /usr/local/bin/health-check.sh

# Check web server
curl -f http://localhost/health || exit 1

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Check disk space
df -h | awk '$5 > 80 {exit 1}'

# Check memory usage
free | awk 'NR==2{printf "%.2f%%\n", $3*100/$2 }' | cut -d'%' -f1 | awk '{if($1 > 90) exit 1}'

echo "Health check passed"
```

## Security Configuration

### Content Security Policy
```nginx
# Add to Nginx server block
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://your-project.supabase.co wss://your-project.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
";
```

### Security Headers
```nginx
# Security headers in Nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
```

### Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Monitor failed login attempts
sudo fail2ban-client status sshd
```

## Performance Optimization

### Caching Strategy
```nginx
# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# HTML files - short cache
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

### Compression
```nginx
# Gzip configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json
    image/svg+xml;
```

## Backup and Recovery

### Automated Backups
```bash
#!/bin/bash
# /usr/local/bin/backup.sh

BACKUP_DIR="/var/backups/ogajobs"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www ogajobs

# Backup database (if using local DB)
# pg_dump dbname > $BACKUP_DIR/db_$DATE.sql

# Clean old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/ s3://your-backup-bucket/ --recursive
```

### Recovery Procedures
```bash
# Application recovery
sudo systemctl stop nginx
cd /var/www
sudo tar -xzf /var/backups/ogajobs/app_YYYYMMDD_HHMMSS.tar.gz
sudo systemctl start nginx

# Database recovery (if applicable)
# psql dbname < /var/backups/ogajobs/db_YYYYMMDD_HHMMSS.sql
```

## Maintenance Windows

### Scheduled Maintenance
```bash
# Create maintenance page
sudo nano /var/www/maintenance.html

# Enable maintenance mode
sudo mv /etc/nginx/sites-available/ogajobs /etc/nginx/sites-available/ogajobs.backup
sudo nano /etc/nginx/sites-available/ogajobs
# Add maintenance configuration
sudo systemctl reload nginx

# After maintenance
sudo mv /etc/nginx/sites-available/ogajobs.backup /etc/nginx/sites-available/ogajobs
sudo systemctl reload nginx
```

### Update Procedures
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
# Update application
cd /var/www/ogajobs
git pull origin main
npm ci
npm run build
sudo systemctl reload nginx
```

This completes the production environment setup guide with comprehensive configuration, monitoring, security, and maintenance procedures.