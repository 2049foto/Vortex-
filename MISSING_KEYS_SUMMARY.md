# Missing API Keys Summary

**Date:** January 9, 2026  
**Status:** ✅ All required keys configured | ⚠️ 8 optional keys need setup

---

## ✅ Required Keys - All Configured!

Tất cả các keys **bắt buộc** đã được cấu hình:

- ✅ `DATABASE_URL` - Neon PostgreSQL
- ✅ `MORALIS_API_KEY` - Token data API
- ✅ `PIMLICO_API_KEY` - AA bundler
- ✅ `ONEINCH_API_KEY` - DEX aggregator
- ✅ `UPSTASH_REDIS_REST_URL` - Redis cache
- ✅ `UPSTASH_REDIS_REST_TOKEN` - Redis auth
- ✅ `NEXT_PUBLIC_CDP_PAYMASTER_URL` - Coinbase paymaster
- ✅ `JWT_SECRET` - Session encryption
- ✅ `NEXT_PUBLIC_POSTHOG_KEY` - Analytics
- ✅ `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

**App sẽ hoạt động bình thường với các keys này!**

---

## ⚠️ Optional Keys - Cần Setup (8 keys)

Các keys này là **optional** nhưng sẽ enhance functionality:

### 1. Cloudflare Turnstile (Bot Protection) - **RECOMMENDED**

**Current:** Using placeholder values  
**Impact:** Bot protection disabled (fail-open mode)  
**Priority:** 🔴 **HIGH** (for production)

**Keys needed:**
```bash
TURNSTILE_SECRET_KEY=your-turnstile-secret-key  # ⚠️ Placeholder
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key  # ⚠️ Placeholder
```

**How to get:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile**
3. Click **Add Site**
4. Domain: `vortexbase.vercel.app`
5. Copy **Site Key** and **Secret Key**

**Free Tier:** 1M verifications/month  
**Guide:** See `docs/TURNSTILE_SETUP.md`

---

### 2. GoPlus Security API - **RECOMMENDED**

**Current:** Using placeholder value  
**Impact:** Risk scoring may be less accurate  
**Priority:** 🟡 **MEDIUM**

**Key needed:**
```bash
GOPLUS_API_KEY=your-goplus-api-key  # ⚠️ Placeholder
```

**How to get:**
1. Go to [GoPlus Labs](https://gopluslabs.io/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

**Free Tier:** Unlimited  
**Guide:** See `docs/API_KEYS_SETUP.md`

---

### 3. Helius (Solana Support) - **OPTIONAL**

**Current:** Using placeholder value  
**Impact:** Solana token scanning disabled  
**Priority:** 🟢 **LOW** (only if you need Solana)

**Key needed:**
```bash
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-api-key  # ⚠️ Placeholder
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=your-helius-api-key
```

**How to get:**
1. Go to [Helius.dev](https://www.helius.dev/)
2. Sign up / Login
3. Dashboard → API Keys
4. Copy **API Key**

**Free Tier:** Limited  
**Guide:** See `docs/API_KEYS_SETUP.md`

---

### 4. Jupiter (Solana DEX) - **OPTIONAL**

**Current:** Using placeholder value  
**Impact:** Solana swaps disabled  
**Priority:** 🟢 **LOW** (only if you need Solana swaps)

**Key needed:**
```bash
JUPITER_API_KEY=your-jupiter-key  # ⚠️ Placeholder
```

**Note:** Jupiter API can work without key, but key gives better rate limits.

**How to get:**
1. Go to [Jupiter API](https://station.jup.ag/docs/apis/swap-api)
2. Request API key (optional)
3. Or use without key (limited)

**Free Tier:** Unlimited (no key needed)  
**Guide:** See `docs/API_KEYS_SETUP.md`

---

### 5. Tenderly (Transaction Simulation) - **OPTIONAL**

**Current:** Using placeholder values  
**Impact:** Transaction simulation disabled  
**Priority:** 🟡 **MEDIUM** (for better security)

**Keys needed:**
```bash
TENDERLY_API_KEY=your-tenderly-api-key  # ⚠️ Placeholder
TENDERLY_USERNAME=your-tenderly-username  # ⚠️ Placeholder
TENDERLY_PROJECT=your-tenderly-project  # ⚠️ Placeholder
```

**How to get:**
1. Go to [Tenderly.co](https://tenderly.co/)
2. Sign up / Login
3. Create a project
4. Settings → API Keys
5. Copy **API Key**, **Username**, and **Project Name**

**Free Tier:** Limited  
**Guide:** See `docs/API_KEYS_SETUP.md`

---

## Priority Recommendations

### For Production (Must Have)

1. **Cloudflare Turnstile** 🔴
   - Bot protection is critical for production
   - Free tier: 1M/month (plenty for most apps)
   - Setup time: 5 minutes

### For Better Features (Should Have)

2. **GoPlus Security** 🟡
   - Improves risk scoring accuracy
   - Free tier: Unlimited
   - Setup time: 5 minutes

3. **Tenderly** 🟡
   - Better transaction simulation
   - Free tier: Limited
   - Setup time: 10 minutes

### For Solana Support (Nice to Have)

4. **Helius** 🟢
   - Only if you need Solana scanning
   - Free tier: Limited
   - Setup time: 5 minutes

5. **Jupiter** 🟢
   - Only if you need Solana swaps
   - Can work without key
   - Setup time: 2 minutes

---

## Quick Setup Commands

After getting keys, update `.env.local`:

```bash
# Turnstile (HIGH PRIORITY)
TURNSTILE_SECRET_KEY=your_actual_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_actual_site_key

# GoPlus (MEDIUM PRIORITY)
GOPLUS_API_KEY=your_actual_goplus_key

# Tenderly (MEDIUM PRIORITY)
TENDERLY_API_KEY=your_actual_tenderly_key
TENDERLY_USERNAME=your_actual_username
TENDERLY_PROJECT=your_actual_project

# Solana (LOW PRIORITY - only if needed)
NEXT_PUBLIC_HELIUS_API_KEY=your_actual_helius_key
JUPITER_API_KEY=your_actual_jupiter_key
```

Then validate:
```bash
bun run validate:env
```

---

## Current Status

```
✅ Required: 10/10 (100%)
⚠️  Optional: 0/8 (0%)
📊 Total: 10/18 (56%)
```

**App Status:** ✅ **Fully Functional**  
**Production Ready:** ⚠️ **Needs Turnstile for bot protection**

---

## Next Steps

1. **Immediate (Production):**
   - [ ] Get Turnstile keys from Cloudflare
   - [ ] Add to `.env.local`
   - [ ] Test in development
   - [ ] Add to Vercel production environment

2. **Soon (Better Features):**
   - [ ] Get GoPlus API key
   - [ ] Get Tenderly credentials
   - [ ] Test risk scoring improvements

3. **Later (If Needed):**
   - [ ] Get Helius key (if using Solana)
   - [ ] Get Jupiter key (if using Solana swaps)

---

## Validation

Run validation after adding keys:

```bash
bun run validate:env
```

Expected output after adding all keys:
```
✅ PASSED: 18/18
⚠️  WARNINGS: 0
```

---

**Last Updated:** January 9, 2026
