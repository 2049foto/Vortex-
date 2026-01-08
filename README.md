# Vortex Protocol

**Premium Portfolio Hygiene Engine** — Gasless multi-chain consolidator optimized for Base

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.1-F472B6?style=flat-square)](https://bun.sh/)
[![Base](https://img.shields.io/badge/Chain-Base-0052FF?style=flat-square)](https://base.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## Overview

Vortex Protocol enables users to clean and consolidate fragmented crypto portfolios across 11 chains (10 EVM + Solana) with zero gas fees. Built for the Base ecosystem, it features intelligent risk scoring, multi-DEX routing, and seamless Farcaster Frame v2 integration.

### Key Features

- **11-Chain Scanning** — Base, Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche, Monad, zkSync, Solana
- **20-Layer Risk Analysis** — GoPlus, Honeypot.is, DexScreener security checks
- **Multi-DEX Aggregation** — 1inch, 0x/Uniswap, Curve, Balancer, Jupiter
- **Gasless Execution** — Pimlico + Coinbase Smart Wallet paymasters
- **Farcaster Integration** — Native Frame v2 support with notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
│  Landing • Dashboard • Scan • Consolidate • Grant Metrics   │
│           Wagmi v3 • Coinbase Smart Wallet • Framer         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Routes (Next.js)                     │
│        /api/v1/scan • /api/v1/swap • /api/v1/status        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Core Services                          │
│  portfolioService • riskScoringService • consolidationSvc   │
│       Multi-router • Tenderly simulation • Paymaster        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Infrastructure                         │
│   Neon PostgreSQL • Upstash Redis • Vercel Edge Functions   │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1
- [Node.js](https://nodejs.org/) ≥ 20

### Setup

```bash
# Clone
git clone https://github.com/2049foto/Vortex-.git
cd Vortex-

# Install
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Database migration
bun db:push

# Development
bun dev
```

### Environment Variables

Required variables for production:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Redis cache URL |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |
| `MORALIS_API_KEY` | Token data API |
| `GOPLUS_API_KEY` | Security analysis |
| `PIMLICO_API_KEY` | AA bundler |
| `NEXT_PUBLIC_CDP_PAYMASTER_URL` | Coinbase paymaster |
| `ONEINCH_API_KEY` | 1inch DEX aggregator |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Wallet connection |
| `JWT_SECRET` | Session encryption |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/scan` | POST | Scan wallet for tokens |
| `/api/v1/swap` | POST | Execute consolidation |
| `/api/v1/status/:id` | GET | Check transaction status |
| `/api/v1/user/history` | GET | User activity history |
| `/api/v1/analytics/dashboard` | GET | Grant metrics data |

---

## Supported Chains

| Chain | ID | Native Token |
|-------|-----|--------------|
| Base | 8453 | ETH |
| Ethereum | 1 | ETH |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Polygon | 137 | MATIC |
| BNB Chain | 56 | BNB |
| Avalanche | 43114 | AVAX |
| Monad | 838592 | MONAD |
| zkSync Era | 324 | ETH |
| Solana | - | SOL |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 15, React 19, TailwindCSS, Framer Motion |
| State | Zustand, React Query |
| Web3 | Wagmi v3, Viem, Coinbase Smart Wallet |
| Backend | Next.js API Routes, Drizzle ORM |
| Database | Neon PostgreSQL, Upstash Redis |
| Security | GoPlus, Honeypot.is, Tenderly |
| DEX | 1inch, 0x, Curve, Balancer, Jupiter |
| AA | Pimlico, Coinbase Paymaster |
| Analytics | PostHog, Sentry |

---

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

### Docker

```bash
docker build -t vortex-protocol .
docker run -p 3000:3000 --env-file .env.local vortex-protocol
```

---

## Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── api/v1/            # API routes
│   ├── dashboard/         # Dashboard page
│   ├── scan/              # Scan page
│   ├── consolidate/       # Consolidation page
│   └── grant-metrics/     # Public metrics
├── src/
│   ├── blockchain/        # Chain configs, routers
│   ├── components/        # React components
│   ├── config/            # Environment, constants
│   ├── db/                # Drizzle schema, client
│   ├── lib/               # Utilities, API client
│   ├── middleware/        # Auth, rate limiting
│   ├── services/          # Business logic
│   └── ui-components/     # SuperDesign components
└── public/                # Static assets
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- **Live App**: [vortex-protocol.vercel.app](https://vortex-protocol.vercel.app)
- **GitHub**: [github.com/2049foto/Vortex-](https://github.com/2049foto/Vortex-)
- **Base Ecosystem**: [base.org](https://base.org)

---

<div align="center">

Built for the Base ecosystem 🔵

</div>
