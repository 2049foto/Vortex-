# 🚀 VORTEX PROTOCOL - Quick Start Guide

## ✅ Setup Complete!

Your environment configuration is ready. Here's what you need to know:

## 📁 Files Created

```
c:\VORTEX 2026\
├── .env.local              # Your environment variables (499 lines, 21KB)
├── .gitignore              # Git ignore rules (includes .env.local)
├── ENV_SETUP_SUMMARY.md    # Detailed configuration overview
└── QUICK_START.md          # This file
```

## 🔑 Most Important Variables

### For Development
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://vortex-protocol.vercel.app
NEXTAUTH_URL=http://localhost:3000
```

### Database (Neon PostgreSQL)
```bash
DATABASE_URL=postgresql://neondb_owner:npg_FdkJc5RCKIYjfG@ep-crimson-star-ahjdrwmd.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Cache (Upstash Redis)
```bash
UPSTASH_REDIS_REST_URL=https://cool-stud-8722.upstash.io
UPSTASH_REDIS_REST_TOKEN=ASISAAImcDFmZDdiYzdiOTMyNzE0MjA4YTBlOGU0NTk3ZmUyYzUyZHAxODcyMg
```

### Primary RPC (QuickNode)
```bash
# Base Mainnet (Primary Chain)
NEXT_PUBLIC_QUICKNODE_BASE_HTTPS=https://old-chaotic-moon.base-mainnet.quiknode.pro/79ad7958039f6d182770058bc4e860566290901e

# Solana Mainnet
NEXT_PUBLIC_QUICKNODE_SOLANA_HTTPS=https://old-chaotic-moon.solana-mainnet.quiknode.pro/79ad7958039f6d182770058bc4e860566290901e
```

### Wallet Connection
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=69915bbd15f146b792917c4f1a657139
NEXT_PUBLIC_PRIVY_APP_ID=cmj9ky35y03a9lh0cxoijknnx
```

### Admin Wallet
```bash
NEXT_PUBLIC_ADMIN_WALLET=0xAdFB2776EB40e5218784386aa576ca9E08450127
```

## 🎯 Quick Commands

### Verify Environment File
```powershell
# Check file exists
Get-Item .env.local

# View first 20 lines
Get-Content .env.local | Select-Object -First 20

# Count total lines
(Get-Content .env.local | Measure-Object -Line).Lines

# Check file size
(Get-Item .env.local).Length
```

### Next Steps

1. **Create Next.js Project** (if not already done):
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir
```

2. **Install Core Dependencies**:
```bash
npm install @prisma/client @upstash/redis wagmi viem
npm install -D prisma drizzle-kit
```

3. **Install Web3 Dependencies**:
```bash
npm install @rainbow-me/rainbowkit @walletconnect/web3-provider
npm install @alchemy/aa-core @pimlico/permissionless
```

4. **Install Analytics**:
```bash
npm install posthog-js @sentry/nextjs
```

5. **Start Development Server**:
```bash
npm run dev
```

## 🔗 Service Dashboards

### Infrastructure
- **Neon DB:** https://console.neon.tech
- **Upstash:** https://console.upstash.com
- **QuickNode:** https://dashboard.quicknode.com
- **Alchemy:** https://dashboard.alchemy.com
- **Infura:** https://app.infura.io

### Security & APIs
- **GoPlus:** https://gopluslabs.io
- **Tenderly:** https://dashboard.tenderly.co
- **Gitcoin Passport:** https://passport.gitcoin.co

### Account Abstraction
- **Pimlico:** https://dashboard.pimlico.io
- **ZeroDev:** https://dashboard.zerodev.app
- **Coinbase CDP:** https://portal.cdp.coinbase.com

### Analytics
- **PostHog:** https://app.posthog.com
- **Sentry:** https://sentry.io
- **Dune:** https://dune.com

### Deployment
- **Vercel:** https://vercel.com/derexeths-projects
- **GitHub:** https://github.com/2049foto/Vortex-

## 🛡️ Security Checklist

- [x] `.env.local` created with all configuration
- [x] `.gitignore` configured to exclude `.env.local`
- [x] JWT secrets generated securely
- [x] All RPC endpoints use HTTPS/WSS
- [x] Database connection uses SSL
- [ ] Test all API connections
- [ ] Verify rate limits
- [ ] Set up monitoring alerts
- [ ] Configure Vercel environment variables for production

## 🎮 Feature Flags (Current Settings)

### ✅ Enabled
- Analytics tracking
- Gasless transactions
- Session keys
- AI classification
- Volatility detector

### ❌ Disabled (Phase 2)
- Green carbon offset
- Tokenized receipts
- Quantum resistance
- Cross-chain swaps

## 📊 Supported Chains

| Chain | Chain ID | Status | RPC Provider |
|-------|----------|--------|--------------|
| **Base** | 8453 | 🟢 Primary | QuickNode + Alchemy |
| Ethereum | 1 | 🟢 Active | Alchemy + Infura |
| Arbitrum | 42161 | 🟢 Active | Alchemy + Infura |
| Optimism | 10 | 🟢 Active | Alchemy + Infura |
| Polygon | 137 | 🟢 Active | Alchemy + Infura |
| BNB Chain | 56 | 🟢 Active | Alchemy + Infura |
| Avalanche | 43114 | 🟢 Active | Alchemy + Infura |
| Monad | 838592 | 🟡 Beta | Alchemy + Public |
| zkSync Era | 324 | 🟢 Active | Alchemy + Public |
| **Solana** | mainnet-beta | 🟢 Primary | QuickNode + Helius |

## 💡 Common Tasks

### Test Database Connection
```typescript
// lib/db.ts
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function testConnection() {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW()');
  client.release();
  return result.rows[0];
}
```

### Test Redis Cache
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function testCache() {
  await redis.set('test', 'Hello Vortex!');
  const value = await redis.get('test');
  return value;
}
```

### Test RPC Connection
```typescript
// lib/rpc.ts
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS),
});

export async function testRPC() {
  const blockNumber = await client.getBlockNumber();
  return blockNumber;
}
```

## 🐛 Troubleshooting

### Issue: Environment variables not loading
**Solution:**
```bash
# Restart your dev server
# Make sure .env.local is in the root directory
# Check for syntax errors in .env.local
```

### Issue: Database connection fails
**Solution:**
```bash
# Verify Neon database is active
# Check connection string format
# Ensure SSL mode is set to 'require'
```

### Issue: RPC rate limit exceeded
**Solution:**
```bash
# Check your QuickNode dashboard for usage
# Implement caching for repeated requests
# Use fallback RPCs (Alchemy → Infura → Public)
```

### Issue: Redis connection timeout
**Solution:**
```bash
# Verify Upstash Redis is active
# Check REST URL and token are correct
# Increase timeout settings if needed
```

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Viem: https://viem.sh
- Wagmi: https://wagmi.sh
- Drizzle ORM: https://orm.drizzle.team

### Community
- GitHub Issues: https://github.com/2049foto/Vortex-/issues
- Vercel Support: https://vercel.com/support

## 🎯 Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/` or `app/` directory
   - Changes auto-reload with Fast Refresh

3. **Test Locally**
   - Visit http://localhost:3000
   - Test wallet connections
   - Verify API integrations

4. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
   - Auto-deploys to Vercel
   - Set environment variables in Vercel dashboard

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It's in `.gitignore` for security
2. **Rotate secrets before production** - Generate new keys for production
3. **Monitor API usage** - Stay within free tier limits
4. **Use Vercel env vars** - For production deployment
5. **Enable 2FA** - On all service accounts
6. **Regular backups** - Database and configuration

## 🎉 You're Ready!

Your Vortex Protocol environment is fully configured with:
- ✅ 10 blockchain networks
- ✅ 20+ API integrations
- ✅ Multi-layer RPC fallback
- ✅ Security scanning (12 layers)
- ✅ Account abstraction (gasless)
- ✅ Analytics & monitoring
- ✅ AI-powered features

**Happy Building! 🚀**

---

**Need Help?**
- Check `ENV_SETUP_SUMMARY.md` for detailed configuration
- Review `.env.local` for all available variables
- Visit service dashboards for API status and usage

**Last Updated:** January 7, 2026

