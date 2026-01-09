# 🔐 Vercel Environment Variables Setup

## ⚡ Quick Setup

Copy and paste these to **Vercel Dashboard → Settings → Environment Variables**

---

## 🔴 REQUIRED - App Won't Work Without These

### 1. Database (Neon PostgreSQL)
```
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```
Get from: https://console.neon.tech → Your Project → Connection Details

### 2. Cache (Upstash Redis)
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```
Get from: https://console.upstash.com → Your Database → REST API

### 3. Token Scanning (Moralis)
```
MORALIS_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Get from: https://admin.moralis.io → Web3 APIs → API Key

### 4. DEX Aggregator (1inch)
```
ONEINCH_API_KEY=your-1inch-api-key
NEXT_PUBLIC_ONEINCH_API_URL=https://api.1inch.dev
```
Get from: https://portal.1inch.dev → Create API Key

### 5. Gas Sponsorship - Pimlico (Primary)
```
PIMLICO_API_KEY=pim_xxx
NEXT_PUBLIC_PIMLICO_BASE_URL=https://api.pimlico.io/v2/base/rpc?apikey=YOUR_KEY
```
Get from: https://dashboard.pimlico.io → API Keys

**⚠️ IMPORTANT**: Replace `YOUR_KEY` in URL with actual API key!

Example:
```
PIMLICO_API_KEY=pim_abc123
NEXT_PUBLIC_PIMLICO_BASE_URL=https://api.pimlico.io/v2/base/rpc?apikey=pim_abc123
```

### 6. Gas Sponsorship - Coinbase CDP (Fallback)
```
NEXT_PUBLIC_CDP_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_CDP_KEY
```
Get from: https://portal.cdp.coinbase.com → API Keys

---

## 🟡 RECOMMENDED - Better Performance

### 7. RPC Provider (Alchemy)
```
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
```
Get from: https://dashboard.alchemy.com → Apps → API Key

### 8. Wallet Connection (WalletConnect/Reown)
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
```
Get from: https://cloud.reown.com → Projects → Project ID
(Already has default, but get your own for production)

### 9. Risk Scoring (GoPlus)
```
GOPLUS_API_KEY=your-goplus-key
```
Get from: https://gopluslabs.io → API → Get Key

---

## 🟢 OPTIONAL - Enhanced Features

### 10. Transaction Simulation (Tenderly)
```
TENDERLY_API_KEY=your-tenderly-key
TENDERLY_USERNAME=your-username
TENDERLY_PROJECT=your-project
```
Get from: https://dashboard.tenderly.co → Settings → API

### 11. Bot Protection (Turnstile)
```
TURNSTILE_SECRET_KEY=0x4AAA...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
```
Get from: https://dash.cloudflare.com → Turnstile → Add Site

### 12. Analytics (PostHog)
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
Get from: https://app.posthog.com → Settings → Project API Key

### 13. DEX Aggregator Backup (0x)
```
ZEROX_API_KEY=your-0x-key
```
Get from: https://0x.org/docs/introduction/getting-started

### 14. Solana Support (Helius)
```
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-key
```
Get from: https://dev.helius.xyz → API Keys

---

## 📋 Complete Copy-Paste Template

```env
# === REQUIRED ===
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
MORALIS_API_KEY=
ONEINCH_API_KEY=
NEXT_PUBLIC_ONEINCH_API_URL=https://api.1inch.dev
PIMLICO_API_KEY=
NEXT_PUBLIC_PIMLICO_BASE_URL=
NEXT_PUBLIC_CDP_PAYMASTER_URL=

# === RECOMMENDED ===
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=69915bbd15f146b792917c4f1a657139
GOPLUS_API_KEY=

# === OPTIONAL ===
TENDERLY_API_KEY=
TENDERLY_USERNAME=
TENDERLY_PROJECT=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
ZEROX_API_KEY=
NEXT_PUBLIC_HELIUS_API_KEY=

# === APP CONFIG (defaults work) ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://vortexbase.vercel.app
NEXT_PUBLIC_APP_NAME=Vortex Protocol
```

---

## ✅ Verification Checklist

After setting env vars, verify each service:

| Service | Test URL | Expected |
|---------|----------|----------|
| Database | `/api/v1/scan` | No DB error |
| Redis | `/api/v1/scan` | Faster 2nd request |
| Moralis | `/api/v1/scan?address=0x...` | Returns tokens |
| 1inch | Consolidate page | Shows routes |
| Pimlico | Execute swap | Gasless works |
| Alchemy | Scan page | Native balances |

---

## 🚨 Common Errors & Fixes

### "Pimlico API error"
- Check `NEXT_PUBLIC_PIMLICO_BASE_URL` format
- Must include `?apikey=YOUR_KEY` at end

### "Moralis API error"
- Verify `MORALIS_API_KEY` is correct
- Check Moralis dashboard for rate limits

### "Database connection failed"
- Verify `DATABASE_URL` format
- Must include `?sslmode=require` for Neon

### "Redis timeout"
- Check both `UPSTASH_REDIS_REST_URL` and `TOKEN`
- Upstash tokens expire - regenerate if old

---

## 🔄 After Adding Variables

1. Go to **Vercel Dashboard** → **Deployments**
2. Click **Redeploy** → **Redeploy with existing Build Cache** = OFF
3. Wait for build to complete
4. Test: https://vortexbase.vercel.app/scan

