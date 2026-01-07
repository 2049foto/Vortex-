# ⚡ QUICK START - VERCEL DEPLOYMENT

## 🎯 MỤC TIÊU
Update tất cả environment variables lên Vercel để app hoạt động hoàn hảo.

---

## ✅ ĐÃ LÀM XONG

1. ✅ Backend logic đã implement trong Next.js API routes
2. ✅ File `VERCEL_ENV_VARS.txt` đã format sẵn (297 variables)
3. ✅ `NEXT_PUBLIC_APP_URL` đã fix thành `https://vortex-bice-two.vercel.app`
4. ✅ Tất cả buttons và navigation đã working
5. ✅ Wallet connection đã working

---

## 🚀 BƯỚC 1: VÀO VERCEL DASHBOARD

1. Mở: https://vercel.com/derexeths-projects
2. Click project: **Vortex-**
3. Vào **Settings** → **Environment Variables**

---

## 🚀 BƯỚC 2: UPDATE CRITICAL VARIABLES TRƯỚC

**Update ngay 7 biến quan trọng nhất:**

1. `NEXT_PUBLIC_APP_URL` = `https://vortex-bice-two.vercel.app` ⚠️ **QUAN TRỌNG NHẤT**
2. `DATABASE_URL` = (từ file env của bạn)
3. `UPSTASH_REDIS_REST_URL` = (từ file env)
4. `UPSTASH_REDIS_REST_TOKEN` = (từ file env)
5. `MORALIS_API_KEY` = (từ file env)
6. `PIMLICO_API_KEY` = (từ file env)
7. `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` = (từ file env)

**Cách thêm:**
- Click **Add New**
- Paste **Name** (ví dụ: `NEXT_PUBLIC_APP_URL`)
- Paste **Value** (ví dụ: `https://vortex-bice-two.vercel.app`)
- Chọn **Environment:** All (Production, Preview, Development)
- Click **Save**

---

## 🚀 BƯỚC 3: ADD TẤT CẢ VARIABLES CÒN LẠI

**File:** `VERCEL_ENV_VARS.txt` (297 variables)

**Cách làm nhanh:**
1. Mở file `VERCEL_ENV_VARS.txt`
2. Copy từng dòng (format: `KEY=value`)
3. Paste vào Vercel:
   - **Name:** Phần trước dấu `=`
   - **Value:** Phần sau dấu `=`
4. Repeat cho đến hết 297 variables

**Tip:** Có thể add 50 variables/lần để không bị timeout.

---

## 🚀 BƯỚC 4: REDEPLOY

Sau khi add xong tất cả variables:

1. Vào tab **Deployments**
2. Click **...** trên deployment mới nhất
3. Click **Redeploy**
4. Đợi deploy xong (2-3 phút)

---

## ✅ BƯỚC 5: VERIFY

Sau khi deploy xong, test:

1. ✅ Mở: https://vortex-bice-two.vercel.app
2. ✅ Click "Connect Wallet" → Modal xuất hiện
3. ✅ Click "Scan Wallet" → Navigate đến scan page
4. ✅ Check console → Không có WalletConnect URL warnings
5. ✅ Test scan API → Gọi `/api/v1/scan`

---

## 📋 CHECKLIST

- [ ] Update `NEXT_PUBLIC_APP_URL` = `https://vortex-bice-two.vercel.app`
- [ ] Update `DATABASE_URL`
- [ ] Update `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`
- [ ] Update `MORALIS_API_KEY`
- [ ] Update `PIMLICO_API_KEY`
- [ ] Update `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- [ ] Add tất cả 297 variables từ `VERCEL_ENV_VARS.txt`
- [ ] Redeploy project
- [ ] Test buttons và navigation
- [ ] Test wallet connection
- [ ] Test API calls

---

## 🆘 NẾU GẶP LỖI

### Lỗi: Variables không update
**Fix:** Redeploy sau khi add variables

### Lỗi: Vẫn thấy old URL
**Fix:** Clear cache, hard refresh (Ctrl+Shift+R)

### Lỗi: Quá nhiều variables
**Fix:** Add từng batch 50 variables, save, rồi tiếp tục

---

## 📝 FILES QUAN TRỌNG

- **VERCEL_ENV_VARS.txt** - 297 variables đã format sẵn
- **VERCEL_ENV_SETUP_GUIDE.md** - Hướng dẫn chi tiết
- **BACKEND_DEPLOYMENT_EXPLAINED.md** - Giải thích về backend

---

## ⏱️ THỜI GIAN ƯỚC TÍNH

- **Critical variables (7):** 2 phút
- **All variables (297):** 10-15 phút
- **Redeploy:** 2-3 phút
- **Testing:** 5 phút

**Total:** ~20-25 phút

---

## 🎉 SAU KHI XONG

App sẽ hoạt động hoàn hảo:
- ✅ Tất cả buttons working
- ✅ Wallet connection working
- ✅ APIs returning real data
- ✅ No console errors
- ✅ Ready for production!

---

**File:** `VERCEL_ENV_VARS.txt`  
**Total Variables:** 297  
**Status:** ✅ Ready to copy-paste

**Commit:** `a243f30`  
**GitHub:** https://github.com/2049foto/Vortex-  
**Vercel:** https://vortex-bice-two.vercel.app

