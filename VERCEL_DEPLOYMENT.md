# 🚀 VERCEL DEPLOYMENT GUIDE - VORTEX PROTOCOL

## BƯỚC 1: KÉT NỐI GITHUB REPO

1. Truy cập: https://vercel.com/derexeths-projects
2. Click **"Add New..."** → **"Project"**
3. Chọn **"Import Git Repository"**
4. Tìm repo: `2049foto/Vortex-`
5. Click **"Import"**

---

## BƯỚC 2: CONFIGURE PROJECT

### Framework Preset
- Chọn: **Next.js**
- Root Directory: `./` (mặc định)
- Build Command: `bun run build`
- Output Directory: `.next` (mặc định)
- Install Command: `bun install`

### Node.js Version
- Trong **Project Settings** → **General** → **Node.js Version**
- Chọn: **20.x** (Vercel hỗ trợ Bun qua Node.js 20+)

---

## BƯỚC 3: ENVIRONMENT VARIABLES

### 🔴 CRITICAL (Bắt buộc để app chạy)

```env
# Database
DATABASE_URL=postgresql://[USERNAME]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require

# Cache & Rate Limiting
UPSTASH_REDIS_REST_URL=https://[YOUR-REGION].upstash.io
UPSTASH_REDIS_REST_TOKEN=[YOUR-TOKEN]

# Security
JWT_SECRET=[GENERATE-32-CHAR-SECRET]
TURNSTILE_SECRET_KEY=[YOUR-CLOUDFLARE-TURNSTILE-KEY]

# Web3 Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=[YOUR-PROJECT-ID]
```

### 🟡 IMPORTANT (Cần cho features chính)

```env
# RPC Endpoints
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com

# Account Abstraction
PIMLICO_API_KEY=[YOUR-PIMLICO-KEY]
NEXT_PUBLIC_PIMLICO_BASE_URL=https://api.pimlico.io/v2/base/rpc?apikey=[YOUR-KEY]
NEXT_PUBLIC_CDP_PAYMASTER_URL=[YOUR-COINBASE-PAYMASTER-URL]

# Data APIs
MORALIS_API_KEY=[YOUR-MORALIS-KEY]
NEXT_PUBLIC_MORALIS_API_URL=https://deep-index.moralis.io/api/v2.2

# Token Security
GOPLUS_API_KEY=[YOUR-GOPLUS-KEY]
GOPLUS_API_URL=https://api.gopluslabs.io
```

### 🟢 OPTIONAL (Có thể thêm sau)

```env
# Simulation
TENDERLY_API_KEY=[YOUR-KEY]
TENDERLY_USERNAME=[YOUR-USERNAME]
TENDERLY_PROJECT=[YOUR-PROJECT]

# Swap Aggregators
ONEINCH_API_KEY=[YOUR-KEY]
NEXT_PUBLIC_ONEINCH_API_URL=https://api.1inch.dev

# Monitoring
SENTRY_DSN=[YOUR-SENTRY-DSN]
NEXT_PUBLIC_POSTHOG_KEY=[YOUR-KEY]
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Farcaster
FARCASTER_API_URL=https://api.warpcast.com
FARCASTER_BOT_TOKEN=[YOUR-TOKEN]
```

### 🌐 PUBLIC URLs (Auto-set sau khi deploy lần đầu)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://[YOUR-VERCEL-DOMAIN].vercel.app
NEXT_PUBLIC_API_URL=https://[YOUR-BACKEND-API].fly.dev
```

---

## BƯỚC 4: DEPLOY

1. Click **"Deploy"**
2. Đợi build (~2-3 phút)
3. Sau khi deploy xong, copy domain từ Vercel
4. Quay lại **Settings** → **Environment Variables**
5. Update `NEXT_PUBLIC_APP_URL` với domain vừa được cấp

---

## BƯỚC 5: VERIFY DEPLOYMENT

### Check Frontend
- URL: https://[your-domain].vercel.app
- Test: Connect wallet, scan một address

### Check API (nếu có)
- Health: https://[your-domain].vercel.app/api/health

---

## 🔧 TROUBLESHOOTING

### Build Failed?
```bash
# Check build logs trong Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Missing dependencies
```

### Fix: Add Build Command Override
```
bun install && bun run build
```

### Runtime Error?
- Check **Functions** tab trong Vercel
- View logs để debug
- Verify tất cả `NEXT_PUBLIC_*` variables

---

## 📊 POST-DEPLOYMENT CHECKLIST

- [ ] Frontend accessible
- [ ] Wallet connection works
- [ ] Environment variables set
- [ ] Custom domain (optional)
- [ ] Analytics enabled (Vercel Analytics)
- [ ] Update GitHub README với live URL

---

## 🎯 PERFORMANCE OPTIMIZATION

### Trong Vercel Dashboard:

1. **Speed Insights**: Enable trong Project Settings
2. **Analytics**: Enable để track visitors
3. **Edge Network**: Auto-enabled (global CDN)
4. **Caching**: Next.js auto-handles

---

## 🔐 SECURITY BEST PRACTICES

### Sau khi deploy:

1. **Add Production Allowlist** cho Turnstile:
   - https://dash.cloudflare.com
   - Add Vercel domain vào allowlist

2. **Update CORS** nếu backend riêng:
   ```typescript
   // Backend: cho phép Vercel domain
   origin: process.env.NEXT_PUBLIC_APP_URL
   ```

3. **Regenerate JWT_SECRET** cho production:
   ```bash
   openssl rand -base64 32
   ```

---

**Ready to deploy!** 🚀

