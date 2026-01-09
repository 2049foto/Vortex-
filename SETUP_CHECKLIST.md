# Vortex Protocol - Setup Checklist

Use this checklist to ensure your Vortex Protocol setup is complete and production-ready.

## Pre-Setup

- [ ] Node.js 20.x installed
- [ ] Bun 1.1+ installed (or use npm/yarn)
- [ ] Git repository cloned
- [ ] Dependencies installed (`bun install`)

## Environment Configuration

### Required Variables

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `MORALIS_API_KEY` - Token data API (required for scanning)
- [ ] `PIMLICO_API_KEY` - AA bundler (required for gasless)
- [ ] `ONEINCH_API_KEY` - DEX aggregator (required for swaps)

### Recommended Variables

- [ ] `UPSTASH_REDIS_REST_URL` - Redis cache URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis auth token
- [ ] `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
- [ ] `NEXT_PUBLIC_CDP_PAYMASTER_URL` - Coinbase paymaster (fallback)
- [ ] `JWT_SECRET` - Changed from default (security)

### Optional Variables (Enhanced Features)

- [ ] `GOPLUS_API_KEY` - Security analysis
- [ ] `NEXT_PUBLIC_HELIUS_API_KEY` - Solana support
- [ ] `JUPITER_API_KEY` - Solana DEX
- [ ] `TENDERLY_API_KEY` - Transaction simulation
- [ ] `TENDERLY_USERNAME` - Tenderly username
- [ ] `TENDERLY_PROJECT` - Tenderly project name
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - Product analytics
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

## Validation

- [ ] Run `bun run validate:env` - All required variables pass
- [ ] Review warnings for optional variables
- [ ] Fix any validation errors

## Database Setup

- [ ] Neon PostgreSQL database created
- [ ] Connection string added to `DATABASE_URL`
- [ ] Run migrations: `bun db:push`
- [ ] Verify tables created: `bun db:studio` (optional)

## Security Configuration

- [ ] Cloudflare Turnstile keys configured
- [ ] `JWT_SECRET` changed from default
- [ ] `NEXTAUTH_SECRET` changed from default
- [ ] `TURNSTILE_STRICT_MODE` set (optional, for production)

## API Keys Verification

- [ ] Moralis API key active and has quota
- [ ] Pimlico API key active
- [ ] 1inch API key active
- [ ] All optional API keys tested (if using)

## Testing

- [ ] Development server starts: `bun dev`
- [ ] Can connect wallet
- [ ] Can scan wallet (test endpoint)
- [ ] No console errors
- [ ] Turnstile widget shows (if configured)

## Production Deployment

### Vercel Setup

- [ ] Project connected to Vercel
- [ ] All environment variables added to Vercel dashboard
- [ ] Production build succeeds: `bun build`
- [ ] Production URL accessible
- [ ] Domain configured (if custom)

### Security Checklist

- [ ] All secrets in Vercel (not in code)
- [ ] `NODE_ENV=production` set
- [ ] `TURNSTILE_STRICT_MODE=true` (if using strict mode)
- [ ] HTTPS enabled
- [ ] CORS configured correctly

### Monitoring

- [ ] PostHog configured (optional)
- [ ] Sentry configured (optional)
- [ ] Error tracking working
- [ ] Analytics tracking working

## Post-Deployment

- [ ] Test production URL
- [ ] Test wallet connection
- [ ] Test scan endpoint
- [ ] Test swap endpoint (dry run)
- [ ] Monitor error logs
- [ ] Check API rate limits

## Documentation

- [ ] Read [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md)
- [ ] Read [API Keys Setup Guide](./docs/API_KEYS_SETUP.md)
- [ ] Read [Turnstile Setup Guide](./docs/TURNSTILE_SETUP.md)
- [ ] Review [Codebase Audit Report](./CODEBASE_AUDIT_REPORT.md)

## Troubleshooting

If something doesn't work:

1. **Check environment variables:**
   ```bash
   bun run validate:env
   ```

2. **Check logs:**
   - Development: Browser console + terminal
   - Production: Vercel logs + Sentry

3. **Verify API keys:**
   - Check keys are active in provider dashboards
   - Verify rate limits not exceeded
   - Test keys with curl/Postman

4. **Database issues:**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible
   - Run migrations: `bun db:push`

5. **Build issues:**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && bun install`
   - Check TypeScript errors: `bun run type-check`

## Quick Commands Reference

```bash
# Validate environment
bun run validate:env

# Database
bun db:push          # Push schema to database
bun db:studio        # Open Drizzle Studio
bun db:generate      # Generate migrations

# Development
bun dev              # Start dev server
bun build            # Build for production
bun start            # Start production server

# Testing
bun test:e2e         # Run E2E tests
bun test:performance # Run performance tests
```

---

**Last Updated:** January 9, 2026
