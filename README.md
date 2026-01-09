<div align="center">

# 🌀 Vortex Protocol

### Premium Portfolio Hygiene Engine

**Gasless Multi-Chain Consolidator Optimized for Base**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Base](https://img.shields.io/badge/Base-Ecosystem-0052FF?style=for-the-badge)](https://base.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](https://vortexbase.vercel.app) · [Documentation](./docs) · [Farcaster](https://warpcast.com/vortex)

</div>

---

## 🎯 Overview

**Vortex Protocol** enables users to clean and consolidate fragmented crypto portfolios across 11 chains with zero gas fees on Base. Built with enterprise-grade security and optimized for the Base ecosystem.

### The Problem
- **Fragmented portfolios** with dust tokens across multiple chains
- **Hidden value** locked in small token amounts
- **Security risks** from unknown/scam tokens
- **High gas costs** for manual consolidation

### Our Solution
- 🔍 **Smart Scanning** — Detect all tokens across 11 chains instantly
- 🛡️ **20-Layer Risk Analysis** — AI-powered security scoring
- ⚡ **Gasless Execution** — Zero fees via Account Abstraction
- 💰 **Value Recovery** — Consolidate dust into usable ETH/USDC

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **11-Chain Support** | Base, Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche, zkSync, Monad + Solana |
| **20-Layer Risk Scoring** | GoPlus, Honeypot.is, DexScreener + ML-powered analysis |
| **4-Tier Classification** | LEGIT → DUST → MICRODUST → RISK/SCAM |
| **Multi-DEX Routing** | 1inch, Uniswap v4, Curve, Balancer, Jupiter |
| **Gasless on Base** | Pimlico + Coinbase Paymaster sponsorship |
| **Farcaster Native** | Frame v2 Mini App with notifications |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
│         React 19 • TailwindCSS 4 • Framer Motion           │
│              Wagmi v3 • Coinbase Smart Wallet               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Layer (Edge)                         │
│     /api/v1/scan • /api/v1/swap • /api/v1/status           │
│          Cloudflare Turnstile • Rate Limiting               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Core Services                             │
│   Portfolio Scanner • Risk Scoring • Consolidation Engine   │
│         Multi-Router • Tenderly Simulation • AA             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Infrastructure                            │
│      Neon PostgreSQL • Upstash Redis • Vercel Edge         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.1 or Node.js ≥ 20
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Redis cache (we recommend [Upstash](https://upstash.com))

### Installation

```bash
# Clone repository
git clone https://github.com/2049foto/Vortex-.git
cd Vortex-

# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Setup database
bun run db:push

# Start development server
bun dev
```

### Environment Variables

See [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for complete configuration guide.

**Required for Production:**
```env
DATABASE_URL=           # Neon PostgreSQL
UPSTASH_REDIS_REST_URL= # Redis cache
MORALIS_API_KEY=        # Token data
PIMLICO_API_KEY=        # AA bundler
ONEINCH_API_KEY=        # DEX aggregator
```

---

## 📱 Farcaster Integration

Vortex is built as a **native Farcaster Mini App** with Frame v2 support.

### Features
- 📲 Add to Farcaster client
- 🔔 Push notifications (dust detected, consolidation complete)
- 🖼️ Rich frame previews
- 🔗 Deep linking to scan results

### Frame Endpoints
- `/api/frame/scan` — Main scan frame
- `/api/frame/leaderboard` — Top consolidators
- `/api/frame/webhook` — Notification handler

---

## 🔐 Security

### Non-Custodial
- **Zero fund custody** — We never hold your assets
- **User wallet control** — All operations signed by user
- **Transparent execution** — Every step visible on-chain

### Risk Protection
- ✅ Honeypot detection via simulation
- ✅ Rug pull risk analysis
- ✅ Contract audit verification
- ✅ Liquidity depth checks
- ✅ ML anomaly detection

### Infrastructure
- 🛡️ Cloudflare Turnstile (bot protection)
- 🔒 Rate limiting per endpoint
- 🔐 JWT session encryption
- ✅ Input validation (Zod schemas)

---

## 📊 Supported Chains

| Chain | ID | Status | DEX |
|-------|-----|--------|-----|
| Base | 8453 | ✅ Primary | 1inch, Uniswap |
| Ethereum | 1 | ✅ | 1inch, Curve |
| Arbitrum | 42161 | ✅ | 1inch, Balancer |
| Optimism | 10 | ✅ | 1inch |
| Polygon | 137 | ✅ | 1inch |
| BNB Chain | 56 | ✅ | 1inch |
| Avalanche | 43114 | ✅ | 1inch |
| zkSync Era | 324 | ✅ | 1inch |
| Monad | 838592 | ✅ | Native |
| Solana | — | ✅ | Jupiter |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 4, Framer Motion
- **Web3**: Wagmi v3, Viem, Coinbase Smart Wallet

### Backend
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Cache**: Upstash Redis
- **Runtime**: Vercel Edge Functions

### Integrations
- **Token Data**: Moralis, Alchemy, Helius
- **Security**: GoPlus, Honeypot.is, Tenderly
- **DEX**: 1inch, Jupiter, Curve, Balancer
- **AA**: Pimlico, Coinbase Paymaster

---

## 📈 API Reference

### Scan Wallet
```http
POST /api/v1/scan
Content-Type: application/json

{
  "walletAddress": "0x...",
  "chains": [8453, 1, 42161],
  "turnstileToken": "..."
}
```

### Execute Consolidation
```http
POST /api/v1/swap
Content-Type: application/json

{
  "walletAddress": "0x...",
  "selectedTokens": [...],
  "outputToken": "ETH",
  "slippagePct": 0.5
}
```

### Check Status
```http
GET /api/v1/status/{consolidationId}
```

Full API documentation: [docs/API.md](./docs/API_KEYS_SETUP.md)

---

## 🏆 Grant Metrics

Real-time metrics available at `/grant-metrics`:

| Metric | Target | Status |
|--------|--------|--------|
| Wallets Scanned | 10,000+ | 📈 Growing |
| Dust Consolidated | $100K+ | 📈 Growing |
| Base TVL Added | $50K+ | 📈 Growing |
| Gas Saved | $10K+ | 📈 Growing |

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅
- [x] 11-chain scanning
- [x] 20-layer risk scoring
- [x] Gasless consolidation
- [x] Farcaster Frame v2
- [x] Public grant metrics

### Phase 2 — Expansion
- [ ] 50+ chain support
- [ ] Pro tier subscriptions
- [ ] iOS/Android apps
- [ ] Professional audit
- [ ] Enterprise API

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **Website**: [vortexbase.vercel.app](https://vortexbase.vercel.app)
- **GitHub**: [github.com/2049foto/Vortex-](https://github.com/2049foto/Vortex-)
- **Farcaster**: [@vortex](https://warpcast.com/vortex)
- **Base**: [base.org](https://base.org)

---

<div align="center">

**Built for the Base Ecosystem** 🔵

*Vortex Protocol — Premium Portfolio Hygiene Engine*

</div>
