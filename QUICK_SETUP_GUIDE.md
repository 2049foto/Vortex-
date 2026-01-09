# Quick Setup Guide - Missing Keys

Bạn đã có tất cả keys cần thiết! Đây là hướng dẫn nhanh để setup các keys còn thiếu.

## ⚡ Quick Start

### 1. Cloudflare Turnstile (5 phút) - **QUAN TRỌNG NHẤT**

**Tại sao:** Bot protection cho production  
**Free:** 1M verifications/month

**Các bước:**
1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Turnstile** (sidebar)
3. Click **Add Site**
4. Điền:
   - **Site Name:** Vortex Protocol
   - **Domain:** `vortexbase.vercel.app`
   - **Widget Mode:** Managed (recommended)
5. Copy **Site Key** và **Secret Key**
6. Update `.env.local`:
   ```bash
   TURNSTILE_SECRET_KEY=paste_secret_key_here
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=paste_site_key_here
   ```

**Xong!** Restart dev server và test.

---

### 2. GoPlus Security (3 phút) - **KHUYẾN NGHỊ**

**Tại sao:** Cải thiện độ chính xác risk scoring  
**Free:** Unlimited

**Các bước:**
1. Vào [GoPlus Labs](https://gopluslabs.io/)
2. Sign up / Login
3. Dashboard → **API Keys**
4. Copy **API Key**
5. Update `.env.local`:
   ```bash
   GOPLUS_API_KEY=paste_key_here
   ```

---

### 3. Tenderly (5 phút) - **KHUYẾN NGHỊ**

**Tại sao:** Transaction simulation tốt hơn  
**Free:** Limited

**Các bước:**
1. Vào [Tenderly.co](https://tenderly.co/)
2. Sign up / Login
3. Create new **Project**
4. Settings → **API Keys**
5. Copy:
   - **API Key**
   - **Username** (từ URL hoặc settings)
   - **Project Name** (tên project vừa tạo)
6. Update `.env.local`:
   ```bash
   TENDERLY_API_KEY=paste_api_key_here
   TENDERLY_USERNAME=paste_username_here
   TENDERLY_PROJECT=paste_project_name_here
   ```

---

### 4. Helius (Solana) - **CHỈ NẾU CẦN SOLANA**

**Tại sao:** Scan Solana tokens  
**Free:** Limited

**Các bước:**
1. Vào [Helius.dev](https://www.helius.dev/)
2. Sign up / Login
3. Dashboard → **API Keys**
4. Copy **API Key**
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_HELIUS_API_KEY=paste_key_here
   NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=paste_key_here
   ```

---

### 5. Jupiter (Solana DEX) - **CHỈ NẾU CẦN SOLANA SWAPS**

**Tại sao:** Solana DEX swaps  
**Free:** Unlimited (không cần key, nhưng có key tốt hơn)

**Note:** Có thể dùng không cần key, nhưng có key sẽ có rate limit tốt hơn.

**Các bước:**
1. Vào [Jupiter Station](https://station.jup.ag/)
2. Request API key (optional)
3. Hoặc để trống (sẽ dùng public API)

---

## ✅ Verify Setup

Sau khi thêm keys, chạy:

```bash
bun run validate:env
```

**Expected output:**
```
✅ PASSED: 18/18
⚠️  WARNINGS: 0
```

---

## 🚀 Production Deployment

Sau khi test xong trong development:

1. **Add keys to Vercel:**
   - Vào Vercel Dashboard
   - Project → Settings → Environment Variables
   - Add tất cả keys (copy từ `.env.local`)
   - Set cho **Production** environment

2. **Enable Strict Mode (optional):**
   ```bash
   TURNSTILE_STRICT_MODE=true
   ```
   - Chỉ enable khi đã test kỹ
   - Strict mode sẽ block requests nếu Turnstile fail

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## 📋 Checklist

- [ ] Turnstile keys added
- [ ] GoPlus key added (optional)
- [ ] Tenderly credentials added (optional)
- [ ] Helius key added (if using Solana)
- [ ] Jupiter key added (if using Solana)
- [ ] Validation passes: `bun run validate:env`
- [ ] Tested in development
- [ ] Added to Vercel production
- [ ] Production deployment successful

---

## 🆘 Troubleshooting

### Turnstile không hoạt động

**Check:**
- Keys đúng chưa? (không có spaces)
- Domain match chưa? (phải là `vortexbase.vercel.app`)
- Restart dev server chưa?

**Fix:**
```bash
# Check keys
echo $TURNSTILE_SECRET_KEY
echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY

# Restart
bun dev
```

### Validation vẫn báo warning

**Check:**
- Keys có chứa "your-" hoặc "placeholder" không?
- Keys có spaces ở đầu/cuối không?

**Fix:**
```bash
# Remove spaces
TURNSTILE_SECRET_KEY="your_key_here"  # No spaces around =
```

### API keys không work

**Check:**
- Keys active trong dashboard chưa?
- Rate limit chưa?
- Keys đúng format chưa?

**Fix:**
- Verify trong provider dashboard
- Check API usage/limits
- Test với curl/Postman

---

## 📚 More Help

- **Full Documentation:** `docs/README.md`
- **API Keys Guide:** `docs/API_KEYS_SETUP.md`
- **Turnstile Setup:** `docs/TURNSTILE_SETUP.md`
- **Environment Setup:** `docs/ENVIRONMENT_SETUP.md`

---

**Last Updated:** January 9, 2026
