# AfeesHost Specific Deployment Guide

Complete step-by-step guide for deploying OgaJobs to AfeesHost hosting provider.

## 📋 AfeesHost Account Setup

### Prerequisites
- [x] AfeesHost hosting account
- [x] Domain name configured
- [x] cPanel access credentials
- [x] SSL certificate (recommended)

### Account Information
- **Provider:** AfeesHost (afeeshost.com)
- **Control Panel:** cPanel
- **Server Type:** Shared/VPS (Apache-based)
- **PHP Support:** Available (not needed for this project)
- **Database:** MySQL/PostgreSQL available

## 🚀 Deployment Process

### Step 1: Prepare Local Environment

1. **Clone/Download Project**
   ```bash
   git clone <your-repo>
   cd ogajobs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Update package.json** (see scripts/production-scripts-setup.md)

4. **Configure Environment**
   ```bash
   cp .env.production .env.local
   # Update with your production values
   ```

### Step 2: Build for Production

1. **Run Quality Checks**
   ```bash
   npm run lint
   npm run check:security
   npm run audit:performance
   ```

2. **Build Application**
   ```bash
   npm run build:prod
   ```

3. **Validate Build**
   ```bash
   npm run validate:build
   ls -la dist/  # Check build contents
   ```

4. **Create Deployment Package**
   ```bash
   npm run compress:build
   # Creates ogajobs-production.zip
   ```

### Step 3: AfeesHost cPanel Upload

1. **Login to cPanel**
   - URL: Usually `yourdomain.com/cpanel` or `yourdomain.com:2083`
   - Use credentials provided by AfeesHost

2. **Access File Manager**
   - Click "File Manager" in cPanel
   - Navigate to `public_html` directory
   - This is your web root directory

3. **Clear Existing Files** (if updating)
   ```
   Select all files in public_html
   Delete existing files (backup first if needed)
   ```

4. **Upload Build Files**
   - Click "Upload" button
   - Select `ogajobs-production.zip`
   - Wait for upload to complete
   - Extract the zip file in `public_html`
   - Delete the zip file after extraction

### Step 4: SSL Certificate Configuration

#### Option 1: Free SSL (Let's Encrypt)
1. In cPanel, find "SSL/TLS" section
2. Click "Let's Encrypt SSL"
3. Select your domain
4. Click "Install SSL Certificate"

#### Option 2: Purchased SSL
1. Upload certificate files via cPanel SSL section
2. Install private key and certificate
3. Enable "Force HTTPS Redirect"

### Step 5: Domain Configuration

1. **DNS Settings**
   - Point A record to AfeesHost server IP
   - Add CNAME for www subdomain
   - Wait for propagation (up to 24-48 hours)

2. **Subdomain Setup** (if needed)
   - Create subdomains via cPanel
   - Point to appropriate directories

### Step 6: Database Setup (Supabase)

Since OgaJobs uses Supabase, no database setup is needed on AfeesHost:
- Database is hosted on Supabase
- Configure connection strings in environment
- Verify API endpoints are accessible

### Step 7: Performance Optimization

#### Enable Compression
```apache
# Already included in .htaccess
# Gzip compression for better performance
```

#### Configure Caching
```apache
# Browser caching rules in .htaccess
# Static assets cached for 1 year
```

#### Optimize Images
- Images are already optimized during build
- WebP format used where supported
- Lazy loading implemented

## 🔧 AfeesHost Specific Configuration

### File Permissions
Set appropriate permissions via cPanel File Manager:
```
Folders: 755 or 750
Files: 644 or 640
.htaccess: 644
```

### Error Pages
Custom error pages are handled by React Router:
- 404 errors redirect to index.html
- Client-side routing handles navigation

### Security Settings
The `.htaccess` file includes:
- Security headers
- XSS protection
- CSRF protection
- File access restrictions

### Email Configuration
If using contact forms (future feature):
1. Set up email accounts in cPanel
2. Configure SMTP settings
3. Use Supabase edge functions for email sending

## 📊 Monitoring & Maintenance

### Performance Monitoring
1. **Google PageSpeed Insights**
   - Test: https://pagespeed.web.dev/
   - Target: Score > 90

2. **GTmetrix**
   - Test: https://gtmetrix.com/
   - Monitor loading times

3. **Uptime Monitoring**
   - Use external services like UptimeRobot
   - Monitor 24/7 availability

### Regular Maintenance
1. **Weekly Checks**
   - Verify site is loading correctly
   - Check for SSL certificate validity
   - Monitor error logs in cPanel

2. **Monthly Updates**
   - Update dependencies locally
   - Rebuild and redeploy if needed
   - Review performance metrics

3. **Backup Strategy**
   - AfeesHost provides automatic backups
   - Create additional backups before major updates
   - Store source code in version control

## 🚨 Troubleshooting Common Issues

### Issue: Site Not Loading
**Solutions:**
1. Check DNS propagation
2. Verify files uploaded correctly
3. Check .htaccess syntax
4. Review cPanel error logs

### Issue: 404 Errors on Routes
**Solutions:**
1. Verify .htaccess is uploaded
2. Check mod_rewrite is enabled
3. Ensure file permissions are correct

### Issue: SSL Certificate Problems
**Solutions:**
1. Regenerate Let's Encrypt certificate
2. Check certificate installation
3. Verify HTTPS redirect rules

### Issue: Slow Loading
**Solutions:**
1. Enable Gzip compression (in .htaccess)
2. Optimize images further
3. Check AfeesHost server performance
4. Consider CDN integration

### Issue: API Calls Failing
**Solutions:**
1. Check Supabase connection strings
2. Verify CORS settings
3. Test API endpoints directly

## 📞 AfeesHost Support

### Contact Information
- **Website:** afeeshost.com
- **Support Email:** Check your hosting account
- **Phone:** Available during business hours
- **Live Chat:** Available via website

### Support Scope
- Server configuration help
- cPanel assistance
- SSL certificate installation
- DNS configuration support
- Basic troubleshooting

### Documentation
- AfeesHost knowledge base
- cPanel documentation
- Video tutorials available

## 🔄 Update Process

### For Future Updates
1. **Prepare Update**
   ```bash
   git pull origin main
   npm install
   npm run build:prod
   npm run compress:build
   ```

2. **Backup Current Site**
   - Download current files via cPanel
   - Create backup folder

3. **Deploy Update**
   - Upload new zip file
   - Extract and replace files
   - Test functionality

4. **Rollback if Needed**
   - Restore from backup
   - Investigate issues locally
   - Re-deploy when fixed

### Automated Updates (Future Enhancement)
Consider setting up:
- GitHub Actions for automated deployment
- FTP/SFTP deployment scripts
- Continuous integration pipeline

---

## ✅ Deployment Checklist

Print and use this checklist for each deployment:

```
□ Local environment prepared
□ Dependencies installed
□ Quality checks passed
□ Production build created
□ Build validated
□ Deployment package created
□ cPanel accessed
□ Old files backed up
□ New files uploaded
□ Files extracted correctly
□ SSL certificate active
□ DNS configured
□ Performance tested
□ Security headers verified
□ Client-side routing working
□ API connections tested
□ Error pages functional
□ Post-deployment health check passed

Deployment Date: _______________
Deployed by: _______________
Build Version: _______________
Performance Score: _______________
SSL Status: ✅ / ❌
All Tests Passed: ✅ / ❌
```