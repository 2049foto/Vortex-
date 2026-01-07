/**
 * Vortex Protocol - Risk Scoring Service
 * 20-layer risk assessment system
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS, CACHE_TTL } from '../config/constants';
import type { TokenHolding } from './portfolioService';
import { Redis } from '@upstash/redis';

const logger = createLogger('risk-scoring');

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export type TokenTier = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';

export interface RiskScore {
  // Overall
  tier: TokenTier;
  totalScore: number; // 0-100 (100 = highest risk)
  
  // 20 Risk Layers
  layers: {
    // 1. Security & Contract Risks (30 points)
    isHoneypot: boolean; // 10 points
    hasRenounced: boolean; // -5 points (good)
    hasProxy: boolean; // 5 points
    hasBlacklist: boolean; // 5 points
    hasMintFunction: boolean; // 5 points
    hasHiddenOwner: boolean; // 5 points
    
    // 2. Liquidity Risks (20 points)
    liquidityUsd: number;
    liquidityScore: number; // 0-10 points (low liquidity = high risk)
    isLiquidityLocked: boolean; // -5 points (good)
    liquidityPoolAge: number; // days
    
    // 3. Trading Risks (15 points)
    buyTax: number; // percentage
    sellTax: number; // percentage
    taxScore: number; // 0-10 points (high tax = risk)
    canBeSold: boolean; // 5 points if false
    
    // 4. Market Signals (15 points)
    holderCount: number;
    topHolderPercentage: number;
    concentrationScore: number; // 0-5 points
    priceChange24h: number;
    volumeChange24h: number;
    volatilityScore: number; // 0-5 points
    
    // 5. Token Economics (10 points)
    totalSupply: string;
    circulatingSupply: string;
    supplyScore: number; // 0-5 points
    isUnlimitedSupply: boolean; // 5 points
    
    // 6. Social & Reputation (10 points)
    hasWebsite: boolean;
    hasTwitter: boolean;
    hasVerifiedContract: boolean;
    contractAge: number; // days
    reputationScore: number; // 0-10 points
  };
  
  reasons: string[];
  recommendations: string[];
}

/**
 * Calculate risk score for a token (20 layers)
 */
export async function calculateRiskScore(
  token: TokenHolding
): Promise<RiskScore> {
  const cacheKey = `risk:${token.chainId}:${token.address}`;
  
  // Check cache (5 minutes)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
  } catch (error) {
    logger.warn({ error }, 'Cache read failed');
  }

  try {
    // Fetch security data
    const securityData = await fetchSecurityData(token);
    const liquidityData = await fetchLiquidityData(token);
    const holderData = await fetchHolderData(token);

    // Calculate layer scores
    const layers = {
      // Layer 1: Security & Contract Risks
      isHoneypot: securityData.isHoneypot,
      hasRenounced: securityData.hasRenounced,
      hasProxy: securityData.hasProxy,
      hasBlacklist: securityData.hasBlacklist,
      hasMintFunction: securityData.hasMintFunction,
      hasHiddenOwner: securityData.hasHiddenOwner,
      
      // Layer 2: Liquidity Risks
      liquidityUsd: liquidityData.liquidityUsd,
      liquidityScore: calculateLiquidityScore(liquidityData.liquidityUsd),
      isLiquidityLocked: liquidityData.isLocked,
      liquidityPoolAge: liquidityData.poolAgeDays,
      
      // Layer 3: Trading Risks
      buyTax: securityData.buyTax,
      sellTax: securityData.sellTax,
      taxScore: calculateTaxScore(securityData.buyTax, securityData.sellTax),
      canBeSold: securityData.canBeSold,
      
      // Layer 4: Market Signals
      holderCount: holderData.holderCount,
      topHolderPercentage: holderData.topHolderPercentage,
      concentrationScore: calculateConcentrationScore(holderData.topHolderPercentage),
      priceChange24h: token.priceUsd || 0,
      volumeChange24h: token.volume24hUsd || 0,
      volatilityScore: calculateVolatilityScore(token),
      
      // Layer 5: Token Economics
      totalSupply: holderData.totalSupply,
      circulatingSupply: holderData.circulatingSupply,
      supplyScore: calculateSupplyScore(holderData),
      isUnlimitedSupply: securityData.hasMintFunction && !securityData.hasRenounced,
      
      // Layer 6: Social & Reputation
      hasWebsite: securityData.hasWebsite,
      hasTwitter: securityData.hasTwitter,
      hasVerifiedContract: securityData.isVerified,
      contractAge: securityData.contractAgeDays,
      reputationScore: calculateReputationScore(securityData),
    };

    // Calculate total risk score (0-100)
    let totalScore = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Security risks (max 30 points)
    if (layers.isHoneypot) {
      totalScore += 10;
      reasons.push('🚨 Honeypot detected');
      recommendations.push('DO NOT SELL - High risk of losing funds');
    }
    if (!layers.hasRenounced) totalScore += 5;
    if (layers.hasProxy) {
      totalScore += 5;
      reasons.push('Upgradeable proxy contract');
    }
    if (layers.hasBlacklist) {
      totalScore += 5;
      reasons.push('Has blacklist function');
    }
    if (layers.hasMintFunction) {
      totalScore += 5;
      reasons.push('Has mint function');
    }
    if (layers.hasHiddenOwner) {
      totalScore += 5;
      reasons.push('Hidden or suspicious owner');
    }

    // Liquidity risks (max 20 points)
    totalScore += layers.liquidityScore;
    if (layers.liquidityUsd < 1000) {
      reasons.push(`Very low liquidity: $${layers.liquidityUsd.toFixed(2)}`);
      recommendations.push('Wait for more liquidity before trading');
    }
    if (!layers.isLiquidityLocked) {
      totalScore += 5;
      reasons.push('Liquidity not locked');
    }

    // Trading risks (max 15 points)
    totalScore += layers.taxScore;
    if (layers.buyTax > 5 || layers.sellTax > 5) {
      reasons.push(`High tax: ${layers.buyTax}% buy / ${layers.sellTax}% sell`);
    }
    if (!layers.canBeSold) {
      totalScore += 5;
      reasons.push('⛔ Cannot be sold (honeypot)');
    }

    // Market concentration risks (max 15 points)
    totalScore += layers.concentrationScore;
    totalScore += layers.volatilityScore;
    if (layers.topHolderPercentage > 50) {
      reasons.push(`High concentration: top holder owns ${layers.topHolderPercentage}%`);
    }
    if (layers.holderCount < 100) {
      reasons.push(`Low holder count: ${layers.holderCount}`);
    }

    // Supply risks (max 10 points)
    totalScore += layers.supplyScore;
    if (layers.isUnlimitedSupply) {
      totalScore += 5;
      reasons.push('Unlimited supply (mintable)');
    }

    // Reputation risks (max 10 points)
    totalScore += 10 - layers.reputationScore;
    if (layers.contractAge < 7) {
      reasons.push(`Very new contract: ${layers.contractAge} days old`);
      recommendations.push('Be cautious with new tokens');
    }

    // Determine tier
    let tier: TokenTier = 'LEGIT';
    
    if (totalScore >= 70 || layers.isHoneypot || !layers.canBeSold) {
      tier = 'RISK';
    } else if (token.valueUsd < 0.1) {
      tier = 'MICRODUST';
    } else if (token.valueUsd < 10) {
      tier = 'DUST';
    } else if (totalScore >= 40) {
      tier = 'DUST';
    }

    // Add value-based reasons
    if (token.valueUsd < 0.1) {
      reasons.push(`Microdust value: $${token.valueUsd.toFixed(4)}`);
      recommendations.push('Consider consolidating to save on gas');
    } else if (token.valueUsd < 10) {
      reasons.push(`Dust value: $${token.valueUsd.toFixed(2)}`);
    }

    const riskScore: RiskScore = {
      tier,
      totalScore: Math.min(100, totalScore),
      layers,
      reasons,
      recommendations,
    };

    // Cache for 5 minutes
    try {
      await redis.setex(cacheKey, CACHE_TTL.RISK_SCORE, JSON.stringify(riskScore));
    } catch (error) {
      logger.warn({ error }, 'Cache write failed');
    }

    return riskScore;
  } catch (error) {
    logger.error({ error, token: token.address }, 'Risk scoring failed');
    
    // Fallback: simple tier based on value
    return {
      tier: token.valueUsd < 0.1 ? 'MICRODUST' : token.valueUsd < 10 ? 'DUST' : 'LEGIT',
      totalScore: 0,
      layers: {} as any,
      reasons: ['Risk analysis unavailable'],
      recommendations: [],
    };
  }
}

/**
 * Fetch security data from GoPlus
 */
async function fetchSecurityData(token: TokenHolding): Promise<any> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_GOPLUS_API_URL || 'https://api.gopluslabs.io/api/v1'}/token_security/${token.chainId}?contract_addresses=${token.address}`,
      {
        signal: AbortSignal.timeout(TIMEOUTS.API),
      }
    );

    if (!response.ok) {
      throw new Error('GoPlus API error');
    }

    const data = await response.json();
    const tokenData = data.result?.[token.address.toLowerCase()] || {};

    return {
      isHoneypot: tokenData.is_honeypot === '1',
      hasRenounced: tokenData.is_open_source === '1' && tokenData.owner_address === '0x0000000000000000000000000000000000000000',
      hasProxy: tokenData.is_proxy === '1',
      hasBlacklist: tokenData.is_blacklisted === '1',
      hasMintFunction: tokenData.is_mintable === '1',
      hasHiddenOwner: tokenData.hidden_owner === '1',
      buyTax: parseFloat(tokenData.buy_tax || '0'),
      sellTax: parseFloat(tokenData.sell_tax || '0'),
      canBeSold: tokenData.cannot_sell_all !== '1',
      hasWebsite: !!tokenData.website,
      hasTwitter: !!tokenData.twitter,
      isVerified: tokenData.is_open_source === '1',
      contractAgeDays: 0, // TODO: Calculate from creation block
    };
  } catch (error) {
    logger.warn({ error, token: token.address }, 'Security data fetch failed');
    return {
      isHoneypot: false,
      hasRenounced: false,
      hasProxy: false,
      hasBlacklist: false,
      hasMintFunction: false,
      hasHiddenOwner: false,
      buyTax: 0,
      sellTax: 0,
      canBeSold: true,
      hasWebsite: false,
      hasTwitter: false,
      isVerified: false,
      contractAgeDays: 0,
    };
  }
}

/**
 * Fetch liquidity data
 */
async function fetchLiquidityData(token: TokenHolding): Promise<any> {
  return {
    liquidityUsd: token.liquidityUsd || 0,
    isLocked: false,
    poolAgeDays: 0,
  };
}

/**
 * Fetch holder data
 */
async function fetchHolderData(token: TokenHolding): Promise<any> {
  return {
    holderCount: 0,
    topHolderPercentage: 0,
    totalSupply: '0',
    circulatingSupply: '0',
  };
}

/**
 * Helper scoring functions
 */
function calculateLiquidityScore(liquidityUsd: number): number {
  if (liquidityUsd < 100) return 10;
  if (liquidityUsd < 1000) return 8;
  if (liquidityUsd < 10000) return 5;
  if (liquidityUsd < 100000) return 2;
  return 0;
}

function calculateTaxScore(buyTax: number, sellTax: number): number {
  const maxTax = Math.max(buyTax, sellTax);
  if (maxTax > 20) return 10;
  if (maxTax > 10) return 7;
  if (maxTax > 5) return 4;
  return 0;
}

function calculateConcentrationScore(topHolderPercentage: number): number {
  if (topHolderPercentage > 80) return 5;
  if (topHolderPercentage > 50) return 3;
  if (topHolderPercentage > 30) return 1;
  return 0;
}

function calculateVolatilityScore(token: TokenHolding): number {
  // Simplified - production should use historical price data
  return 0;
}

function calculateSupplyScore(holderData: any): number {
  // Simplified supply check
  return 0;
}

function calculateReputationScore(securityData: any): number {
  let score = 0;
  if (securityData.hasWebsite) score += 2;
  if (securityData.hasTwitter) score += 2;
  if (securityData.isVerified) score += 3;
  if (securityData.contractAgeDays > 30) score += 3;
  return score;
}

/**
 * Batch calculate risk scores
 */
export async function batchCalculateRiskScores(
  tokens: TokenHolding[]
): Promise<Map<string, RiskScore>> {
  const results = await Promise.allSettled(
    tokens.map((token) => calculateRiskScore(token))
  );

  const scoreMap = new Map<string, RiskScore>();
  
  tokens.forEach((token, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      scoreMap.set(`${token.chainId}:${token.address}`, result.value);
    }
  });

  return scoreMap;
}

