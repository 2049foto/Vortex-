# 🎯 BACKEND IMPLEMENTATION PLAN - PHASE 1 MVP

## ✅ FRONTEND STATUS
- **Build:** ✅ SUCCESS (Exit code: 0)
- **Commit:** `57b2ea8`
- **Vercel:** Auto-deploying (should succeed now)

---

## 📋 BACKEND TASKS REMAINING

### Priority 1: Database & Core Infrastructure (30 min)
- [ ] Run database migrations on Neon PostgreSQL
- [ ] Test database connection
- [ ] Verify all tables created correctly
- [ ] Test environment variables

### Priority 2: Portfolio Scanning API (2 hours)
- [ ] Complete `/api/v1/scan` endpoint
- [ ] Integrate Moralis Web3 API for token data
- [ ] Implement 20-layer risk scoring system
- [ ] Implement 4-tier classification (LEGIT, DUST, MICRODUST, RISK/SCAM)
- [ ] Add caching for token classifications
- [ ] Add rate limiting

### Priority 3: Consolidation API (3 hours)
- [ ] Complete `/api/v1/swap` endpoint
- [ ] Integrate Pimlico AA (primary paymaster)
- [ ] Integrate Coinbase Smart Wallet (fallback paymaster)
- [ ] Implement multi-router comparison (1inch, Uniswap v4, Curve, Balancer)
- [ ] Implement Tenderly simulation
- [ ] Build UserOp batching logic
- [ ] Add Base Paymaster allowlist/policies

### Priority 4: Status & History APIs (1 hour)
- [ ] Complete `/api/v1/status/:id` endpoint
- [ ] Complete `/api/v1/user/history` endpoint
- [ ] Add proper error handling
- [ ] Add pagination for history

### Priority 5: Analytics Dashboard (1 hour)
- [ ] Complete `/api/v1/analytics/dashboard` endpoint
- [ ] Implement daily metrics calculation
- [ ] Add real-time data aggregation
- [ ] Connect to grant metrics page

### Priority 6: Farcaster Mini App (2 hours)
- [ ] Complete `/api/frame` endpoint (Frames v2)
- [ ] Implement frame metadata
- [ ] Add wallet input and top risky tokens display
- [ ] Implement "Add to app" functionality
- [ ] Implement notification system
- [ ] Store notification tokens

### Priority 7: Security & Polish (1 hour)
- [ ] Integrate Cloudflare Turnstile on scan/swap
- [ ] Add comprehensive error handling
- [ ] Add logging with Pino
- [ ] Test all endpoints
- [ ] Update API documentation

### Priority 8: Integration & Testing (2 hours)
- [ ] Connect frontend pages to backend APIs
- [ ] Test full user flow: scan → consolidate → success
- [ ] Test on mobile
- [ ] Fix any integration issues
- [ ] Performance optimization

---

## 🔧 IMPLEMENTATION ORDER

### Phase A: Database Setup (NOW)
```bash
# 1. Run migrations
bun run db:push

# 2. Test connection
# Create test script to verify DB connection
```

### Phase B: Scan API (NEXT)
**File:** `src/routes/scan.ts`
**Dependencies:**
- Moralis API key
- Risk scoring service
- Classification service

**Implementation Steps:**
1. Fetch token balances from Moralis
2. For each token, calculate risk score (20 layers)
3. Classify into 4 tiers
4. Cache results in DB
5. Return scan summary

### Phase C: Swap API
**File:** `src/routes/swap.ts`
**Dependencies:**
- Pimlico API
- Coinbase Paymaster
- 1inch, Uniswap v4, Curve, Balancer APIs
- Tenderly API

**Implementation Steps:**
1. Get best quotes from all routers
2. Compare and select optimal route
3. Build UserOp batch
4. Simulate with Tenderly
5. Sponsor gas (Pimlico → Coinbase fallback)
6. Submit to bundler
7. Track status

### Phase D: Analytics & History
**Files:** `src/routes/status.ts`, `src/routes/user.ts`, `src/routes/analytics.ts`
**Simple implementation:** Query DB and return data

### Phase E: Farcaster Frame
**File:** `src/routes/frame.ts`
**Frames v2 spec:** Follow official Farcaster documentation
**Features:**
- Input wallet address
- Display top risky tokens
- CTA button to consolidate
- Share to feed
- Add-to-app
- Notifications

### Phase F: Frontend Connection
**Files:** Update existing `app/*` pages to call real APIs instead of mocks

### Phase G: Testing & Polish
- End-to-end user flow
- Error cases
- Mobile testing
- Performance optimization

---

## 📊 ESTIMATED TIME

| Task | Time | Status |
|------|------|--------|
| Database setup | 30 min | ⏳ Pending |
| Scan API | 2 hours | ⏳ Pending |
| Swap API | 3 hours | ⏳ Pending |
| Status/History | 1 hour | ⏳ Pending |
| Analytics | 1 hour | ⏳ Pending |
| Farcaster Frame | 2 hours | ⏳ Pending |
| Security & Polish | 1 hour | ⏳ Pending |
| Integration & Testing | 2 hours | ⏳ Pending |
| **TOTAL** | **~13 hours** | |

---

## 🎯 CURRENT FOCUS

### STEP 1: Database Migrations
**Action:** Run Drizzle migrations to create all tables

**Commands:**
```bash
cd "c:\VORTEX 2026"
bun run db:generate  # Generate migration files
bun run db:push      # Push to Neon
```

**Expected Result:**
- Tables created: `users`, `token_classifications`, `consolidation_requests`, `consolidation_analytics`, `notification_tokens`
- All 20 risk layer columns in `token_classifications`

### STEP 2: Test Database Connection
**Action:** Create a simple test script

**File:** `scripts/test-db.ts`
```typescript
import { db } from '../src/db/client';
import { users } from '../src/db/schema';

async function testConnection() {
  console.log('Testing database connection...');
  const result = await db.select().from(users).limit(1);
  console.log('✅ Database connection successful!');
  console.log('Users count:', result.length);
}

testConnection();
```

### STEP 3: Implement Scan API
**File:** `src/routes/scan.ts`
**Status:** Skeleton exists, needs full implementation

**Key Functions to Implement:**
1. `fetchTokenBalances()` - Moralis API
2. `classifyToken()` - 4-tier logic
3. `calculateRiskScore()` - 20-layer model
4. `cacheClassification()` - Save to DB
5. `generateScanSummary()` - Response format

---

## 🚀 LET'S START

Ready to implement! Starting with database setup and testing, then moving to Scan API which is the foundation for everything else.

**Next Actions:**
1. Run database migrations
2. Test DB connection
3. Implement Scan API with Moralis
4. Implement risk scoring
5. Continue through the plan...

