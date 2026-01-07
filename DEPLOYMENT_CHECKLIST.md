# ✅ VORTEX PROTOCOL - DEPLOYMENT CHECKLIST

## 📍 BẠN ĐANG Ở ĐÂY

Tất cả code đã push lên GitHub: https://github.com/2049foto/Vortex-

**Bước tiếp theo:** Deploy lên Vercel!

---

## 🎯 HƯỚNG DẪN CHO BẠN

### OPTION 1: ⚡ DEPLOY NHANH (5 phút)

Đọc file: **`QUICK_DEPLOY.md`**

Các bước cơ bản:
1. Mở Vercel: https://vercel.com/derexeths-projects
2. Import repo GitHub
3. Add environment variables (minimum 6 biến)
4. Click Deploy
5. Done!

### OPTION 2: 📚 DEPLOY CHI TIẾT (10 phút)

Đọc file: **`VERCEL_DEPLOYMENT.md`**

Hướng dẫn từng bước với:
- Screenshots
- Troubleshooting
- Performance optimization
- Security best practices

### OPTION 3: 📋 COPY ENV VARIABLES (1 phút)

Mở file: **`VERCEL_ENV_TEMPLATE.txt`**

Copy/paste tất cả environment variables vào Vercel dashboard!

---

## 🔑 CÁC API KEYS CẦN CÓ

### 🔴 BẮT BUỘC (Minimum để app chạy)

| Service | Free Tier | Link | Status |
|---------|-----------|------|--------|
| Neon PostgreSQL | ✅ 0.5GB | https://console.neon.tech/ | ⬜ |
| Upstash Redis | ✅ 10k/day | https://console.upstash.com/ | ⬜ |
| Cloudflare Turnstile | ✅ Unlimited | https://dash.cloudflare.com/ | ⬜ |
| WalletConnect | ✅ Unlimited | https://cloud.walletconnect.com/ | ⬜ |
| JWT Secret | Local gen | `node scripts/generate-jwt-secret.js` | ⬜ |

### 🟡 RECOMMENDED (Features đầy đủ)

| Service | Free Tier | Link | Status |
|---------|-----------|------|--------|
| Pimlico AA | ✅ 5k ops | https://dashboard.pimlico.io/ | ⬜ |
| Moralis API | ✅ 40k req | https://admin.moralis.io/ | ⬜ |
| GoPlus Labs | ✅ Limited | https://gopluslabs.io/ | ⬜ |
| 1inch API | ✅ Limited | https://portal.1inch.dev/ | ⬜ |

### 🟢 OPTIONAL (Monitoring)

| Service | Free Tier | Link | Status |
|---------|-----------|------|--------|
| Sentry | ✅ 5k events | https://sentry.io/ | ⬜ |
| PostHog | ✅ 1M events | https://posthog.com/ | ⬜ |
| Tenderly | ✅ 500 sims | https://dashboard.tenderly.co/ | ⬜ |

---

## 📝 DEPLOYMENT STEPS

### ✅ Pre-Deployment (Setup Services)

- [ ] Tạo Neon PostgreSQL database
- [ ] Tạo Upstash Redis instance
- [ ] Setup Cloudflare Turnstile site
- [ ] Tạo WalletConnect project
- [ ] Generate JWT_SECRET: `node scripts/generate-jwt-secret.js`
- [ ] (Optional) Get Pimlico API key
- [ ] (Optional) Get Moralis API key

### ✅ Vercel Deployment

- [ ] Mở https://vercel.com/derexeths-projects
- [ ] Import GitHub repo: `2049foto/Vortex-`
- [ ] Configure framework: Next.js, Bun, Node 20.x
- [ ] Add environment variables (xem `VERCEL_ENV_TEMPLATE.txt`)
- [ ] Click "Deploy"
- [ ] Đợi build (~2-3 phút)
- [ ] Copy Vercel URL
- [ ] Update `NEXT_PUBLIC_APP_URL` trong env vars
- [ ] (Optional) Redeploy

### ✅ Post-Deployment

- [ ] Test frontend: https://your-project.vercel.app
- [ ] Test wallet connection
- [ ] Test scan functionality
- [ ] View grant metrics: `/grant-metrics`
- [ ] Enable Vercel Analytics
- [ ] (Optional) Add custom domain
- [ ] Update GitHub README với live URL

### ✅ Backend Deployment (Optional - Phase 2)

- [ ] Deploy API server lên Fly.io (xem `fly.toml`)
- [ ] Update `NEXT_PUBLIC_API_URL`
- [ ] Run database migrations
- [ ] Test API endpoints

---

## 🚨 COMMON ISSUES & FIXES

### Build Failed

**Error: `Module not found: Can't resolve...`**
```bash
Fix: Vercel dùng Bun, check package.json có đầy đủ dependencies
```

**Error: `Environment variable not found`**
```bash
Fix: Add biến vào Vercel Settings → Environment Variables
Target: Production (và Preview nếu cần)
```

### Runtime Errors

**500 Error on page load**
```bash
Fix: Check Vercel Functions logs
Common: Missing DATABASE_URL hoặc REDIS_URL
```

**Wallet connection not working**
```bash
Fix: Verify NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
Check console for errors
```

**API calls failing**
```bash
Fix: Check CORS settings
Verify all NEXT_PUBLIC_* variables set correctly
```

---

## 📊 MONITORING & ANALYTICS

### Vercel Dashboard

1. **Deployments**: View build history
2. **Functions**: View API logs in real-time
3. **Analytics**: Track visitors (enable in Settings)
4. **Speed Insights**: Monitor performance

### External Monitoring (Recommended)

1. **Sentry**: Error tracking
   - Add `SENTRY_DSN` to env vars
   - View errors in https://sentry.io/

2. **PostHog**: Product analytics
   - Add `NEXT_PUBLIC_POSTHOG_KEY`
   - View analytics in https://posthog.com/

---

## 🎯 SUCCESS CRITERIA

### ✅ Frontend Live
- [ ] URL accessible
- [ ] Pages load correctly
- [ ] Wallet connection works
- [ ] No console errors

### ✅ Core Features Working
- [ ] Scan wallet returns results
- [ ] Token classification displays
- [ ] Grant metrics page loads
- [ ] Farcaster frame accessible

### ✅ Performance
- [ ] Page load < 3s
- [ ] Time to Interactive < 5s
- [ ] Lighthouse score > 90

### ✅ Security
- [ ] HTTPS enabled (auto by Vercel)
- [ ] Environment secrets not exposed
- [ ] Turnstile active on forms
- [ ] CSP headers configured

---

## 📚 DOCUMENTATION REFERENCE

| File | Purpose |
|------|---------|
| `QUICK_DEPLOY.md` | 5-minute deployment guide |
| `VERCEL_DEPLOYMENT.md` | Detailed deployment guide |
| `VERCEL_ENV_TEMPLATE.txt` | Copy-paste env variables |
| `README_PHASE1.md` | Full project setup |
| `PHASE1_COMPLETE.md` | Feature completion checklist |

---

## 🆘 NEED HELP?

1. **Build Issues**: Check Vercel deployment logs
2. **Runtime Issues**: Check Functions tab in Vercel
3. **API Issues**: Verify environment variables
4. **Code Issues**: Check GitHub repo

---

## 🎉 NEXT STEPS AFTER DEPLOYMENT

1. **Share on Social**
   - Twitter: "Just deployed Vortex Protocol on @base! 🌀"
   - Farcaster: Share frame link

2. **Apply for Base Grant**
   - URL: https://paragraph.xyz/@grants.base.eth/base-builders
   - Show grant metrics dashboard
   - Demo video của app

3. **Collect Feedback**
   - Share với community
   - Monitor analytics
   - Fix bugs nhanh

4. **Scale Up**
   - Add more monitoring
   - Optimize performance
   - Add features Phase 2

---

**🚀 Ready to deploy? Start with `QUICK_DEPLOY.md`!**

Total estimated time: **10-15 minutes** (với setup services)

Cost: **$0** (tất cả free tiers!)

