# VORTEX PROTOCOL - CODEBASE AUDIT REPORT
**Date:** January 9, 2026  
**Status:** Phase 1 Production - Comprehensive Codebase Analysis

---

## EXECUTIVE SUMMARY

This report provides a comprehensive audit of the Vortex Protocol codebase, documenting architecture, implementation status, integrations, and key components. The application is a **Premium Portfolio Hygiene Engine** that enables gasless multi-chain token consolidation optimized for Base.

---

## ARCHITECTURE OVERVIEW

### Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19.2, TypeScript 5.x
- **Styling:** TailwindCSS 4.x, Shadcn/UI v2, Framer Motion 11.x
- **State:** TanStack Query v6, Zustand v5
- **Web3:** Wagmi v3.x, Viem v2.x, Reown AppKit v6 (wallet connection)
- **Backend:** Next.js API Routes, Drizzle ORM
- **Database:** Neon PostgreSQL, Upstash Redis (with memory fallback)
- **Runtime:** Node.js 20 LTS, Bun 1.1 (for API server)

### Project Structure
```
.
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected app routes
│   │   ├── dashboard/      # User dashboard
│   │   ├── scan/          # Wallet scanning
│   │   ├── consolidate/   # Consolidation execution
│   │   └── grant-metrics/ # Public metrics
│   ├── api/               # API routes
│   │   ├── v1/            # Main API endpoints
│   │   │   ├── scan/      # POST - Scan wallet
│   │   │   ├── swap/      # POST - Execute consolidation
│   │   │   ├── status/    # GET - Check status
│   │   │   ├── user/      # GET - User history
│   │   │   └── analytics/ # GET - Dashboard metrics
│   │   └── frame/         # Farcaster Frame endpoints
│   └── frame/             # Frame route handler
├── src/
│   ├── blockchain/        # Chain configs, routers, bridges
│   ├── components/        # React components
│   ├── config/            # Environment, constants
│   ├── db/                # Drizzle schema, client, migrations
│   ├── lib/               # Utilities, API client
│   ├── middleware/        # Auth, rate limiting, Turnstile
│   ├── routes/            # Elysia routes (legacy API server)
│   ├── services/          # Business logic
│   │   ├── portfolioService.ts      # Wallet scanning
│   │   ├── riskScoringServiceV2.ts  # 20-layer risk analysis
│   │   ├── consolidationService.ts   # Multi-router swaps
│   │   ├── bridgeService.ts         # Cross-chain bridging
│   │   ├── relayService.ts          # Relay.link integration
│   │   ├── farcasterService.ts      # Frames v2 + notifications
│   │   └── notificationService.ts   # Notification delivery
│   └── ui-components/     # SuperDesign components
└── public/                # Static assets
```

---

## CORE FEATURES & IMPLEMENTATION STATUS

### 1. Wallet Scanning (`/api/v1/scan`)
**Status:** ✅ **IMPLEMENTED**

- **Chains Supported:** 10 EVM chains (Base, Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche, Monad, zkSync) + Solana
- **Data Sources:**
  - Primary: Moralis API (EVM tokens)
  - Fallback: Alchemy API (for unsupported chains)
  - Solana: Helius API
- **Features:**
  - Parallel chain scanning
  - Native token balance fetching
  - Token metadata caching (Redis + memory fallback)
  - Zero-balance filtering
  - Price fetching via CoinGecko

**Key Files:**
- `app/api/v1/scan/route.ts` - API endpoint
- `src/services/portfolioService.ts` - Core scanning logic

### 2. Risk Scoring System (`riskScoringServiceV2.ts`)
**Status:** ✅ **IMPLEMENTED** (20 layers)

**Phase 1.1 Layers (12):**
1. Smart Contract Audit (10%)
2. Holder Concentration (12%)
3. Honeypot Detection (15%)
4. Rug Pull Risk (12%)
5. Dev Wallet Exposure (8%)
6. Community Sentiment (7%)
7. Volume Trend (8%)
8. CEX Listings (10%)
9. Liquidity Depth (10%)
10. Price Volatility (5%)
11. Time Since Launch (3%)
12. Social Verification (0% - bonus)

**Phase 1.2 Advanced Layers (8):**
13. Flash Loan Vulnerability (8%)
14. Cross-Chain Bridge Risk (7%)
15. Insider Trading Signals (6%)
16. Regulatory Status (5%)
17. Validator Centralization (6%)
18. Composability Risk (5%)
19. Exploit History (8%)
20. ML Anomaly Detection (8%)

**Data Sources:**
- GoPlus Security API
- Honeypot.is API
- DexScreener API
- Token metadata from Moralis

**Tier Classification:**
- **LEGIT:** valueUsd >= 10, riskScore 0-20
- **DUST:** 0.10 <= valueUsd < 10, riskScore ~21-50
- **MICRODUST:** valueUsd < 0.10 OR riskScore ~51-75
- **RISK/SCAM:** riskScore 76-100

**Key Files:**
- `src/services/riskScoringServiceV2.ts` - Main risk calculation
- `src/config/constants.ts` - Tier thresholds, layer weights

### 3. Token Consolidation (`/api/v1/swap`)
**Status:** ✅ **IMPLEMENTED**

**Flow:**
1. User selects tokens to consolidate
2. System calculates risk scores
3. Creates consolidation plan (filters risky tokens)
4. Finds optimal swap routes (multi-router comparison)
5. Simulates transactions (Tenderly)
6. Sponsors gas via AA (Pimlico primary, Coinbase fallback)
7. Executes UserOperation
8. Tracks status and sends notifications

**Routers Supported:**
- 1inch (primary)
- Uniswap v4
- Curve
- Balancer
- Relay.link (for cross-chain)

**Key Files:**
- `app/api/v1/swap/route.ts` - API endpoint
- `src/services/consolidationService.ts` - Core consolidation logic
- `src/services/bridgeService.ts` - Cross-chain bridging
- `src/services/relayService.ts` - Relay.link integration

### 4. Account Abstraction & Gas Sponsorship
**Status:** ✅ **IMPLEMENTED**

**Paymasters:**
- **Primary:** Pimlico (`src/blockchain/pimlico.ts`)
- **Fallback:** Coinbase Smart Wallet (`src/blockchain/coinbase.ts`)
- **Strategy:** Try Pimlico first, fallback to Coinbase on failure

**UserOperation Flow:**
1. Build call data for swaps
2. Estimate gas via Pimlico
3. Sponsor UserOp (get paymasterAndData)
4. Submit to bundler
5. Poll for receipt

**Key Files:**
- `src/blockchain/pimlico.ts` - Pimlico integration
- `src/blockchain/coinbase.ts` - Coinbase paymaster
- `src/middleware/paymasterPolicy.ts` - Security policies

### 5. Farcaster Integration
**Status:** ✅ **IMPLEMENTED**

**Features:**
- Frame v2 support (`app/frame/route.ts`)
- Mini App integration
- Notification system (dust found, consolidation complete)
- Webhook handler for Add-to-App flow

**Key Files:**
- `app/frame/route.ts` - Frame handler
- `app/api/frame/webhook/route.ts` - Webhook handler
- `src/services/farcasterService.ts` - Farcaster logic
- `src/services/notificationService.ts` - Notification delivery

### 6. Cloudflare Turnstile (Bot Protection)
**Status:** ⚠️ **IMPLEMENTED BUT NOT CONFIGURED**

**Current State:**
- Middleware exists (`src/middleware/turnstile.ts`)
- Component exists (`src/components/ui/turnstile.tsx`)
- **Fail-open design** - allows requests when not configured
- Keys missing from .env.local

**Action Required:**
- Get keys from Cloudflare dashboard
- Add to `.env.local`:
  ```
  TURNSTILE_SECRET_KEY=your_secret_key
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
  ```

**Key Files:**
- `src/middleware/turnstile.ts` - Server-side verification
- `src/components/ui/turnstile.tsx` - Client-side widget

---

## DATABASE SCHEMA

### Tables (Drizzle ORM)

1. **users**
   - Wallet address, ENS name, avatar
   - Stats: total consolidations, dust cleaned, gas saved
   - Preferences: auto-hide microdust, default output token, slippage

2. **token_classifications**
   - Token metadata (address, chain, symbol, name)
   - Classification: tier, risk score, confidence
   - 20 risk layer scores (layer1_audit through layer20_ml_anomaly)
   - Caching: expires_at (24 hours)

3. **consolidation_requests**
   - Input/output tokens (JSONB)
   - Transaction info: userOpHash, txHash, blockNumber
   - Paymaster info: paymasterUsed, paymasterAddress
   - Status: PENDING, SIMULATING, BUNDLING, CONFIRMED, FAILED
   - Timestamps: created, simulation started, submitted, completed

4. **consolidation_analytics**
   - Daily metrics: consolidations, dust cleaned, gas saved
   - User stats: unique users, new users, returning users
   - Base-specific: TVL added, Base consolidations
   - Revenue: fees collected

5. **notification_tokens**
   - Farcaster notification tokens
   - Per-user, per-client (fid-based)
   - Callback URL and token storage

**Key Files:**
- `src/db/schema.ts` - Schema definition
- `src/db/client.ts` - Drizzle client
- `src/db/migrations/` - Migration files

---

## API ENDPOINTS

### Public Endpoints

| Endpoint | Method | Description | Protection |
|----------|--------|-------------|------------|
| `/api/v1/scan` | POST | Scan wallet for tokens | Turnstile (fail-open) |
| `/api/v1/swap` | POST | Execute consolidation | Turnstile (strict) |
| `/api/v1/status/:id` | GET | Check consolidation status | None |
| `/api/v1/user/history` | GET | User consolidation history | None |
| `/api/v1/analytics/dashboard` | GET | Public metrics | None |
| `/api/frame` | POST | Farcaster Frame handler | None |

### Request/Response Formats

**Scan Request:**
```typescript
{
  walletAddress: string;
  chainIds?: number[];
  turnstileToken: string;
}
```

**Scan Response:**
```typescript
{
  success: boolean;
  data: {
    wallet: string;
    tokens: TokenHolding[];
    summary: {
      totalTokens: number;
      totalValue: number;
      byTier: { LEGIT, DUST, MICRODUST, RISK };
      consolidationOpportunity: { tokenCount, totalValue };
    };
  };
}
```

**Swap Request:**
```typescript
{
  walletAddress: string;
  selectedTokens: Array<{ address, chainId, amountRaw? }>;
  outputToken: 'ETH' | 'USDC';
  slippagePct?: number;
  dryRun?: boolean;
  turnstileToken: string;
}
```

---

## FRONTEND COMPONENTS

### Pages
- **Landing** (`app/page.tsx`, `app/landing-client.tsx`)
- **Dashboard** (`app/(app)/dashboard/`)
- **Scan** (`app/(app)/scan/`)
- **Consolidate** (`app/(app)/consolidate/`)
- **Grant Metrics** (`app/(app)/grant-metrics/`)

### Key Components
- **Wallet Modal** (`src/components/wallet/wallet-modal.tsx`)
- **Turnstile Widget** (`src/components/ui/turnstile.tsx`)
- **OnchainKit Checkout** (`src/components/checkout/onchainkit-checkout.tsx`)
- **UI Components** (`src/ui-components/`)

### State Management
- **Zustand** (`src/lib/store.ts`) - UI state
- **TanStack Query** - Server state, caching

---

## BLOCKCHAIN INTEGRATIONS

### RPC Providers
- **Primary:** QuickNode (Base, Solana)
- **Secondary:** Alchemy (all EVM chains)
- **Backup:** Infura (all EVM chains)
- **Public Fallbacks:** LlamaRPC, public nodes

### DEX Aggregators
- **1inch** - Primary aggregator
- **0x Protocol** - Secondary
- **Uniswap v4** - Direct integration
- **Curve** - Direct integration
- **Balancer** - Direct integration
- **Jupiter** - Solana DEX

### Bridges
- **Relay.link** - Cross-chain swaps (primary)
- **Across** - EVM bridge
- **Stargate** - EVM bridge
- **deBridge** - EVM bridge

### Security & Simulation
- **Tenderly** - Transaction simulation
- **GoPlus** - Security analysis
- **Honeypot.is** - Honeypot detection
- **DexScreener** - Market data

---

## ENVIRONMENT CONFIGURATION

### Critical Variables (from .env.local)

**Database:**
- `DATABASE_URL` - Neon PostgreSQL
- `UPSTASH_REDIS_REST_URL` - Redis cache
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth

**APIs:**
- `MORALIS_API_KEY` - Token data (REQUIRED)
- `GOPLUS_API_KEY` - Security analysis
- `ONEINCH_API_KEY` - DEX aggregator
- `PIMLICO_API_KEY` - AA bundler
- `NEXT_PUBLIC_CDP_PAYMASTER_URL` - Coinbase paymaster

**Security:**
- `TURNSTILE_SECRET_KEY` - ⚠️ **MISSING**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - ⚠️ **MISSING**
- `JWT_SECRET` - Session encryption

**Wallet:**
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect

**Analytics:**
- `NEXT_PUBLIC_POSTHOG_KEY` - Product analytics
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

---

## IMPLEMENTATION GAPS & RECOMMENDATIONS

### Critical
1. **Cloudflare Turnstile** - Keys not configured (currently fail-open)
2. **OnchainKit Checkout** - Component exists but not fully integrated
3. **Base Paymaster Policies** - Basic implementation, needs strengthening

### Nice-to-Have
1. **Elysia API Server** (`src/index.ts`) - Legacy, not used (Next.js routes preferred)
2. **Solana Integration** - Basic support, needs expansion
3. **Mobile App** - Phase 2 feature

---

## TESTING

### Test Structure
- **E2E:** Playwright (`tests/e2e/`)
- **Performance:** K6 (`tests/performance/`)

### Coverage
- Phase 1.1: 80%+ E2E (target)
- Phase 1.2: 95%+ E2E (target)

---

## DEPLOYMENT

### Platforms
- **Primary:** Vercel (production)
- **Alternative:** Docker (fly.toml for Fly.io)

### Environment
- Production URL: `https://vortexbase.vercel.app`
- GitHub: `https://github.com/2049foto/Vortex-`

---

## SECURITY FEATURES

1. **Input Validation:** Zod schemas for all API requests
2. **Rate Limiting:** Upstash Redis-based (with memory fallback)
3. **Bot Protection:** Cloudflare Turnstile (when configured)
4. **Paymaster Policies:** Contract/function allowlist
5. **Honeypot Detection:** Pre-execution simulation via Tenderly
6. **Risk Filtering:** Tier 4 (RISK/SCAM) tokens never swappable

---

## PERFORMANCE OPTIMIZATIONS

1. **Caching:**
   - Redis (primary) + Memory (fallback)
   - Token classifications: 24 hours
   - Risk scores: 1 hour
   - Prices: 1 minute

2. **Parallel Processing:**
   - Multi-chain scanning in parallel
   - Risk score calculation in batches
   - Multi-router quote fetching

3. **Lazy Loading:**
   - Dynamic imports for heavy services
   - Code splitting via Next.js

---

## NEXT STEPS

1. **Configure Turnstile** - Get keys from Cloudflare dashboard
2. **Complete OnchainKit Checkout** - Integrate for Pro tier payments
3. **Strengthen Paymaster Policies** - Add more security checks
4. **Expand Solana Support** - Full Jupiter integration
5. **Add More Tests** - Increase E2E coverage

---

**End of Codebase Audit Report**
