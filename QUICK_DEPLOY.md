# ⚡ QUICK DEPLOY - 5 PHÚT ĐẨY LÊN VERCEL

## 🎯 MỤC TIÊU
Deploy Vortex Protocol frontend lên Vercel trong 5 phút!

---

## 📋 CHECKLIST TRƯỚC KHI BẮT ĐẦU

Cần có sẵn:
- [ ] Neon PostgreSQL database (Free tier)
- [ ] Upstash Redis (Free tier)
- [ ] Cloudflare Turnstile site key
- [ ] WalletConnect Project ID

**Chưa có?** Xem phần "Setup Services" bên dưới ⬇️

---

## 🚀 5 BƯỚC DEPLOY

### BƯỚC 1: Kết nối GitHub (30s)

1. Mở: https://vercel.com/derexeths-projects
2. Click **"Add New..."** → **"Project"**
3. Chọn repo: **`2049foto/Vortex-`**
4. Click **"Import"**

### BƯỚC 2: Configure Framework (30s)

```
Framework Preset: Next.js
Root Directory: ./
Build Command: bun run build
Output Directory: .next
Install Command: bun install
Node.js Version: 20.x
```

Click **"Continue"**

### BƯỚC 3: Environment Variables (2 phút)

Copy các biến này vào Vercel:

#### 🔴 REQUIRED (Minimum để app chạy)

```env
DATABASE_URL=postgresql://[PASTE-YOUR-NEON-URL]
UPSTASH_REDIS_REST_URL=https://[PASTE-YOUR-REDIS-URL]
UPSTASH_REDIS_REST_TOKEN=[PASTE-YOUR-TOKEN]
JWT_SECRET=[GENERATE: openssl rand -base64 32]
TURNSTILE_SECRET_KEY=[YOUR-CLOUDFLARE-KEY]
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=[YOUR-PROJECT-ID]
```

#### 🟡 RECOMMENDED (Features đầy đủ)

```env
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth.llamarpc.com
PIMLICO_API_KEY=[YOUR-KEY]
MORALIS_API_KEY=[YOUR-KEY]
GOPLUS_API_KEY=[YOUR-KEY]
```

Click **"Add"** cho mỗi biến

### BƯỚC 4: Deploy! (2 phút)

1. Click **"Deploy"**
2. Đợi build (~2-3 phút)
3. ☕ Uống cà phê

### BƯỚC 5: Update App URL (30s)

1. Copy URL từ Vercel (vd: `your-project.vercel.app`)
2. Quay lại **Settings** → **Environment Variables**
3. Add:
```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```
4. Click **"Save"**
5. Redeploy (optional)

---

## ✅ DONE!

🎉 Frontend đã live tại: **https://your-project.vercel.app**

Test ngay:
- Connect wallet
- Scan một address
- View grant metrics: `/grant-metrics`

---

## 🛠️ SETUP SERVICES (Nếu chưa có)

### 1. Neon PostgreSQL (2 phút)

1. https://console.neon.tech/
2. Sign up/Login
3. **"Create Project"**
4. Copy **Connection String**
5. Paste vào `DATABASE_URL`

**Free tier**: 0.5 GB storage, đủ cho MVP!

### 2. Upstash Redis (2 phút)

1. https://console.upstash.com/
2. Sign up/Login
3. **"Create Database"**
4. Copy **REST URL** và **REST Token**
5. Paste vào Vercel

**Free tier**: 10k commands/day!

### 3. Cloudflare Turnstile (3 phút)

1. https://dash.cloudflare.com/
2. **Turnstile** → **"Add Site"**
3. Domain: `your-project.vercel.app` (hoặc `*` cho wildcard)
4. Mode: **Managed**
5. Copy **Secret Key**
6. Copy **Site Key** → paste vào frontend code

**Free tier**: Unlimited!

### 4. WalletConnect (2 phút)

1. https://cloud.walletconnect.com/
2. Sign up/Login
3. **"Create Project"**
4. Name: "Vortex Protocol"
5. Copy **Project ID**

**Free tier**: Unlimited connections!

### 5. Pimlico (Optional - 2 phút)

1. https://dashboard.pimlico.io/
2. Sign up
3. Create API key
4. Copy key

**Free tier**: 5k UserOps/month

### 6. Moralis (Optional - 2 phút)

1. https://admin.moralis.io/
2. Sign up
3. Copy **API Key**

**Free tier**: 40k requests/month

---

## 🔧 TROUBLESHOOTING

### Build Failed?

**Error: Missing dependencies**
```
Fix: Vercel auto-detects Bun. Nếu fail, thử:
Build Command: npm install && npm run build
```

**Error: Environment variables not found**
```
Fix: Check tất cả NEXT_PUBLIC_* variables đã add
```

### Runtime Error?

**Wallet connection not working**
```
Fix: Verify NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

**Database connection failed**
```
Fix: Check DATABASE_URL format:
postgresql://user:pass@host/db?sslmode=require
```

---

## 📊 POST-DEPLOYMENT

### Enable Vercel Analytics (Recommended)

1. Project Settings → **Analytics**
2. Click **"Enable"**
3. View real-time traffic!

### Add Custom Domain (Optional)

1. Project Settings → **Domains**
2. Add your domain
3. Update DNS records
4. Update `NEXT_PUBLIC_APP_URL`

### Monitor Performance

1. **Deployment** tab → View build logs
2. **Functions** tab → View API logs
3. **Analytics** → View traffic

---

## 🎯 NEXT STEPS

- [ ] Deploy backend API (Fly.io - xem `fly.toml`)
- [ ] Setup monitoring (Sentry, PostHog)
- [ ] Apply for Base Grant
- [ ] Share on Farcaster!

---

**Total Time: ~5-10 minutes** ⚡

**Cost: $0** (All free tiers) 💰

**Result: Production-ready app** ✨

---

Need help? Check `VERCEL_DEPLOYMENT.md` for detailed guide!

