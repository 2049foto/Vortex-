# Farcaster Mini App Setup Guide

## Account Association

The `public/.well-known/farcaster.json` file contains a placeholder accountAssociation. You need to replace it with your actual Farcaster account association.

### Steps to Generate Account Association:

1. **Get your Farcaster FID** (Farcaster ID)
   - Go to https://warpcast.com and check your profile
   - Your FID is a number (e.g., 100026)

2. **Generate Account Association**
   - Use Farcaster's official tools or SDK
   - The association proves you own the domain
   - Format:
     ```json
     {
       "accountAssociation": {
         "header": "...",  // Base64 encoded header
         "payload": "...", // Base64 encoded payload
         "signature": "..." // Hex signature
       }
     }
     ```

3. **Update the manifest**
   - Replace the values in `public/.well-known/farcaster.json`
   - Commit and deploy to Vercel

## Testing

1. **Developer Preview Tool**
   - Visit: https://farcaster.xyz/~/developers/mini-apps/preview
   - Enter your domain: `vortexbase.vercel.app`
   - Verify manifest loads correctly

2. **Frame Testing**
   - Share frame URL in a Farcaster cast
   - Test button interactions
   - Verify redirects work

## Submission Checklist

Before submitting to Farcaster Mini App directory:

- [ ] Account association verified
- [ ] Manifest loads at `/.well-known/farcaster.json`
- [ ] Frame buttons work correctly
- [ ] App loads in Warpcast in-app browser
- [ ] Wallet connection works
- [ ] All features functional on mobile
- [ ] OG images render correctly
