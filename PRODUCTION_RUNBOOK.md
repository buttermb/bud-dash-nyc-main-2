# 🔧 Production Runbook

## System Overview

**New York Minute NYC** - Premium cannabis delivery platform  
**Tech Stack**: React 18 + TypeScript + Vite + Supabase + Vercel  
**Architecture**: SPA with PWA capabilities, real-time updates, multi-tenant

## Quick Commands

### Development
```bash
# Start development server
npm run dev

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Build for production
npm run build
npm run preview
```

### Database
```bash
# Run migrations
supabase db push

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Deployment
```bash
# Deploy to staging
vercel --prod=false

# Deploy to production
vercel --prod

# Rollback
vercel --rollback
```

## Monitoring & Alerts

### Key Dashboards
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Monitoring Dashboard**: `/admin/monitoring`
- **Security Dashboard**: `/admin/security`

### Critical Metrics
- **Uptime**: > 99.9%
- **Response Time**: < 2s
- **Error Rate**: < 1%
- **Core Web Vitals**: All green

### Alert Channels
- **Slack**: #alerts, #deployments
- **Email**: alerts@newyorkminutenyc.com
- **SMS**: Critical alerts only

## Troubleshooting

### Common Issues

#### 1. High Error Rate
**Symptoms**: Error rate > 5%  
**Investigation**:
```bash
# Check recent errors
curl https://api.newyorkminutenyc.com/api/health

# Check Supabase logs
supabase logs --level error

# Check Vercel logs
vercel logs --follow
```

**Resolution**:
- Check for recent deployments
- Review error logs
- Check external service status
- Consider rollback if critical

#### 2. Slow Performance
**Symptoms**: Page load time > 3s  
**Investigation**:
```bash
# Check Core Web Vitals
lighthouse https://newyorkminutenyc.com

# Check bundle size
npm run build -- --analyze

# Check API response times
curl -w "@curl-format.txt" https://api.newyorkminutenyc.com/api/products
```

**Resolution**:
- Check CDN status
- Review bundle size
- Check database performance
- Optimize images/assets

#### 3. Database Issues
**Symptoms**: Database connection errors  
**Investigation**:
```bash
# Check database status
supabase status

# Check connection pool
supabase db ping

# Check recent migrations
supabase migration list
```

**Resolution**:
- Check Supabase status page
- Review connection limits
- Check for long-running queries
- Consider scaling up

#### 4. Authentication Issues
**Symptoms**: Users can't log in  
**Investigation**:
```bash
# Check auth logs
supabase logs --level auth

# Check security events
SELECT * FROM security_events 
WHERE event_type LIKE '%login%' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Resolution**:
- Check Supabase Auth status
- Review security policies
- Check rate limiting
- Verify JWT configuration

### Emergency Procedures

#### Complete System Outage
1. **Immediate Response** (0-5 minutes)
   - Check status pages (Vercel, Supabase, Mapbox)
   - Notify team via Slack
   - Update status page

2. **Investigation** (5-15 minutes)
   - Check monitoring dashboards
   - Review recent deployments
   - Check error logs

3. **Resolution** (15-30 minutes)
   - Rollback if recent deployment
   - Scale up resources if needed
   - Contact support if external issue

#### Security Incident
1. **Immediate Response** (0-5 minutes)
   - Isolate affected systems
   - Notify security team
   - Preserve evidence

2. **Investigation** (5-30 minutes)
   - Review security logs
   - Check for data breaches
   - Assess impact

3. **Resolution** (30-60 minutes)
   - Patch vulnerabilities
   - Reset compromised accounts
   - Update security policies

## Maintenance Procedures

### Daily Tasks
- [ ] Check error rates
- [ ] Review security logs
- [ ] Monitor performance metrics
- [ ] Check backup status

### Weekly Tasks
- [ ] Review security events
- [ ] Update dependencies
- [ ] Performance optimization
- [ ] Capacity planning

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Disaster recovery test
- [ ] Documentation update

## Backup & Recovery

### Database Backups
- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Location**: Supabase managed backups
- **Recovery Time**: < 1 hour

### Application Backups
- **Code**: Git repository (GitHub)
- **Assets**: Vercel CDN
- **Configuration**: Environment variables

### Recovery Procedures
1. **Database Recovery**
   ```bash
   # Restore from backup
   supabase db restore --backup-id <backup-id>
   ```

2. **Application Recovery**
   ```bash
   # Deploy from specific commit
   vercel --prod --force
   ```

## Security Procedures

### Access Control
- **Admin Access**: MFA required
- **Database Access**: IP whitelist
- **API Access**: Rate limited
- **File Access**: RLS policies

### Incident Response
1. **Detection**: Automated monitoring
2. **Analysis**: Security team review
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore from backups
5. **Lessons Learned**: Post-incident review

### Compliance
- **GDPR**: Data retention policies
- **CCPA**: User data protection
- **SOC 2**: Audit logging
- **PCI DSS**: Payment security

## Performance Optimization

### Monitoring
- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: < 500KB
- **API Response**: < 2s
- **Cache Hit Rate**: > 80%

### Optimization Strategies
- **Code Splitting**: Lazy loading
- **Image Optimization**: WebP, lazy loading
- **Caching**: Multi-tier caching
- **CDN**: Global distribution

### Scaling
- **Horizontal**: Multiple instances
- **Vertical**: Larger instances
- **Database**: Read replicas
- **Cache**: Redis cluster

## Contact Information

### Internal Team
- **Lead Developer**: Sarah Chen (sarah@webflowstudios.dev)
- **DevOps Lead**: James Martinez (james@webflowstudios.dev)
- **Security Lead**: Aisha Kumar (aisha@webflowstudios.dev)
- **Product Manager**: Marcus Rodriguez (marcus@webflowstudios.dev)

### External Support
- **Supabase**: support@supabase.com
- **Vercel**: support@vercel.com
- **Mapbox**: support@mapbox.com

### Emergency Contacts
- **24/7 On-Call**: +1-555-0123
- **Security Hotline**: +1-555-0124
- **Legal**: legal@newyorkminutenyc.com

---

**Last Updated**: December 2024  
**Next Review**: January 2025  
**Document Owner**: WebFlow Studios Team
