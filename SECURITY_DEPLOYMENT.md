# StorePilot Security Deployment Guide

This document outlines the security configuration steps required for production deployment.

## 1. Environment Variables Required

### Essential Secrets (must be set in Vercel)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER expose to client

# Encryption (must be exactly 32 bytes / 64 hex chars)
ENCRYPTION_KEY=your-64-character-hex-key

# Optional but recommended
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
INNGEST_SIGNING_KEY=signkey-xxx
INNGEST_EVENT_KEY=your-event-key
TWILIO_AUTH_TOKEN=your-twilio-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-secret
```

## 2. Supabase Database Security

### Enable Row Level Security (RLS)
All tables should have RLS enabled. The following policies are recommended:

```sql
-- Users can only access their own data
CREATE POLICY "Users can only view their own data" ON your_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own data" ON your_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own data" ON your_table
  FOR UPDATE USING (auth.uid() = user_id);
```

### Network Restrictions
In Supabase Dashboard → Settings → Database:
- ✅ Enable "Require SSL" 
- Enable "Connection Pooling"
- Consider restricting IP addresses to Vercel's CIDR ranges only

### API Keys
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose in client code
- `SUPABASE_SERVICE_ROLE_KEY` - NEVER expose, only use server-side

## 3. Vercel Deployment Security

### Environment Variables
Set all secrets in Vercel Dashboard → Settings → Environment Variables:
- Add all production values
- Use "Production" scope only
- Mark sensitive values as "Sensitive"

### Security Headers (already configured)
The application includes:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Strict-Transport-Security` - Enforces HTTPS
- `Content-Security-Policy` - Restricts resource loading

### Edge Functions
- All API routes run as Edge functions by default on Vercel
- Ensure no sensitive data is logged to edge function console

## 4. Authentication Security

### Supabase Auth Settings
In Supabase Dashboard → Authentication → Providers → Email:
1. ✅ Enable "Confirm email" 
2. Set "Secure cookie" to enabled
3. Set session expiry (recommended: 7 days / 604800 seconds)

### Rate Limiting (requires Upstash Redis)
Set up rate limiting to prevent:
- Brute force login attempts (5 attempts/15min)
- Signup spam (3 attempts/hour)
- API abuse (100 requests/minute)

## 5. Webhook Security

### Shopify Webhook
- Verify HMAC signature using `SHOPIFY_WEBHOOK_SECRET`
- Configure in Shopify Admin → Settings → Notifications → Webhooks

### Stripe/Razorpay Webhook
- Verify webhook signatures using `RAZORPAY_WEBHOOK_SECRET`
- Log all webhook events for audit

### Twilio Webhook  
- Verify request signature using `TWILIO_AUTH_TOKEN`
- Rate limit incoming requests

## 6. Logging & Monitoring

### Application Logging
The application includes structured security logging for:
- Authentication attempts (login, signup, logout, password reset)
- API errors
- Rate limit violations
- Suspicious traffic patterns

### Recommended Monitoring
1. **Vercel Analytics** - Monitor request patterns
2. **Supabase Logs** - Database query logs
3. **External logging** - Consider integrating with:
   - Sentry (error tracking)
   - Datadog (infrastructure monitoring)
   - Custom logging service

### What to Monitor
- Failed login attempts (potential brute force)
- Unusual API request patterns
- High error rates
- Webhook validation failures

## 7. API Key Security

### Key Rotation Schedule
- Rotate all API keys quarterly
- Rotate immediately if compromised
- Use different keys for development and production

### Key Storage
- Never commit keys to git
- Store in environment variables only
- Use Vercel Secrets for sensitive values

## 8. Checklist

Before production deployment, verify:

- [ ] All secrets configured in Vercel
- [ ] Supabase RLS enabled on all tables
- [ ] Email confirmation enabled
- [ ] Session timeout configured
- [ ] Webhook secrets set
- [ ] Rate limiting enabled (Upstash Redis)
- [ ] HTTPS enforced (automatic via Vercel)
- [ ] Security headers applied
- [ ] Logging configured
- [ ] No sensitive data in client-side code

## 9. Testing Security

### Manual Testing
1. Try accessing protected routes without authentication
2. Test rate limiting by making rapid requests
3. Verify webhook signature validation
4. Check that sensitive data isn't exposed in API responses

### Automated Scans
- Use OWASP ZAP or similar for vulnerability scanning
- Run browser DevTools to verify CSP headers
- Test in incognito mode to verify authentication flow