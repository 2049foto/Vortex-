/**
 * Type definitions for VORTEX PROTOCOL UI Components
 */

export type RiskTier = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK_SCAM';

export type OutputToken = 'ETH' | 'USDC';

export interface Chain {
  id: string;
  chainId: number;
  name: string;
  icon: string;
  nativeCurrency: string;
  rpcUrl?: string;
  blockExplorer?: string;
}

export interface RiskFactor {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RiskDetails {
  score: number;
  confidence: number;
  factors: RiskFactor[];
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
  chainId: number;
  contractAddress?: string;
  tier: RiskTier;
  liquidity: 'high' | 'medium' | 'low' | 'none';
  riskDetails?: RiskDetails;
  logoUrl?: string;
}

export interface ConsolidationRoute {
  id: string;
  name: string;
  estimatedOutput: string;
  estimatedGas: string;
  priceImpact: number;
  isRecommended: boolean;
}

export interface ConsolidationStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface UserStats {
  xp: number;
  level: number;
  dustFoundUSD: number;
  baseTVLAdded: number;
  portfoliosCleaned: number;
  streak: number;
}

export interface Activity {
  id: string;
  type: 'consolidate' | 'scan' | 'claim';
  chainId: number;
  date: Date;
  amountUSD: number;
  status: 'pending' | 'complete' | 'failed';
  txHash?: string;
}

export interface Settings {
  autoRefresh: boolean;
  refreshInterval: number;
  defaultOutputToken: OutputToken;
  slippageTolerance: number;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

