# 🔧 FIX VERCEL URL MISMATCH

## ⚠️ CRITICAL ISSUE

**Problem:** `NEXT_PUBLIC_APP_URL` is set to `vortex-protocol.vercel.app` but actual URL is `vortex-bice-two.vercel.app`

**Impact:**
- WalletConnect metadata URL mismatch
- Frame URLs incorrect
- OG images broken
- API callbacks failing

## ✅ SOLUTION

### Step 1: Update Vercel Environment Variable

1. Go to Vercel Dashboard: https://vercel.com/derexeths-projects
2. Select your project: `Vortex-`
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_APP_URL`
5. Update value to: `https://vortex-bice-two.vercel.app`
6. Click **Save**
7. **Redeploy** the project (or wait for auto-deploy)

### Step 2: Verify

After redeploy, check:
- ✅ WalletConnect warning should disappear
- ✅ Buttons should work
- ✅ Navigation should work
- ✅ No console errors

## 🔄 ALTERNATIVE: Auto-detect URL

The code now uses `process.env.NEXT_PUBLIC_APP_URL` with fallbacks, but for production you should set it explicitly in Vercel.

## 📝 ENVIRONMENT VARIABLES TO UPDATE

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://vortex-bice-two.vercel.app
```

**Important:** Make sure this matches your actual Vercel deployment URL!

