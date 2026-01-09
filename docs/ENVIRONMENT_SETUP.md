# Environment Variables Setup Guide

## Quick Start

1. Copy `.env.example` to `.env.local` (if exists) or create new `.env.local`
2. Run validation script: `bun run scripts/validate-env.ts`
3. Fix any missing required variables
4. Review warnings for optional but recommended variables

## Required Variables

These are **critical** - the app won't work without them:

### Database
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### APIs
```bash
MORALIS_API_KEY=your_moralis_key
PIMLICO_API_KEY=pim_your_key
ONEINCH_API_KEY=your_1inch_key
```

## Recommended Variables

These enhance functionality but have fallbacks:

### Cache (Redis)
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```
**Fallback:** Memory cache (not persistent)

### Security (Turnstile)
```bash
TURNSTILE_SECRET_KEY=your_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
```
**Fallback:** Fail-open mode (allows all requests)

### Account Abstraction (Fallback Paymaster)
```bash
NEXT_PUBLIC_CDP_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/...
```
**Fallback:** Only Pimlico paymaster available

## Optional Variables

These enable additional features:

### Solana Support
```bash
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
JUPITER_API_KEY=your_jupiter_key
```

### Security Analysis
```bash
GOPLUS_API_KEY=your_goplus_key
```

### Transaction Simulation
```bash
TENDERLY_API_KEY=your_tenderly_key
TENDERLY_USERNAME=your_username
TENDERLY_PROJECT=your_project
```

### Analytics
```bash
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Validation

Run the validation script to check your configuration:

```bash
bun run scripts/validate-env.ts
```

This will:
- ✅ Check all required variables
- ⚠️  Warn about missing optional variables
- ❌ Fail if required variables are missing

## Production Checklist

Before deploying to production:

- [ ] All required variables set
- [ ] Turnstile keys configured (for bot protection)
- [ ] Redis configured (for persistent caching)
- [ ] JWT_SECRET changed from default
- [ ] All API keys are production keys (not test keys)
- [ ] Analytics keys configured (PostHog, Sentry)
- [ ] Environment variables added to Vercel dashboard

## Security Notes

1. **Never commit `.env.local`** to git
2. **Use different keys** for development and production
3. **Rotate secrets** regularly
4. **Use Vercel Environment Variables** for production (not `.env.local`)

## Troubleshooting

### Issue: "Missing required variable"

**Solution:** Add the variable to `.env.local` or Vercel dashboard

### Issue: "Invalid format"

**Solution:** Check the variable format matches the expected pattern

### Issue: Validation passes but app doesn't work

**Solution:**
- Check if variable names match exactly (case-sensitive)
- Restart dev server after adding variables
- Check Vercel dashboard if deploying

---

**Last Updated:** January 9, 2026
