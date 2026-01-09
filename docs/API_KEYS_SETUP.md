# API Keys Setup Guide

This guide helps you obtain and configure all API keys needed for Vortex Protocol.

## Critical APIs (Required)

### 1. Moralis API
**Purpose:** Token data and wallet scanning  
**Free Tier:** 10K calls/month  
**Get Key:**
1. Go to [Moralis.io](https://moralis.io/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

```bash
MORALIS_API_KEY=your_moralis_key_here
```

### 2. Pimlico API
**Purpose:** Account Abstraction bundler and paymaster  
**Free Tier:** Limited, then paid  
**Get Key:**
1. Go to [Pimlico.io](https://pimlico.io/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key** (starts with `pim_`)

```bash
PIMLICO_API_KEY=pim_your_key_here
```

### 3. 1inch API
**Purpose:** DEX aggregation  
**Free Tier:** 1K calls/day  
**Get Key:**
1. Go to [1inch.dev](https://1inch.dev/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

```bash
ONEINCH_API_KEY=your_1inch_key_here
```

## Recommended APIs

### 4. Cloudflare Turnstile
**Purpose:** Bot protection  
**Free Tier:** 1M verifications/month  
**Get Keys:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile**
3. Add Site → Copy **Site Key** and **Secret Key**

```bash
TURNSTILE_SECRET_KEY=your_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
```

See [TURNSTILE_SETUP.md](./TURNSTILE_SETUP.md) for detailed setup.

### 5. Upstash Redis
**Purpose:** Caching (with memory fallback)  
**Free Tier:** 10K commands/day  
**Get Credentials:**
1. Go to [Upstash.com](https://upstash.com/)
2. Sign up / Login
3. Create Redis Database
4. Copy **REST URL** and **REST TOKEN**

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### 6. Coinbase CDP Paymaster
**Purpose:** Fallback paymaster for Base  
**Free Tier:** Testnet only, mainnet requires billing  
**Get URL:**
1. Go to [Coinbase Developer Portal](https://portal.cdp.coinbase.com/)
2. Create project
3. Enable Paymaster
4. Copy **Paymaster URL**

```bash
NEXT_PUBLIC_CDP_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/...
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key
```

## Optional APIs (Enhanced Features)

### 7. GoPlus Security
**Purpose:** Token security analysis  
**Free Tier:** Unlimited  
**Get Key:**
1. Go to [GoPlus Labs](https://gopluslabs.io/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

```bash
GOPLUS_API_KEY=your_goplus_key
```

### 8. Helius (Solana)
**Purpose:** Solana token scanning  
**Free Tier:** Limited  
**Get Key:**
1. Go to [Helius.dev](https://www.helius.dev/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

```bash
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=your_key
```

### 9. Jupiter (Solana DEX)
**Purpose:** Solana DEX aggregation  
**Free Tier:** Unlimited (no key required)  
**Note:** API key is optional, can use without key

```bash
JUPITER_API_KEY=your_jupiter_key  # Optional
```

### 10. Tenderly
**Purpose:** Transaction simulation  
**Free Tier:** Limited  
**Get Credentials:**
1. Go to [Tenderly.co](https://tenderly.co/)
2. Sign up / Login
3. Dashboard → Settings → API Keys
4. Copy **API Key**, **Username**, and **Project Name**

```bash
TENDERLY_API_KEY=your_tenderly_key
TENDERLY_USERNAME=your_username
TENDERLY_PROJECT=your_project_name
```

## Analytics APIs (Optional)

### 11. PostHog
**Purpose:** Product analytics  
**Free Tier:** 1M events/month  
**Get Key:**
1. Go to [PostHog.com](https://posthog.com/)
2. Sign up / Login
3. Project Settings → API Keys
4. Copy **Project API Key**

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 12. Sentry
**Purpose:** Error tracking  
**Free Tier:** 5K events/month  
**Get DSN:**
1. Go to [Sentry.io](https://sentry.io/)
2. Create project
3. Settings → Client Keys (DSN)
4. Copy **DSN**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your_dsn@sentry.io/project_id
```

## Rate Limit Summary

| API | Free Tier Limit | Current Usage | Risk |
|-----|----------------|---------------|------|
| Moralis | 10K/month | ~500-1000/month | ⚠️ Medium |
| 1inch | 1K/day | ~50-100/day | ⚠️ Medium |
| Pimlico | Limited | Varies | ⚠️ Medium |
| Turnstile | 1M/month | Low | ✅ Safe |
| GoPlus | Unlimited | Low | ✅ Safe |
| Helius | Limited | Low | ✅ Safe |
| Jupiter | Unlimited | Low | ✅ Safe |
| Tenderly | Limited | Low | ⚠️ Medium |

## Setup Checklist

- [ ] Moralis API key
- [ ] Pimlico API key
- [ ] 1inch API key
- [ ] Cloudflare Turnstile keys (recommended)
- [ ] Upstash Redis credentials (recommended)
- [ ] Coinbase CDP Paymaster URL (recommended)
- [ ] GoPlus API key (optional)
- [ ] Helius API key (optional - for Solana)
- [ ] Jupiter API key (optional - for Solana)
- [ ] Tenderly credentials (optional)
- [ ] PostHog key (optional)
- [ ] Sentry DSN (optional)

## Validation

After adding keys, run:

```bash
bun run validate:env
```

This will check:
- ✅ All required keys are set
- ⚠️  Warn about missing optional keys
- ❌ Fail if required keys are missing

## Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** (`.env.local` for dev, Vercel for production)
3. **Rotate keys regularly** (especially if exposed)
4. **Use different keys** for development and production
5. **Monitor usage** to avoid rate limits

---

**Last Updated:** January 9, 2026
