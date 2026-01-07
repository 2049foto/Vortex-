/**
 * Vortex Protocol - Application Constants
 */

// ============================================
// TIERS & THRESHOLDS
// ============================================
export const TIER_THRESHOLDS = {
  LEGIT: {
    minValueUsd: 10,
    maxRiskScore: 20,
  },
  DUST: {
    minValueUsd: 0.10,
    maxValueUsd: 10,
    maxRiskScore: 50,
  },
  MICRODUST: {
    maxValueUsd: 0.10,
    maxRiskScore: 75,
  },
  RISK_SCAM: {
    minRiskScore: 76,
  },
} as const;

// ============================================
// RISK LAYER WEIGHTS (Phase 1.1 - 12 layers)
// ============================================
export const RISK_LAYER_WEIGHTS = {
  layer1_audit: 0.10, // 10%
  layer2_concentration: 0.12, // 12%
  layer3_honeypot: 0.15, // 15%
  layer4_rugpull: 0.12, // 12%
  layer5_dev_wallet: 0.08, // 8%
  layer6_sentiment: 0.07, // 7%
  layer7_volume_trend: 0.08, // 8%
  layer8_cex_listings: 0.10, // 10%
  layer9_liquidity: 0.10, // 10%
  layer10_volatility: 0.05, // 5%
  layer11_age: 0.03, // 3%
  layer12_social: 0.00, // 0% (bonus)
  // Phase 1.2 - Advanced layers (add later)
  layer13_flash_loan: 0.00,
  layer14_bridge_risk: 0.00,
  layer15_insider_trading: 0.00,
  layer16_regulatory: 0.00,
  layer17_validator_centralization: 0.00,
  layer18_composability: 0.00,
  layer19_exploit_history: 0.00,
  layer20_ml_anomaly: 0.00,
} as const;

// ============================================
// SUPPORTED CHAINS (Phase 1)
// ============================================
export const SUPPORTED_CHAINS = {
  ETHEREUM: { chainId: 1, name: 'Ethereum', nativeToken: 'ETH' },
  BASE: { chainId: 8453, name: 'Base', nativeToken: 'ETH' },
  ARBITRUM: { chainId: 42161, name: 'Arbitrum', nativeToken: 'ETH' },
  OPTIMISM: { chainId: 10, name: 'Optimism', nativeToken: 'ETH' },
  POLYGON: { chainId: 137, name: 'Polygon', nativeToken: 'MATIC' },
  BNB: { chainId: 56, name: 'BNB Chain', nativeToken: 'BNB' },
  AVALANCHE: { chainId: 43114, name: 'Avalanche', nativeToken: 'AVAX' },
  MONAD: { chainId: 838592, name: 'Monad', nativeToken: 'MONAD' },
  ZKSYNC: { chainId: 324, name: 'zkSync Era', nativeToken: 'ETH' },
  SOLANA: { chainId: -1, name: 'Solana', nativeToken: 'SOL' }, // Special handling
} as const;

// Primary output chain (Base)
export const OUTPUT_CHAIN_ID = 8453;
export const OUTPUT_TOKENS = ['ETH', 'USDC'] as const;

// ============================================
// PLATFORM FEES
// ============================================
export const PLATFORM_FEE_PERCENT = 0.8; // 0.8%
export const MIN_FEE_PERCENT = 0.2;
export const MAX_FEE_PERCENT = 0.6;

// ============================================
// CONSOLIDATION LIMITS
// ============================================
export const MIN_SWAP_VALUE_USD = 1;
export const MIN_DUST_VALUE_USD = 0.1;
export const MAX_BATCH_SIZE = 20;
export const BRIDGE_COST_THRESHOLD_PERCENT = 5; // Don't bridge if cost > 5% of value

// ============================================
// RATE LIMITING
// ============================================
export const RATE_LIMITS = {
  SCAN: {
    windowMs: 60_000, // 1 minute
    max: 10, // 10 requests per minute
  },
  SWAP: {
    windowMs: 60_000,
    max: 5, // 5 swaps per minute
  },
  STATUS: {
    windowMs: 60_000,
    max: 30, // 30 status checks per minute
  },
  ANALYTICS: {
    windowMs: 60_000,
    max: 20, // 20 requests per minute
  },
} as const;

// ============================================
// TIMEOUTS
// ============================================
export const TIMEOUTS = {
  SCAN: 10_000, // 10 seconds
  SWAP: 30_000, // 30 seconds
  SIMULATION: 5_000, // 5 seconds
  RPC: 3_000, // 3 seconds
  API: 5_000, // 5 seconds
} as const;

// ============================================
// CACHE TTL (seconds)
// ============================================
export const CACHE_TTL = {
  TOKEN_CLASSIFICATION: 86400, // 24 hours
  TOKEN_PRICE: 60, // 1 minute
  RISK_SCORE: 3600, // 1 hour
  USER_PROFILE: 600, // 10 minutes
  ANALYTICS: 300, // 5 minutes
} as const;

// ============================================
// RETRY CONFIG
// ============================================
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_FACTOR: 2,
} as const;

// ============================================
// ROUTERS
// ============================================
export const ROUTERS = {
  ONEINCH: '1inch',
  UNISWAP_V4: 'uniswap_v4',
  CURVE: 'curve',
  BALANCER: 'balancer',
} as const;

// ============================================
// PAYMASTERS
// ============================================
export const PAYMASTERS = {
  PIMLICO: 'pimlico',
  COINBASE: 'coinbase',
} as const;

// ============================================
// STATUS CODES
// ============================================
export const CONSOLIDATION_STATUS = {
  PENDING: 'PENDING',
  SIMULATING: 'SIMULATING',
  BUNDLING: 'BUNDLING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
} as const;

