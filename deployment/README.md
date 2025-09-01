# OgaJobs Production Deployment Guide

Complete guide for deploying OgaJobs to AfeesHost production environment.

## 🚀 Quick Start

1. **Prepare for deployment:**
   ```bash
   chmod +x deployment/deploy.sh
   ./deployment/deploy.sh
   ```

2. **Upload to AfeesHost:**
   - Compress the `dist` folder
   - Upload via AfeesHost File Manager
   - Extract to `public_html`

3. **Post-deployment check:**
   ```bash
   chmod +x deployment/post-deploy-check.sh
   ./deployment/post-deploy-check.sh
   ```

## 📋 Pre-Deployment Checklist

### Required Files
- [x] `.env.production` - Production environment variables
- [x] `dist/` - Built application (generated during deployment)
- [x] `nginx.conf` - Nginx configuration (optional)
- [x] `public/.htaccess` - Apache rewrite rules

### Required Scripts (Add to package.json)
```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build",
    "prod:deploy": "./deployment/deploy.sh",
    "prod:validate": "node scripts/production-validate.js",
    "prod:monitor": "node scripts/production-monitor.js",
    "analyze:bundle": "node scripts/bundle-analyzer.js",
    "audit:performance": "node scripts/performance-audit.js",
    "check:security": "node scripts/security-scan.js",
    "clean:build": "node scripts/clean-build.js"
  }
}
```

## 🔧 AfeesHost Deployment Steps

### Step 1: Local Preparation
```bash
# Install dependencies
npm ci

# Run quality checks
npm run lint
npm run check:security
npm run audit:performance

# Build for production
npm run build:prod
```

### Step 2: File Upload
1. **Compress build folder:**
   ```bash
   cd dist
   zip -r ../ogajobs-production.zip .
   ```

2. **Upload via AfeesHost:**
   - Login to AfeesHost cPanel
   - Navigate to File Manager
   - Go to `public_html` directory
   - Upload `ogajobs-production.zip`
   - Extract the archive
   - Delete the zip file

### Step 3: Server Configuration

#### Apache Configuration (.htaccess)
The `.htaccess` file in your build handles:
- Client-side routing redirects
- Static asset caching
- Admin route protection

#### Nginx Configuration (if available)
Use the provided `nginx.conf` for:
- SSL configuration
- Security headers
- Gzip compression
- Performance optimization

### Step 4: SSL Certificate
1. Purchase/configure SSL via AfeesHost
2. Update domain settings
3. Force HTTPS redirects

### Step 5: DNS Configuration
1. Point domain to AfeesHost servers
2. Configure www subdomain
3. Verify propagation

## 🔍 Post-Deployment Verification

### Automated Health Check
```bash
./deployment/post-deploy-check.sh
```

### Manual Verification
1. **Core Functionality:**
   - [ ] Homepage loads correctly
   - [ ] User authentication works
   - [ ] Service browsing functional
   - [ ] Booking process works
   - [ ] Admin panel accessible

2. **Performance:**
   - [ ] Page load times < 3 seconds
   - [ ] Images load quickly
   - [ ] No console errors
   - [ ] Mobile responsiveness

3. **Security:**
   - [ ] HTTPS enforced
   - [ ] Security headers present
   - [ ] No sensitive data exposed
   - [ ] Admin routes protected

4. **PWA Features:**
   - [ ] Service worker active
   - [ ] Offline functionality
   - [ ] Install prompt works
   - [ ] Push notifications (if enabled)

## 📊 Monitoring & Maintenance

### Performance Monitoring
- **Sentry:** Error tracking and performance monitoring
- **Analytics:** User behavior and conversion tracking
- **Uptime:** Server availability monitoring

### Regular Maintenance
1. **Weekly:**
   - Check error logs
   - Review performance metrics
   - Update security patches

2. **Monthly:**
   - Backup database
   - Review analytics reports
   - Update dependencies

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Feature updates

## 🔧 Configuration Files

### Environment Variables (.env.production)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vclzkuzexsuhaaliweey.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-key

# Feature Flags
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
```

### Build Configuration (vite.config.ts)
- Optimized chunking strategy
- Bundle analysis integration
- Production optimizations
- Source map configuration

## 🚨 Troubleshooting

### Common Issues

1. **404 Errors on Routes:**
   - Verify `.htaccess` is uploaded
   - Check Apache mod_rewrite is enabled
   - Confirm file permissions

2. **Slow Loading:**
   - Enable gzip compression
   - Optimize images
   - Check CDN configuration

3. **Authentication Issues:**
   - Verify Supabase URLs
   - Check CORS settings
   - Validate environment variables

4. **PWA Not Working:**
   - Check service worker registration
   - Verify manifest.json
   - Test HTTPS requirement

### Debug Commands
```bash
# Check build output
ls -la dist/

# Validate HTML
grep -r "script\|link" dist/index.html

# Test gzip compression
curl -H "Accept-Encoding: gzip" -I https://ogajobs.ng

# Check security headers
curl -I https://ogajobs.ng
```

## 📞 Support

### AfeesHost Support
- **Website:** [afeeshost.com](https://afeeshost.com)
- **Support:** Available 24/7
- **Documentation:** Check AfeesHost knowledge base

### Technical Support
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Vite:** [vitejs.dev](https://vitejs.dev)
- **React:** [reactjs.org](https://reactjs.org)

## 🔄 Rollback Procedure

If deployment fails:
1. **Restore backup:**
   ```bash
   # Backup is automatically created during deployment
   cp -r backups/backup_YYYYMMDD_HHMMSS/* public_html/
   ```

2. **Verify rollback:**
   ```bash
   curl -I https://ogajobs.ng
   ```

3. **Investigate issues:**
   - Check deployment logs
   - Review error messages
   - Test locally first

---

## 📝 Deployment Log Template

```
Deployment Date: _______________
Environment: Production
Deployer: _______________
Build Size: _______________
Performance Score: _______________
Security Check: ✅ / ❌
SSL Status: ✅ / ❌
Domain Status: ✅ / ❌
PWA Status: ✅ / ❌

Notes:
_________________________________
_________________________________
```