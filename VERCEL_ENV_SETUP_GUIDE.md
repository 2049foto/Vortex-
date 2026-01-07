# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP GUIDE

## ⚠️ CRITICAL: Update Environment Variables

**Your Vercel URL:** `https://vortex-bice-two.vercel.app`  
**Current Config:** `NEXT_PUBLIC_APP_URL` needs to match this!

---

## 📋 METHOD 1: Manual Update (Recommended)

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/derexeths-projects
2. Click on project: **Vortex-**
3. Go to **Settings** → **Environment Variables**

### Step 2: Update Critical Variables First

**These MUST be updated immediately:**

```
NEXT_PUBLIC_APP_URL=https://vortex-bice-two.vercel.app
```

### Step 3: Add All Other Variables

Open `VERCEL_ENV_VARS.txt` and copy each line:

**Format:** `KEY=value`

**Example:**
```
NEXT_PUBLIC_APP_NAME=Vortex Protocol
NEXT_PUBLIC_APP_URL=https://vortex-bice-two.vercel.app
JWT_SECRET=qd6UACar+FZInZywNghMzpayoGfxzT5iRHXrtZi2ytA=
...
```

**For each line:**
1. Click **Add New** in Vercel
2. Paste `KEY` in **Name** field
3. Paste `value` in **Value** field
4. Select **Environment:** Production, Preview, Development (or all)
5. Click **Save**

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**

---

## 📋 METHOD 2: Vercel CLI (Faster)

### Install Vercel CLI
```bash
npm i -g vercel
```

### Login
```bash
vercel login
```

### Link Project
```bash
cd "c:\VORTEX 2026"
vercel link
```

### Set All Variables
```bash
# Read VERCEL_ENV_VARS.txt and set each variable
# Example:
vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://vortex-bice-two.vercel.app

# Or use script (if we create one)
```

---

## 🔧 QUICK FIX SCRIPT

I've created `VERCEL_ENV_VARS.txt` with all 297 variables formatted.

**To use:**
1. Open `VERCEL_ENV_VARS.txt`
2. Copy each line
3. Paste into Vercel dashboard

**Or use PowerShell script:**
```powershell
# Read and display formatted vars
Get-Content VERCEL_ENV_VARS.txt | ForEach-Object {
    $parts = $_ -split '=', 2
    Write-Host "Key: $($parts[0])"
    Write-Host "Value: $($parts[1])"
    Write-Host "---"
}
```

---

## ⚠️ CRITICAL VARIABLES TO UPDATE FIRST

These are the most important ones:

1. **NEXT_PUBLIC_APP_URL** = `https://vortex-bice-two.vercel.app` ⚠️ **MUST FIX**
2. **DATABASE_URL** = Your Neon connection string
3. **UPSTASH_REDIS_REST_URL** = Your Upstash URL
4. **UPSTASH_REDIS_REST_TOKEN** = Your Upstash token
5. **MORALIS_API_KEY** = Your Moralis key
6. **PIMLICO_API_KEY** = Your Pimlico key
7. **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID** = Your WalletConnect project ID

---

## 📝 NOTES

- **Total Variables:** 297
- **File Location:** `VERCEL_ENV_VARS.txt`
- **Format:** `KEY=value` (one per line)
- **No quotes needed** in Vercel dashboard
- **Select all environments** (Production, Preview, Development) when adding

---

## ✅ VERIFICATION

After updating, check:
1. ✅ No WalletConnect URL warnings in console
2. ✅ Buttons work correctly
3. ✅ API calls succeed
4. ✅ No 404 errors for assets

---

## 🆘 TROUBLESHOOTING

### Issue: Variables not updating
**Solution:** Redeploy after adding variables

### Issue: Still seeing old URL
**Solution:** Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: Too many variables to add manually
**Solution:** Use Vercel CLI or add in batches (50 at a time)

---

**File:** `VERCEL_ENV_VARS.txt`  
**Total:** 297 variables  
**Estimated Time:** 10-15 minutes to add all

