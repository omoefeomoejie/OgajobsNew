# Deployment Guide

## Production Deployment

### Prerequisites
- Supabase project configured
- Domain name (optional)
- SSL certificates

### Environment Setup

1. **Supabase Configuration**
   ```bash
   # Set production environment variables
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-production-anon-key
   ```

2. **Build Process**
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build and deploy
npm run build
# Upload dist folder to Netlify
```

#### Manual Deployment
```bash
# Build for production
npm run build

# Upload dist/ folder to your hosting provider
```

### Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] SSL certificate active
- [ ] Analytics tracking enabled
- [ ] Error monitoring configured
- [ ] Performance monitoring active
- [ ] Backup systems operational

### Monitoring

- **Error Tracking**: Sentry integration
- **Performance**: Lighthouse CI
- **Uptime**: StatusPage monitoring
- **Analytics**: Supabase Analytics

### Troubleshooting

Common deployment issues:
1. Environment variables missing
2. Database connection errors
3. Edge function deployment failures
4. CORS configuration issues

Contact: devops@ogajobs.ng for deployment support.