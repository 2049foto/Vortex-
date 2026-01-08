/**
 * Mock data for VORTEX PROTOCOL development and testing
 */

import { Asset, UserStats, Activity, ConsolidationRoute, ConsolidationStep, Settings } from '../types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    balance: '0.0234',
    valueUSD: 56.12,
    chainId: 8453,
    tier: 'LEGIT',
    liquidity: 'high',
  },
  {
    id: '2',
    name: 'USD Coin',
    symbol: 'USDC',
    balance: '125.50',
    valueUSD: 125.50,
    chainId: 8453,
    tier: 'LEGIT',
    liquidity: 'high',
  },
  {
    id: '3',
    name: 'Random Airdrop',
    symbol: 'RAIRD',
    balance: '10000',
    valueUSD: 0.85,
    chainId: 8453,
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    tier: 'DUST',
    liquidity: 'low',
  },
  {
    id: '4',
    name: 'MicroToken',
    symbol: 'MICRO',
    balance: '999999',
    valueUSD: 0.02,
    chainId: 1,
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    tier: 'MICRODUST',
    liquidity: 'none',
  },
  {
    id: '5',
    name: 'Scam Token',
    symbol: 'SCAM',
    balance: '1000000',
    valueUSD: 0.00,
    chainId: 137,
    contractAddress: '0xdeadbeef1234567890abcdef1234567890abcdef',
    tier: 'RISK_SCAM',
    liquidity: 'none',
    riskDetails: {
      score: 95,
      confidence: 88,
      factors: [
        {
          name: 'Honeypot Detected',
          description: 'Token cannot be sold after purchase',
          severity: 'critical',
        },
        {
          name: 'Owner Can Modify Tax',
          description: 'Contract owner can change transaction fees',
          severity: 'high',
        },
        {
          name: 'Hidden Mint Function',
          description: 'Owner can mint unlimited tokens',
          severity: 'critical',
        },
      ],
    },
  },
  {
    id: '6',
    name: 'Dust Coin',
    symbol: 'DUST',
    balance: '50000',
    valueUSD: 1.25,
    chainId: 42161,
    contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
    tier: 'DUST',
    liquidity: 'medium',
  },
  {
    id: '7',
    name: 'Tiny Token',
    symbol: 'TINY',
    balance: '100000000',
    valueUSD: 0.05,
    chainId: 10,
    contractAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    tier: 'MICRODUST',
    liquidity: 'low',
  },
];

export const MOCK_USER_STATS: UserStats = {
  xp: 1250,
  level: 5,
  dustFoundUSD: 156.78,
  baseTVLAdded: 234.50,
  portfoliosCleaned: 12,
  streak: 7,
};

export const MOCK_ACTIVITY: Activity[] = [
  {
    id: '1',
    type: 'consolidate',
    chainId: 8453,
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    amountUSD: 45.67,
    status: 'complete',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    id: '2',
    type: 'scan',
    chainId: 1,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    amountUSD: 0,
    status: 'complete',
  },
  {
    id: '3',
    type: 'claim',
    chainId: 8453,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    amountUSD: 25.00,
    status: 'complete',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: '4',
    type: 'consolidate',
    chainId: 137,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    amountUSD: 12.34,
    status: 'complete',
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  },
];

export const MOCK_ROUTES: ConsolidationRoute[] = [
  {
    id: '1',
    name: '1inch',
    estimatedOutput: '0.0234',
    estimatedGas: '$0.00',
    priceImpact: 0.15,
    isRecommended: true,
  },
  {
    id: '2',
    name: 'Uniswap V4',
    estimatedOutput: '0.0231',
    estimatedGas: '$0.00',
    priceImpact: 0.22,
    isRecommended: false,
  },
  {
    id: '3',
    name: '0x Protocol',
    estimatedOutput: '0.0228',
    estimatedGas: '$0.00',
    priceImpact: 0.35,
    isRecommended: false,
  },
];

export const MOCK_CONSOLIDATION_STEPS: ConsolidationStep[] = [
  {
    id: '1',
    label: 'Simulating',
    description: 'Running Tenderly simulation',
    status: 'pending',
  },
  {
    id: '2',
    label: 'Approving',
    description: 'Approving token transfers',
    status: 'pending',
  },
  {
    id: '3',
    label: 'Swapping',
    description: 'Executing swap transactions',
    status: 'pending',
  },
  {
    id: '4',
    label: 'Finalizing',
    description: 'Confirming on-chain',
    status: 'pending',
  },
];

export const MOCK_SETTINGS: Settings = {
  autoRefresh: true,
  refreshInterval: 30,
  defaultOutputToken: 'ETH',
  slippageTolerance: 0.5,
  enableNotifications: true,
  theme: 'dark',
};

