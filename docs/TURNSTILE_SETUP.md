# Cloudflare Turnstile Setup Guide

## Overview

Cloudflare Turnstile is integrated into Vortex Protocol for bot protection on public endpoints. The current implementation uses a **fail-open** design, meaning requests are allowed even if Turnstile verification fails (to avoid blocking users during development).

## Step 1: Get Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** section
3. Click **Add Site**
4. Configure:
   - **Site Name:** Vortex Protocol
   - **Domain:** `vortexbase.vercel.app` (or your domain)
   - **Widget Mode:** Managed (recommended) or Invisible
   - **Pre-Clearance:** Optional (for better UX)
5. Copy the **Site Key** (public) and **Secret Key** (private)

## Step 2: Add Keys to Environment

Add to your `.env.local`:

```bash
# Cloudflare Turnstile (Bot Protection)
TURNSTILE_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
```

For Vercel production:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both keys for **Production** environment
3. Redeploy

## Step 3: Verify Integration

### Check Middleware

The middleware is located at `src/middleware/turnstile.ts`:

- ✅ **Fail-open mode** (current): Always allows requests
- ⚠️ **Strict mode** (optional): Blocks requests if verification fails

### Current Behavior

- If Turnstile is **not configured**: All requests allowed (fail-open)
- If Turnstile is **configured but token missing**: Request allowed (fail-open)
- If Turnstile is **configured and token invalid**: Request allowed (fail-open) - logs warning
- If Turnstile is **configured and token valid**: Request allowed - logs success

### Enable Strict Mode (Production)

To enable strict mode in production, modify `src/middleware/turnstile.ts`:

```typescript
export async function requireTurnstile(
  token: string,
  remoteIp?: string
): Promise<void> {
  const result = await verifyTurnstileToken(token, remoteIp);
  
  // STRICT MODE: Throw error if verification fails
  if (!result.success && isProd && isTurnstileConfigured()) {
    throw new Error(result.error || 'Turnstile verification failed');
  }
  
  // Fail-open for development
  if (!result.success) {
    logger.warn({ error: result.error }, 'Turnstile check failed but allowing request (fail-open)');
  }
}
```

## Step 4: Test Integration

### Test Endpoints

1. **Scan Endpoint** (`/api/v1/scan`):
   - Requires `turnstileToken` in request body
   - Currently fail-open (allows requests without token)

2. **Swap Endpoint** (`/api/v1/swap`):
   - Requires `turnstileToken` in request body
   - Currently fail-open (allows requests without token)

### Frontend Integration

The Turnstile component is at `src/components/ui/turnstile.tsx`:

```tsx
import { Turnstile } from '@/components/ui/turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
  onVerify={(token) => {
    // Use token in API requests
    setTurnstileToken(token);
  }}
  onError={() => {
    console.error('Turnstile verification failed');
  }}
/>
```

## Troubleshooting

### Issue: Turnstile widget not showing

**Solution:**
- Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- Check browser console for errors
- Verify domain is whitelisted in Cloudflare dashboard

### Issue: Verification always fails

**Solution:**
- Check `TURNSTILE_SECRET_KEY` is correct
- Verify domain matches Cloudflare configuration
- Check IP address is not blocked

### Issue: Too many verification requests

**Solution:**
- The component uses session storage to cache verification (5 minutes)
- Check `TURNSTILE_VERIFIED_KEY` in sessionStorage
- Verify anti-loop mechanism is working

## Free Tier Limits

- **1 million verifications/month** (free)
- No credit card required
- Unlimited sites

## Next Steps

1. ✅ Get Turnstile keys from Cloudflare
2. ✅ Add keys to `.env.local`
3. ✅ Test in development
4. ✅ Deploy to production
5. ⚠️ Consider enabling strict mode for production (optional)

---

**Last Updated:** January 9, 2026
