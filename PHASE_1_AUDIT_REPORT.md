# VORTEX PROTOCOL - PHASE 1 AUDIT REPORT
## Rà soát toàn diện đối chiếu với Project Spec v2026-01-07

**Ngày rà soát:** 2026-01-07  
**Spec version:** v2026-01-07  
**Codebase version:** Current

---

## 📊 TỔNG QUAN

### Completion Status

| Stage | Requirement | Status | Notes |
|-------|------------|--------|-------|
| **1.1** | Core 4-tier classification | ✅ **COMPLETE** | LEGIT, DUST, MICRODUST, RISK tiers implemented |
| **1.1** | 12 risk layers | ⚠️ **PARTIAL** | Only 6-7 layers actively calculated, structure exists for 12 |
| **1.1** | 11 chains support | ✅ **COMPLETE** | 10 EVM + Solana |
| **1.1** | AA gasless (Pimlico) | ✅ **COMPLETE** | Pimlico integration working |
| **1.1** | Basic routing (1inch) | ✅ **COMPLETE** | 1inch primary router |
| **1.1** | Frontend + Dashboard | ✅ **COMPLETE** | Next.js 15, React 19, all pages |
| **1.1** | Cloudflare Turnstile | ⚠️ **PARTIAL** | Component exists, NOT integrated into API routes |
| **1.2** | 20-layer risk model | ❌ **MISSING** | Only 12 layers in constants, 6-7 calculated |
| **1.2** | Multi-router comparison | ✅ **COMPLETE** | 1inch, Uniswap v4, Curve, Balancer |
| **1.2** | Dual paymaster fallback | ✅ **COMPLETE** | Pimlico → Coinbase fallback |
| **1.2** | Smart bridging | ❌ **MISSING** | Constant exists, logic not implemented |
| **1.2** | Farcaster Mini App | ⚠️ **PARTIAL** | Frame v2 code exists, Add-to-app incomplete |
| **1.2** | Farcaster notifications | ⚠️ **PARTIAL** | Service exists, not triggered on events |
| **1.2** | Base Paymaster policies | ❌ **MISSING** | No allowlist/policy checks |
| **1.2** | Public grant metrics | ✅ **COMPLETE** | Analytics dashboard exists |
| **1.2** | OnchainKit Checkout | ❌ **MISSING** | Placeholder only, not integrated |

---

## ✅ ĐÃ HOÀN THÀNH (COMPLETE)

### 1. Core Infrastructure ✅

- **Next.js 15** + **React 19.2** + **TypeScript 5**
- **Wagmi v3** + **Viem v2** configured
- **Neon PostgreSQL** + **Drizzle ORM** schema complete
- **Upstash Redis** caching implemented
- Database schema matches spec exactly

### 2. Multi-Chain Support ✅

- **10 EVM chains:** Base, Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche, Monad, zkSync Era
- **Solana** support via Helius API
- Multi-RPC fallback (QuickNode → Alchemy → Infura → Public)
- Chain configuration in `src/blockchain/chains.ts`

### 3. Token Classification ✅

- **4-tier system** implemented:
  - LEGIT: `valueUsd >= 10`, `riskScore 0-20`
  - DUST: `0.10 <= valueUsd < 10`, `riskScore 21-50`
  - MICRODUST: `valueUsd < 0.10`, `riskScore 51-75`
  - RISK/SCAM: `riskScore 76-100`
- Classification logic in `riskScoringService.ts`

### 4. Account Abstraction ✅

- **Pimlico** paymaster integration (`src/blockchain/pimlico.ts`)
- **Coinbase Smart Wallet** paymaster fallback (`src/blockchain/coinbase.ts`)
- Dual paymaster strategy with `sponsorWithFallback()`
- UserOperation building and execution

### 5. Multi-Router System ✅

- **1inch** router (`src/blockchain/routers/oneInch.ts`)
- **Uniswap V4** router (`src/blockchain/routers/uniswapV4.ts`)
- **Curve** router (`src/blockchain/routers/curve.ts`)
- **Balancer** router (`src/blockchain/routers/balancer.ts`)
- **Jupiter** router for Solana (`src/blockchain/routers/jupiter.ts`)
- Route comparison service (`src/services/routerService.ts`)

### 6. Frontend Pages ✅

- Landing page (`app/page.tsx`)
- Dashboard (`app/(app)/dashboard/page.tsx`)
- Scan page (`app/(app)/scan/page.tsx`)
- Consolidate page (`app/(app)/consolidate/page.tsx`)
- History page (`app/(app)/history/page.tsx`)
- Grant metrics (`app/(app)/grant-metrics/page.tsx`)

### 7. API Endpoints ✅

- `POST /api/v1/scan` - Wallet scanning
- `POST /api/v1/swap` - Consolidation execution
- `GET /api/v1/status/:id` - Status polling
- `GET /api/v1/user/history` - User history
- `GET /api/v1/analytics/dashboard` - Grant metrics

### 8. Farcaster Integration (Partial) ⚠️

- Frame v2 HTML generation (`src/services/farcasterService.ts`)
- Notification service (`src/services/notificationService.ts`)
- Frame route (`app/frame/route.ts`)
- Webhook handler (`app/api/frame/webhook/route.ts`)
- **BUT:** Notifications not triggered on events

---

## ⚠️ CẦN HOÀN THIỆN (PARTIAL)

### 1. Cloudflare Turnstile Integration ⚠️

**Status:** Component và middleware đã có, nhưng **CHƯA được tích hợp vào API routes**

**Files:**
- ✅ `src/middleware/turnstile.ts` - Verification logic exists
- ✅ `src/components/ui/turnstile.tsx` - Frontend component exists
- ❌ `app/api/v1/scan/route.ts` - **NOT using Turnstile**
- ❌ `app/api/v1/swap/route.ts` - **NOT using Turnstile**

**Required Actions:**
```typescript
// In app/api/v1/scan/route.ts and app/api/v1/swap/route.ts
import { requireTurnstile } from '@/middleware/turnstile';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken } = body;
  
  // Add Turnstile verification
  await requireTurnstile(turnstileToken, request.headers.get('x-forwarded-for'));
  
  // ... rest of logic
}
```

### 2. Risk Scoring - 20 Layers ⚠️

**Status:** Structure exists for 20 layers, but only **6-7 layers actively calculated**

**Current Implementation:**
- `src/config/constants.ts` defines weights for 20 layers
- `src/services/riskScoringService.ts` only calculates:
  - Layer 3: Honeypot detection ✅
  - Layer 2: Concentration ✅
  - Layer 9: Liquidity ✅
  - Layer 3: Trading risks (tax) ✅
  - Layer 6: Reputation (partial) ✅
  - Missing: Layers 1, 4, 5, 7, 8, 10, 11, 12, 13-20

**Required Actions:**
- Implement all 12 layers for Phase 1.1
- Add 8 advanced layers (13-20) for Phase 1.2
- Connect layer scores to actual API data sources

### 3. Farcaster Notifications ⚠️

**Status:** Service exists, but **not triggered on events**

**Files:**
- ✅ `src/services/notificationService.ts` - Send logic exists
- ✅ `src/services/farcasterService.ts` - Helper functions exist
- ❌ Not called when:
  - Dust found after scan
  - Consolidation completed

**Required Actions:**
```typescript
// In app/api/v1/scan/route.ts - after scan completes
if (dustValue > threshold) {
  await notifyDustFound(userId, dustValue, tokensCount);
}

// In consolidationService.ts - after consolidation completes
await notifyConsolidationComplete(userId, outputValue, gasSaved, txHash);
```

### 4. Farcaster Add-to-App ⚠️

**Status:** Frame v2 code exists, but **Add-to-app flow incomplete**

**Missing:**
- Proper handling of `notificationDetails` from client
- Registration flow when user adds Mini App
- Client ID management

---

## ❌ THIẾU HOÀN TOÀN (MISSING)

### 1. Smart Bridge Logic ❌

**Status:** Constant exists, but **logic not implemented**

**Current:**
```typescript
// src/config/constants.ts
export const BRIDGE_COST_THRESHOLD_PERCENT = 5; // Don't bridge if cost > 5% of value
```

**Missing:**
- Bridge quote fetching (Across, Stargate, deBridge)
- Cost comparison logic
- Decision function: `chooseBridge()`
- Integration into consolidation plan

**Required Implementation:**
```typescript
// New file: src/services/bridgeService.ts
interface BridgeQuote {
  bridge: 'across' | 'stargate' | 'debridge';
  costUsd: number;
  estimatedTimeMinutes: number;
}

function chooseBridge(quotes: BridgeQuote[], valueUsd: number): BridgeQuote | null {
  const best = [...quotes].sort((a, b) => a.costUsd - b.costUsd)[0];
  if (!best) return null;
  if (best.costUsd > valueUsd * 0.05) return null; // too expensive
  return best;
}
```

### 2. Base Paymaster Policies ❌

**Status:** **No allowlist or policy checks implemented**

**Spec Requirement:**
- Contract/function allowlist
- Per-user daily volume limits
- Per-operation max value limits
- Restrict to known safe DEX + bridge contracts

**Required Implementation:**
```typescript
// New file: src/middleware/paymasterPolicy.ts
const ALLOWED_ROUTERS = [
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch
  '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap Universal Router
  // ... other safe contracts
];

const ALLOWED_FUNCTIONS = [
  '0x7c025200', // swap() selector
  // ... other safe selectors
];

export function validatePaymasterPolicy(userOp: UserOperation): boolean {
  // Check contract allowlist
  // Check function selector
  // Check per-user limits
  // Check max value
}
```

### 3. OnchainKit Checkout ❌

**Status:** Placeholder only, **not integrated**

**Current:**
- `src/components/providers/onchainkit-provider.tsx` - Empty placeholder
- Package installed: `@coinbase/onchainkit@^0.36.0`

**Missing:**
- Checkout component integration
- Pro subscription flow
- Payment handling
- Subscription status tracking

**Required Implementation:**
- Add Checkout component to Pro tier page
- Handle subscription payments
- Store subscription status in DB
- Gate Pro features behind subscription

### 4. Reown AppKit ❌

**Status:** **Not used** - Currently using WalletConnect

**Spec Requirement:**
> "Connect wallet (Reown AppKit, Base-focused)"

**Current:**
- Using `@walletconnect/ethereum-provider`
- Coinbase Wallet connector via Wagmi

**Required:**
- Replace with Reown AppKit v6
- Base-focused wallet connection
- Better Base ecosystem integration

### 5. Next.js Version Mismatch ❌

**Status:** Using **Next.js 15**, spec requires **Next.js 16**

**Current:**
```json
"next": "^15.1.0"
```

**Required:**
```json
"next": "^16.0.0"
```

**Note:** This may be intentional if Next.js 16 is not stable yet. Verify with team.

---

## 🔧 PRIORITY FIXES (Theo thứ tự ưu tiên)

### Priority 1: Critical Security & Compliance

1. **Integrate Turnstile vào API routes** (1-2 hours)
   - Add to `/api/v1/scan`
   - Add to `/api/v1/swap`
   - Add to `/api/frame` (optional)

2. **Implement Base Paymaster Policies** (4-6 hours)
   - Contract allowlist
   - Function selector checks
   - Rate limiting per user
   - Max value limits

### Priority 2: Phase 1.1 Completion

3. **Complete 12 Risk Layers** (8-12 hours)
   - Implement missing layers 1, 4, 5, 7, 8, 10, 11, 12
   - Connect to actual data sources
   - Test scoring accuracy

4. **Trigger Farcaster Notifications** (2-3 hours)
   - Call `notifyDustFound()` after scan
   - Call `notifyConsolidationComplete()` after consolidation
   - Test notification delivery

### Priority 3: Phase 1.2 Features

5. **Implement Smart Bridge Logic** (6-8 hours)
   - Bridge quote fetching
   - Cost comparison
   - Integration into consolidation plan

6. **Add 8 Advanced Risk Layers** (12-16 hours)
   - Layers 13-20 implementation
   - ML anomaly detection (if feasible)
   - Advanced security checks

7. **Complete Farcaster Add-to-App** (4-6 hours)
   - Handle `notificationDetails`
   - Registration flow
   - Client management

8. **Integrate OnchainKit Checkout** (6-8 hours)
   - Checkout component
   - Payment flow
   - Subscription management

### Priority 4: Optional Improvements

9. **Migrate to Reown AppKit** (4-6 hours)
   - Replace WalletConnect
   - Base-focused experience

10. **Upgrade to Next.js 16** (2-4 hours)
    - Test compatibility
    - Update dependencies

---

## 📋 CHECKLIST TỔNG HỢP

### Stage 1.1 (Weeks 1-4) - Foundation

- [x] Core 4-tier classification
- [x] Support 11 chains
- [x] AA gasless (Pimlico)
- [x] Basic routing (1inch)
- [x] Frontend + Dashboard
- [ ] **Cloudflare Turnstile** (component exists, needs API integration)
- [ ] **12 risk layers** (structure exists, needs full implementation)

### Stage 1.2 (Weeks 5-8) - Enhancement

- [ ] **20-layer risk model** (only 12 in constants, 6-7 calculated)
- [x] Multi-router comparison
- [x] Dual paymaster fallback
- [ ] **Smart bridging** (constant exists, logic missing)
- [ ] **Farcaster Mini App** (code exists, Add-to-app incomplete)
- [ ] **Farcaster notifications** (service exists, not triggered)
- [ ] **Base Paymaster policies** (missing)
- [x] Public grant metrics
- [ ] **OnchainKit Checkout** (placeholder only)

---

## 🎯 KẾT LUẬN

### Overall Progress: **~70% Complete**

**Strengths:**
- Core infrastructure solid
- Multi-chain support excellent
- AA implementation working
- Multi-router system complete
- Frontend polished

**Critical Gaps:**
1. **Security:** Turnstile not protecting API routes
2. **Security:** No paymaster policy enforcement
3. **Completeness:** Risk scoring incomplete (6/20 layers)
4. **Features:** Bridge logic missing
5. **Integration:** Notifications not triggered

### Recommended Timeline

- **Week 1:** Priority 1 fixes (Turnstile + Paymaster policies)
- **Week 2:** Complete 12 risk layers + trigger notifications
- **Week 3:** Smart bridge logic + Add-to-app completion
- **Week 4:** 8 advanced layers + OnchainKit Checkout

**Total estimated time to Phase 1 completion: 3-4 weeks**

---

**Report generated:** 2026-01-07  
**Next review:** After Priority 1 fixes completed
