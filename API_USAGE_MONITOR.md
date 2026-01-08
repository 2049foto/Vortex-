# 📊 VORTEX PROTOCOL - API USAGE & LIMITS MONITORING

## 🎯 TỔNG QUAN

Tài liệu này theo dõi tất cả API credits, usage limits, và ước tính thời gian đủ dùng.

**Cập nhật lần cuối:** 2026-01-07  
**Status:** ✅ Tất cả services đang ở FREE tier

---

## 📈 FREE TIER LIMITS & USAGE

### 🔴 **CRITICAL SERVICES** (Core functionality)

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **Moralis API** | ✅ Free | ~333 calls/day | **10,000 calls/month** | 0/10,000 | 🟢 | https://admin.moralis.io/settings/api-keys |
| **QuickNode Base** | ✅ Free | **50,000 req/day** | ~1.5M/month | 0/50,000 | 🟢 | https://dashboard.quicknode.com/ |
| **QuickNode Solana** | ✅ Free | **50,000 req/day** | ~1.5M/month | 0/50,000 | 🟢 | https://dashboard.quicknode.com/ |
| **Alchemy** | ✅ Free | ~1M CU/day | **30M CU/month** | 0/30M | 🟢 | https://dashboard.alchemy.com/ |
| **Infura** | ✅ Free | **100,000 req/day** | ~3M/month | 0/100,000 | 🟢 | https://app.infura.io/dashboard |
| **Upstash Redis** | ✅ Free | **10,000 commands/day** | ~300K/month | 0/10,000 | 🟢 | https://console.upstash.com/ |
| **Neon PostgreSQL** | ✅ Free | Unlimited queries | **20GB storage** | 0/20GB | 🟢 | https://console.neon.tech/ |

### 🟡 **DEX & SWAP SERVICES** (Trading functionality)

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **1inch API** | ✅ Free | Unlimited* | Unlimited* | 0 | 🟢 | https://portal.1inch.dev/ |
| **0x Protocol** | ✅ Free | Unlimited* | Unlimited* | 0 | 🟢 | https://0x.org/ |
| **Curve API** | ✅ Free | Public API | No auth needed | 0 | 🟢 | https://curve.fi/api |
| **Balancer API** | ✅ Free | Public API | No auth needed | 0 | 🟢 | https://api.balancer.fi |
| **Jupiter (Solana)** | ✅ Free | Unlimited* | Unlimited* | 0 | 🟢 | https://jup.ag/ |

*Free tier có rate limits nhưng không công bố cụ thể

### 🟢 **ACCOUNT ABSTRACTION** (Gas sponsorship)

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **Pimlico Paymaster** | ✅ Free | ~33 ops/day | **1,000 ops/month** | 0/1,000 | 🟢 | https://dashboard.pimlico.io/ |
| **Coinbase CDP** | ✅ Free | Base native | Unlimited (Base only) | 0 | 🟢 | https://portal.cdp.coinbase.com/ |

### 🔵 **SECURITY & ANALYSIS** (Risk scoring)

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **GoPlus Labs** | ✅ Free | **No rate limit** | Unlimited | 0 | 🟢 | https://gopluslabs.io/ |
| **Honeypot.is** | ✅ Free | No auth | Public API | 0 | 🟢 | https://honeypot.is/ |
| **DexScreener** | ✅ Free | Public API | No auth needed | 0 | 🟢 | https://dexscreener.com/ |
| **Tenderly** | ✅ Free | Limited | Check dashboard | 0 | 🟡 | https://dashboard.tenderly.co/ |

### 🟣 **SOLANA INFRASTRUCTURE**

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **Helius API** | ✅ Free | **Unlimited** | Unlimited | 0 | 🟢 | https://dashboard.helius.dev/ |

### ⚪ **MONITORING & ANALYTICS**

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **PostHog** | ✅ Free | ~33K events/day | **1M events/month** | 0/1M | 🟢 | https://app.posthog.com/ |
| **Sentry** | ✅ Free | ~166 errors/day | **5K errors/month** | 0/5K | 🟢 | https://sentry.io/ |
| **Cloudflare Turnstile** | ✅ Free | **Unlimited** | Unlimited | 0 | 🟢 | https://dash.cloudflare.com/ |

### 🟠 **WALLET & AUTH**

| Service | Free Tier | Daily Limit | Monthly Limit | Current Usage | Status | Dashboard |
|---------|-----------|-------------|---------------|---------------|--------|-----------|
| **WalletConnect** | ✅ Free | **Unlimited** | Unlimited | 0 | 🟢 | https://cloud.walletconnect.com/ |
| **Privy** | ✅ Free | ~3.3K tx/day | **100K tx/month** | 0/100K | 🟢 | https://dashboard.privy.io/ |

---

## 📊 ƯỚC TÍNH USAGE THEO SCENARIO

### Scenario 1: **Development/Testing** (Ít traffic)
- **Scans:** 50/day = 1,500/month
- **Swaps:** 10/day = 300/month
- **API calls:** ~500/day = 15,000/month

**Ước tính đủ dùng:**
- ✅ Moralis: 1,500/10,000 = **~6.5 tháng**
- ✅ QuickNode: 500/50,000 = **~100 ngày**
- ✅ Pimlico: 300/1,000 = **~3 tháng**
- ✅ Upstash: 1,000/10,000 = **~10 ngày** (cần monitor)

### Scenario 2: **Moderate Traffic** (MVP launch)
- **Scans:** 200/day = 6,000/month
- **Swaps:** 50/day = 1,500/month
- **API calls:** ~2,000/day = 60,000/month

**Ước tính đủ dùng:**
- ⚠️ Moralis: 6,000/10,000 = **~1.6 tháng** (cần upgrade)
- ✅ QuickNode: 2,000/50,000 = **~25 ngày**
- ⚠️ Pimlico: 1,500/1,000 = **~0.6 tháng** (cần upgrade)
- ⚠️ Upstash: 5,000/10,000 = **~2 ngày** (cần upgrade)

### Scenario 3: **High Traffic** (Product-market fit)
- **Scans:** 1,000/day = 30,000/month
- **Swaps:** 200/day = 6,000/month
- **API calls:** ~10,000/day = 300,000/month

**Ước tính đủ dùng:**
- ❌ Moralis: 30,000/10,000 = **~0.3 tháng** (cần upgrade)
- ✅ QuickNode: 10,000/50,000 = **~5 ngày**
- ❌ Pimlico: 6,000/1,000 = **~0.15 tháng** (cần upgrade)
- ❌ Upstash: 20,000/10,000 = **~0.5 ngày** (cần upgrade)

---

## 🚨 ALERTS & THRESHOLDS

### Critical Alerts (cần action ngay)

**Cần setup monitoring khi đạt:**

1. **Moralis API: 8,000/10,000** (80%)
   - Action: Upgrade hoặc thêm Alchemy fallback
   
2. **Pimlico: 800/1,000** (80%)
   - Action: Dùng Coinbase CDP fallback (Base only)
   
3. **Upstash Redis: 8,000/10,000** (80%)
   - Action: Optimize cache strategy hoặc upgrade
   
4. **QuickNode: 40,000/50,000** (80%)
   - Action: Switch sang Alchemy hoặc Infura

### Warning Alerts (monitor closely)

1. **PostHog: 800K/1M** (80%)
2. **Sentry: 4K/5K** (80%)
3. **Neon DB: 16GB/20GB** (80%)

---

## 🔧 CÁCH MONITOR USAGE

### 1. **Manual Check** (Mỗi tuần)

Check từng dashboard:
- Moralis: https://admin.moralis.io/settings/api-keys
- QuickNode: https://dashboard.quicknode.com/
- Pimlico: https://dashboard.pimlico.io/
- Upstash: https://console.upstash.com/

### 2. **Automated Monitoring** (Recommended)

Thêm vào code:

```typescript
// src/utils/usageMonitor.ts
export async function checkUsageLimits() {
  // Fetch từ các API dashboards
  // Log vào PostHog/Sentry
  // Send alert nếu > 80%
}
```

### 3. **Vercel Analytics** (Built-in)

- Vercel dashboard tự track traffic
- Monitor API route calls

---

## 💰 UPGRADE COSTS (Khi cần)

| Service | Free Tier | Paid Tier | Cost |
|---------|-----------|-----------|------|
| **Moralis** | 10K/month | Pro: 500K/month | $49/month |
| **Pimlico** | 1K/month | Growth: 100K/month | $99/month |
| **Upstash** | 10K/day | Pay-as-you-go | $0.20/10K |
| **QuickNode** | 50K/day | Growth: 1M/month | $49/month |
| **Neon** | 20GB | Pro: 100GB | $19/month |

**Total upgrade cost:** ~$216/month (nếu upgrade tất cả)

---

## ✅ RECOMMENDATIONS

### Short-term (0-3 months)
1. ✅ **Monitor Upstash Redis** - Có thể hết quota nhanh
2. ✅ **Setup Pimlico + Coinbase dual** - Đã có fallback
3. ✅ **Cache aggressively** - Giảm API calls

### Medium-term (3-6 months)
1. ⚠️ **Upgrade Moralis** - Nếu traffic tăng
2. ⚠️ **Upgrade Pimlico** - Nếu consolidation nhiều
3. ✅ **Add more RPC fallbacks** - Đã có (QuickNode → Alchemy → Infura → Public)

### Long-term (6+ months)
1. 💰 **Evaluate paid tiers** - Dựa trên revenue
2. 🔄 **Optimize API usage** - Batch requests, better caching
3. 📊 **Custom infrastructure** - Nếu scale lớn

---

## 🎯 CURRENT STATUS SUMMARY

**✅ GOOD (Unlimited hoặc rất cao):**
- Helius (Solana)
- Cloudflare Turnstile
- WalletConnect
- GoPlus Labs
- All DEX APIs (1inch, 0x, Curve, Balancer, Jupiter)
- Coinbase CDP (Base only)

**🟡 MONITOR (Có thể hết trong 1-3 tháng):**
- Moralis (10K/month)
- Pimlico (1K/month)
- Upstash Redis (10K/day)

**🟢 SAFE (Đủ dùng lâu dài):**
- QuickNode (50K/day)
- Alchemy (30M CU/month)
- PostHog (1M events/month)
- Sentry (5K errors/month)

---

## 📞 ACTION ITEMS

1. [ ] Setup weekly usage check reminder
2. [ ] Add usage monitoring to PostHog
3. [ ] Create alerts khi đạt 80% quota
4. [ ] Document upgrade process khi cần
5. [ ] Optimize Redis cache để giảm commands

---

**Last Updated:** 2026-01-07  
**Next Review:** 2026-01-14 (Weekly)

