# Production Scripts Setup for package.json

Since package.json is read-only in Lovable, you need to manually add these scripts to your local package.json file before deployment:

## Required Scripts to Add

Add the following scripts to the "scripts" section of your package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:prod": "NODE_ENV=production vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    
    // Add these new production scripts:
    "prod:deploy": "./deployment/deploy.sh",
    "prod:validate": "node scripts/production-validate.js",
    "prod:monitor": "node scripts/production-monitor.js",
    "prod:health": "./deployment/post-deploy-check.sh",
    "analyze:bundle": "node scripts/bundle-analyzer.js",
    "audit:performance": "node scripts/performance-audit.js",
    "check:security": "node scripts/security-scan.js",
    "clean:build": "node scripts/clean-build.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "validate:build": "node -e \"const fs = require('fs'); if (!fs.existsSync('dist/index.html')) { console.error('Build validation failed: index.html not found'); process.exit(1); } console.log('Build validation passed');\"",
    "compress:build": "cd dist && zip -r ../ogajobs-production.zip .",
    "backup:create": "mkdir -p backups && cp -r dist backups/backup_$(date +%Y%m%d_%H%M%S)"
  }
}
```

## Usage Instructions

After adding these scripts to your package.json, you can use:

### Development Workflow
```bash
npm run dev                 # Start development server
npm run build:dev          # Build for development
npm run lint               # Run code linting
```

### Production Workflow
```bash
npm run build:prod         # Build for production
npm run analyze:bundle     # Analyze bundle size
npm run audit:performance  # Performance audit
npm run check:security     # Security scan
npm run validate:build     # Validate build output
npm run compress:build     # Create deployment zip
```

### Deployment Workflow
```bash
npm run prod:deploy        # Full deployment process
npm run prod:validate      # Validate production build
npm run prod:health        # Post-deployment health check
npm run prod:monitor       # Production monitoring
```

### Backup & Recovery
```bash
npm run backup:create      # Create backup before deployment
```

## Complete Package.json Example

Your complete package.json should look like this:

```json
{
  "name": "ogajobs",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:prod": "NODE_ENV=production vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "prod:deploy": "./deployment/deploy.sh",
    "prod:validate": "node scripts/production-validate.js",
    "prod:monitor": "node scripts/production-monitor.js",
    "prod:health": "./deployment/post-deploy-check.sh",
    "analyze:bundle": "node scripts/bundle-analyzer.js",
    "audit:performance": "node scripts/performance-audit.js",
    "check:security": "node scripts/security-scan.js",
    "clean:build": "node scripts/clean-build.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "validate:build": "node -e \"const fs = require('fs'); if (!fs.existsSync('dist/index.html')) { console.error('Build validation failed: index.html not found'); process.exit(1); } console.log('Build validation passed');\"",
    "compress:build": "cd dist && zip -r ../ogajobs-production.zip .",
    "backup:create": "mkdir -p backups && cp -r dist backups/backup_$(date +%Y%m%d_%H%M%S)"
  },
  "dependencies": {
    // ... your existing dependencies
  },
  "devDependencies": {
    // ... your existing dev dependencies
  }
}
```

## File Permissions

After copying files to your local environment, make sure to set proper permissions:

```bash
chmod +x deployment/deploy.sh
chmod +x deployment/post-deploy-check.sh
chmod +x scripts/*.js
```

## Environment Setup

1. Copy `.env.production` to your local environment
2. Update production URLs and keys as needed
3. Ensure all scripts are executable
4. Test the deployment process locally first

## AfeesHost Specific Notes

- AfeesHost typically uses Apache servers
- The `.htaccess` file is optimized for Apache
- SSL certificates can be configured via cPanel
- File uploads are done via File Manager
- Database connections use standard cPanel tools