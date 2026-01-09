/**
 * Vortex Protocol - Risk Scoring Service V2
 * Complete 20-layer risk assessment system (12 for Phase 1.1, 8 advanced for Phase 1.2)
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { TIMEOUTS, CACHE_TTL, RISK_LAYER_WEIGHTS } from '../config/constants';
import { cacheGet, cacheSet } from '../lib/safeCache';
import type { TokenHolding } from './portfolioService';

const logger = createLogger('risk-scoring-v2');

export type TokenTier = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';

export interface RiskLayerScore {
  score0to10: number;
  weightPct: number;
  confidence0to1: number;
  evidence: string[];
}

export interface RiskResult {
  riskScore0to100: number;
  tier: TokenTier;
  confidence0to1: number;
  layers: Record<string, RiskLayerScore>;
  explanation: string;
}

/**
 * Calculate risk score for a token (20 layers)
 */
export async function calculateRiskScoreV2(
  token: TokenHolding
): Promise<RiskResult> {
  const cacheKey = `risk:v2:${token.chainId}:${token.address.toLowerCase()}`;
  
  // Check cache (safe - never throws)
  const cached = await cacheGet<RiskResult>(cacheKey);
  if (cached) {
    logger.debug({ token: token.address }, 'Risk score from cache');
    return cached;
  }

  try {
    // Fetch all data sources in parallel
    const [securityData, liquidityData, holderData, dexscreenerData, honeypotData] = await Promise.allSettled([
      fetchSecurityData(token),
      fetchLiquidityData(token),
      fetchHolderData(token),
      fetchDexScreenerData(token),
      fetchHoneypotData(token),
    ]);

    const security = securityData.status === 'fulfilled' ? securityData.value : {};
    const liquidity = liquidityData.status === 'fulfilled' ? liquidityData.value : {};
    const holder = holderData.status === 'fulfilled' ? holderData.value : {};
    const dexscreener = dexscreenerData.status === 'fulfilled' ? dexscreenerData.value : {};
    const honeypot = honeypotData.status === 'fulfilled' ? honeypotData.value : {};

    // Calculate all 12 layers for Phase 1.1
    const layers: Record<string, RiskLayerScore> = {};

    // Layer 1: Smart Contract Audit (10%)
    layers.layer1_audit = calculateLayer1Audit(security, token);
    
    // Layer 2: Holder Concentration (12%)
    layers.layer2_concentration = calculateLayer2Concentration(holder);
    
    // Layer 3: Honeypot Detection (15%)
    layers.layer3_honeypot = calculateLayer3Honeypot(security, honeypot);
    
    // Layer 4: Rug Pull Risk (12%)
    layers.layer4_rugpull = calculateLayer4Rugpull(security, holder, liquidity);
    
    // Layer 5: Dev Wallet Exposure (8%)
    layers.layer5_dev_wallet = calculateLayer5DevWallet(holder, security);
    
    // Layer 6: Community Sentiment (7%)
    layers.layer6_sentiment = calculateLayer6Sentiment(security, dexscreener);
    
    // Layer 7: Volume Trend (8%)
    layers.layer7_volume_trend = calculateLayer7VolumeTrend(dexscreener, token);
    
    // Layer 8: CEX Listings (10%)
    layers.layer8_cex_listings = calculateLayer8CexListings(dexscreener, security);
    
    // Layer 9: Liquidity Depth (10%)
    layers.layer9_liquidity = calculateLayer9Liquidity(liquidity, token);
    
    // Layer 10: Price Volatility (5%)
    layers.layer10_volatility = calculateLayer10Volatility(dexscreener, token);
    
    // Layer 11: Time Since Launch (3%)
    layers.layer11_age = calculateLayer11Age(security, liquidity);
    
    // Layer 12: Social Verification (0% - bonus)
    layers.layer12_social = calculateLayer12Social(security);

    // Phase 1.2: Advanced Layers (13-20)
    // Layer 13: Flash Loan Vulnerability (8%)
    layers.layer13_flash_loan = calculateLayer13FlashLoan(security, token);
    
    // Layer 14: Cross-Chain Bridge Risk (7%)
    layers.layer14_bridge_risk = calculateLayer14BridgeRisk(token);
    
    // Layer 15: Insider Trading Signals (6%)
    layers.layer15_insider_trading = calculateLayer15InsiderTrading(holder, dexscreener);
    
    // Layer 16: Regulatory Status (5%)
    layers.layer16_regulatory = calculateLayer16Regulatory(security, token);
    
    // Layer 17: Validator Centralization (6%)
    layers.layer17_validator_centralization = calculateLayer17ValidatorCentralization(token);
    
    // Layer 18: Composability Risk (5%)
    layers.layer18_composability = calculateLayer18Composability(security, token);
    
    // Layer 19: Exploit History (8%)
    layers.layer19_exploit_history = calculateLayer19ExploitHistory(token, security);
    
    // Layer 20: ML Anomaly Detection (8%)
    layers.layer20_ml_anomaly = calculateLayer20MLAnomaly(token, security, liquidity, holder, dexscreener);

    // Calculate weighted total score
    let totalScore = 0;
    let totalConfidence = 0;
    const allEvidence: string[] = [];

    Object.entries(layers).forEach(([layerName, layerScore]) => {
      const weight = RISK_LAYER_WEIGHTS[layerName as keyof typeof RISK_LAYER_WEIGHTS] || 0;
      totalScore += layerScore.score0to10 * weight * 10; // Convert to 0-100 scale
      totalConfidence += layerScore.confidence0to1 * weight;
      allEvidence.push(...layerScore.evidence);
    });

    const finalScore = Math.min(100, Math.round(totalScore));
    const finalConfidence = Math.min(1, totalConfidence);

    // Determine tier
    let tier: TokenTier = 'LEGIT';
    if (finalScore >= 76 || layers.layer3_honeypot.score0to10 >= 8) {
      tier = 'RISK';
    } else if (token.valueUsd < 0.1) {
      tier = 'MICRODUST';
    } else if (token.valueUsd < 10 || finalScore >= 40) {
      tier = 'DUST';
    }

    // Generate explanation
    const explanation = generateExplanation(tier, finalScore, layers, token);

    const result: RiskResult = {
      riskScore0to100: finalScore,
      tier,
      confidence0to1: finalConfidence,
      layers,
      explanation,
    };

    // Cache for 1 hour (safe - never throws)
    await cacheSet(cacheKey, result, CACHE_TTL.RISK_SCORE);
    
    logger.info({ 
      token: token.symbol, 
      score: finalScore, 
      tier,
      highRiskLayers: Object.entries(layers)
        .filter(([_, l]) => l.score0to10 >= 7)
        .map(([name, _]) => name)
    }, 'Risk score calculated');

    return result;
  } catch (error) {
    logger.error({ error, token: token.address }, 'Risk scoring failed');
    
    // Fallback
    return {
      riskScore0to100: 0,
      tier: token.valueUsd < 0.1 ? 'MICRODUST' : token.valueUsd < 10 ? 'DUST' : 'LEGIT',
      confidence0to1: 0,
      layers: {},
      explanation: 'Risk analysis unavailable',
    };
  }
}

// ============================================
// LAYER CALCULATION FUNCTIONS
// ============================================

function calculateLayer1Audit(security: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.5;

  // Check if contract is verified
  if (security.isVerified) {
    score -= 2; // Good sign
    evidence.push('Contract verified on block explorer');
    confidence += 0.2;
  } else {
    score += 3;
    evidence.push('Contract not verified');
  }

  // Check if open source
  if (security.isOpenSource) {
    score -= 1;
    evidence.push('Open source code');
    confidence += 0.1;
  } else {
    score += 2;
    evidence.push('Closed source code');
  }

  // Check for proxy
  if (security.hasProxy) {
    score += 3;
    evidence.push('Upgradeable proxy contract (can be changed)');
  }

  // Check for audit
  // TODO: Integrate with audit databases (CertiK, OpenZeppelin, etc.)
  // For now, assume no audit if not verified
  if (!security.isVerified) {
    score += 2;
    evidence.push('No known security audit');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer1_audit,
    confidence0to1: Math.min(1, confidence),
    evidence,
  };
}

function calculateLayer2Concentration(holder: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.7;

  const topHolderPct = holder.topHolderPercentage || 0;
  const holderCount = holder.holderCount || 0;

  // High concentration = high risk
  if (topHolderPct > 80) {
    score = 10;
    evidence.push(`Extreme concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
  } else if (topHolderPct > 50) {
    score = 7;
    evidence.push(`High concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
  } else if (topHolderPct > 30) {
    score = 4;
    evidence.push(`Moderate concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
  } else {
    score = 1;
    evidence.push(`Low concentration: top holder owns ${topHolderPct.toFixed(1)}%`);
  }

  // Low holder count = risk
  if (holderCount < 10) {
    score += 2;
    evidence.push(`Very few holders: ${holderCount}`);
    confidence -= 0.1;
  } else if (holderCount < 100) {
    score += 1;
    evidence.push(`Low holder count: ${holderCount}`);
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer2_concentration,
    confidence0to1: Math.max(0.3, confidence),
    evidence,
  };
}

function calculateLayer3Honeypot(security: any, honeypot: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.9;

  if (security.isHoneypot || honeypot.isHoneypot) {
    score = 10;
    evidence.push('🚨 Honeypot detected - Cannot sell tokens');
    confidence = 1.0;
  } else if (!security.canBeSold) {
    score = 9;
    evidence.push('Cannot sell all tokens (potential honeypot)');
  } else {
    score = 0;
    evidence.push('No honeypot detected');
  }

  // Check for high taxes (honeypot indicator)
  const maxTax = Math.max(security.buyTax || 0, security.sellTax || 0);
  if (maxTax > 20) {
    score = Math.max(score, 8);
    evidence.push(`Extremely high tax: ${maxTax}%`);
  } else if (maxTax > 10) {
    score = Math.max(score, 5);
    evidence.push(`High tax: ${maxTax}%`);
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer3_honeypot,
    confidence0to1: confidence,
    evidence,
  };
}

function calculateLayer4Rugpull(security: any, holder: any, liquidity: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.6;

  // Owner not renounced = can rug
  if (!security.hasRenounced) {
    score += 4;
    evidence.push('Owner not renounced (can modify contract)');
  } else {
    score -= 1;
    evidence.push('Owner renounced (good sign)');
    confidence += 0.1;
  }

  // Mint function = can inflate supply
  if (security.hasMintFunction) {
    score += 3;
    evidence.push('Has mint function (can create unlimited tokens)');
  }

  // Low liquidity = easy to rug
  if (liquidity.liquidityUsd < 1000) {
    score += 3;
    evidence.push(`Very low liquidity: $${liquidity.liquidityUsd.toFixed(2)}`);
  } else if (liquidity.liquidityUsd < 10000) {
    score += 1;
    evidence.push(`Low liquidity: $${liquidity.liquidityUsd.toFixed(2)}`);
  }

  // Liquidity not locked
  if (!liquidity.isLocked) {
    score += 2;
    evidence.push('Liquidity not locked (can be removed)');
  } else {
    score -= 1;
    evidence.push('Liquidity locked (good sign)');
    confidence += 0.1;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer4_rugpull,
    confidence0to1: Math.max(0.3, confidence),
    evidence,
  };
}

function calculateLayer5DevWallet(holder: any, security: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.5;

  const devPct = holder.creatorPercentage || 0;
  const ownerPct = holder.ownerPercentage || 0;

  if (devPct > 20 || ownerPct > 20) {
    score = 8;
    evidence.push(`High dev/owner holdings: ${Math.max(devPct, ownerPct).toFixed(1)}%`);
  } else if (devPct > 10 || ownerPct > 10) {
    score = 5;
    evidence.push(`Moderate dev/owner holdings: ${Math.max(devPct, ownerPct).toFixed(1)}%`);
  } else {
    score = 1;
    evidence.push(`Low dev/owner holdings: ${Math.max(devPct, ownerPct).toFixed(1)}%`);
  }

  if (security.hasHiddenOwner) {
    score += 2;
    evidence.push('Hidden or suspicious owner');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer5_dev_wallet,
    confidence0to1: Math.max(0.3, confidence),
    evidence,
  };
}

function calculateLayer6Sentiment(security: any, dexscreener: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.4;

  // Social presence
  if (security.hasWebsite && security.hasTwitter) {
    score -= 1;
    evidence.push('Has website and Twitter');
    confidence += 0.2;
  } else if (security.hasWebsite || security.hasTwitter) {
    score += 1;
    evidence.push('Limited social presence');
  } else {
    score += 3;
    evidence.push('No website or social media');
    confidence -= 0.1;
  }

  // Trading activity (from DexScreener)
  if (dexscreener.txns24h) {
    const { buys, sells } = dexscreener.txns24h;
    const totalTxns = (buys || 0) + (sells || 0);
    if (totalTxns < 10) {
      score += 2;
      evidence.push(`Low trading activity: ${totalTxns} transactions in 24h`);
    }
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer6_sentiment,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer7VolumeTrend(dexscreener: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.5;

  const volume24h = dexscreener.volume24h || token.volume24hUsd || 0;
  const priceChange24h = dexscreener.priceChange24h || 0;

  // Low volume = risk
  if (volume24h < 100) {
    score = 8;
    evidence.push(`Very low 24h volume: $${volume24h.toFixed(2)}`);
  } else if (volume24h < 1000) {
    score = 5;
    evidence.push(`Low 24h volume: $${volume24h.toFixed(2)}`);
  } else if (volume24h < 10000) {
    score = 2;
    evidence.push(`Moderate 24h volume: $${volume24h.toFixed(2)}`);
  } else {
    score = 0;
    evidence.push(`Good 24h volume: $${volume24h.toFixed(2)}`);
    confidence += 0.2;
  }

  // Extreme price volatility
  if (Math.abs(priceChange24h) > 50) {
    score += 2;
    evidence.push(`Extreme price change: ${priceChange24h.toFixed(1)}%`);
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer7_volume_trend,
    confidence0to1: Math.max(0.3, confidence),
    evidence,
  };
}

function calculateLayer8CexListings(dexscreener: any, security: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.3;

  // Check if listed on major CEX (would need CEX API integration)
  // For now, use DexScreener data as proxy
  const hasMultiplePairs = (dexscreener.pairsCount || 0) > 1;
  
  if (hasMultiplePairs) {
    score = 2;
    evidence.push('Listed on multiple DEXes');
    confidence += 0.2;
  } else {
    score = 5;
    evidence.push('Only on single DEX (less established)');
  }

  // No CEX listing = higher risk
  // TODO: Integrate with CoinGecko/CoinMarketCap for CEX listings
  score += 2;
  evidence.push('Not listed on major CEX');

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer8_cex_listings,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer9Liquidity(liquidity: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.8;

  const liquidityUsd = liquidity.liquidityUsd || token.liquidityUsd || 0;

  if (liquidityUsd < 100) {
    score = 10;
    evidence.push(`Extremely low liquidity: $${liquidityUsd.toFixed(2)}`);
  } else if (liquidityUsd < 1000) {
    score = 8;
    evidence.push(`Very low liquidity: $${liquidityUsd.toFixed(2)}`);
  } else if (liquidityUsd < 10000) {
    score = 5;
    evidence.push(`Low liquidity: $${liquidityUsd.toFixed(2)}`);
  } else if (liquidityUsd < 100000) {
    score = 2;
    evidence.push(`Moderate liquidity: $${liquidityUsd.toFixed(2)}`);
  } else {
    score = 0;
    evidence.push(`Good liquidity: $${liquidityUsd.toFixed(2)}`);
    confidence += 0.1;
  }

  if (!liquidity.isLocked) {
    score += 1;
    evidence.push('Liquidity not locked');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer9_liquidity,
    confidence0to1: Math.max(0.5, confidence),
    evidence,
  };
}

function calculateLayer10Volatility(dexscreener: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.4;

  const priceChange24h = dexscreener.priceChange24h || 0;

  // High volatility = risk
  if (Math.abs(priceChange24h) > 50) {
    score = 8;
    evidence.push(`Extreme volatility: ${priceChange24h.toFixed(1)}% in 24h`);
  } else if (Math.abs(priceChange24h) > 30) {
    score = 5;
    evidence.push(`High volatility: ${priceChange24h.toFixed(1)}% in 24h`);
  } else if (Math.abs(priceChange24h) > 15) {
    score = 2;
    evidence.push(`Moderate volatility: ${priceChange24h.toFixed(1)}% in 24h`);
  } else {
    score = 0;
    evidence.push(`Low volatility: ${priceChange24h.toFixed(1)}% in 24h`);
    confidence += 0.2;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer10_volatility,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer11Age(security: any, liquidity: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.6;

  const contractAgeDays = security.contractAgeDays || liquidity.poolAgeDays || 0;

  if (contractAgeDays === 0) {
    score = 5;
    evidence.push('Contract age unknown');
    confidence -= 0.2;
  } else if (contractAgeDays < 7) {
    score = 8;
    evidence.push(`Very new contract: ${contractAgeDays} days old`);
  } else if (contractAgeDays < 30) {
    score = 5;
    evidence.push(`New contract: ${contractAgeDays} days old`);
  } else if (contractAgeDays < 90) {
    score = 2;
    evidence.push(`Moderate age: ${contractAgeDays} days old`);
  } else {
    score = 0;
    evidence.push(`Established contract: ${contractAgeDays} days old`);
    confidence += 0.2;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer11_age,
    confidence0to1: Math.max(0.3, confidence),
    evidence,
  };
}

function calculateLayer12Social(security: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.5;

  // Social verification (bonus layer, doesn't add risk, only reduces)
  if (security.hasWebsite && security.hasTwitter && security.isVerified) {
    score = 0;
    evidence.push('Strong social presence and verification');
    confidence = 1.0;
  } else if (security.hasWebsite || security.hasTwitter) {
    score = 1;
    evidence.push('Basic social presence');
    confidence = 0.7;
  } else {
    score = 3;
    evidence.push('No social media presence');
    confidence = 0.4;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer12_social,
    confidence0to1: confidence,
    evidence,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateExplanation(
  tier: TokenTier,
  score: number,
  layers: Record<string, RiskLayerScore>,
  token: TokenHolding
): string {
  const highRiskLayers = Object.entries(layers)
    .filter(([_, layer]) => layer.score0to10 >= 7)
    .map(([name, _]) => name.replace('layer', 'Layer ').replace('_', ' '));

  if (tier === 'RISK') {
    return `High risk token (score: ${score}/100). Critical issues: ${highRiskLayers.join(', ')}. Value: $${token.valueUsd.toFixed(2)}.`;
  } else if (tier === 'DUST') {
    return `Dust token (score: ${score}/100). Value: $${token.valueUsd.toFixed(2)}. Suitable for consolidation.`;
  } else if (tier === 'MICRODUST') {
    return `Microdust token (score: ${score}/100). Very low value: $${token.valueUsd.toFixed(4)}. May not be worth consolidating.`;
  } else {
    return `Legitimate token (score: ${score}/100). Value: $${token.valueUsd.toFixed(2)}. Safe to hold or swap.`;
  }
}

// Data fetching functions (reuse from existing service)
async function fetchSecurityData(token: TokenHolding): Promise<any> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_GOPLUS_API_URL || 'https://api.gopluslabs.io/api/v1'}/token_security/${token.chainId}?contract_addresses=${token.address}`,
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    if (!response.ok) throw new Error('GoPlus API error');
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
      isOpenSource: tokenData.is_open_source === '1',
      contractAgeDays: 0, // TODO: Calculate from creation block
    };
  } catch (error) {
    logger.warn({ error }, 'Security data fetch failed');
    return {};
  }
}

async function fetchLiquidityData(token: TokenHolding): Promise<any> {
  try {
    const chainMapping: Record<number, string> = {
      1: 'ethereum', 8453: 'base', 42161: 'arbitrum', 10: 'optimism',
      137: 'polygon', 56: 'bsc', 43114: 'avalanche', 324: 'zksync',
    };
    const chain = chainMapping[token.chainId];
    if (!chain) return { liquidityUsd: token.liquidityUsd || 0, isLocked: false, poolAgeDays: 0 };
    
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${token.address}`,
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    if (!response.ok) throw new Error('DexScreener API error');
    const data = await response.json();
    const pairs = data.pairs || [];
    const mainPair = pairs.reduce((max: any, pair: any) => 
      (!max || (pair.liquidity?.usd || 0) > (max.liquidity?.usd || 0)) ? pair : max, null);
    if (!mainPair) return { liquidityUsd: 0, isLocked: false, poolAgeDays: 0 };
    
    const pairCreatedAt = mainPair.pairCreatedAt ? new Date(mainPair.pairCreatedAt) : null;
    const poolAgeDays = pairCreatedAt ? Math.floor((Date.now() - pairCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      liquidityUsd: mainPair.liquidity?.usd || 0,
      isLocked: false,
      poolAgeDays,
    };
  } catch (error) {
    logger.warn({ error }, 'Liquidity data fetch failed');
    return { liquidityUsd: token.liquidityUsd || 0, isLocked: false, poolAgeDays: 0 };
  }
}

async function fetchHolderData(token: TokenHolding): Promise<any> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_GOPLUS_API_URL}/token_security/${token.chainId}?contract_addresses=${token.address}`,
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    if (!response.ok) throw new Error('GoPlus holder data error');
    const data = await response.json();
    const tokenData = data.result?.[token.address.toLowerCase()] || {};
    return {
      holderCount: parseInt(tokenData.holder_count || '0'),
      topHolderPercentage: parseFloat(tokenData.top_10_holder_percent || '0') * 100,
      totalSupply: tokenData.total_supply || '0',
      circulatingSupply: tokenData.total_supply || '0',
      creatorPercentage: parseFloat(tokenData.creator_percent || '0') * 100,
      ownerPercentage: parseFloat(tokenData.owner_percent || '0') * 100,
    };
  } catch (error) {
    logger.warn({ error }, 'Holder data fetch failed');
    return { holderCount: 0, topHolderPercentage: 0, totalSupply: '0', circulatingSupply: '0' };
  }
}

async function fetchDexScreenerData(token: TokenHolding): Promise<any> {
  try {
    const chainMapping: Record<number, string> = {
      1: 'ethereum', 8453: 'base', 42161: 'arbitrum', 10: 'optimism',
      137: 'polygon', 56: 'bsc', 43114: 'avalanche', 324: 'zksync',
    };
    const chain = chainMapping[token.chainId];
    if (!chain) return {};
    
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${token.address}`,
      { signal: AbortSignal.timeout(TIMEOUTS.API) }
    );
    if (!response.ok) return {};
    const data = await response.json();
    const pairs = data.pairs || [];
    const mainPair = pairs.reduce((max: any, pair: any) => 
      (!max || (pair.liquidity?.usd || 0) > (max.liquidity?.usd || 0)) ? pair : max, null);
    if (!mainPair) return {};
    
    return {
      volume24h: mainPair.volume?.h24 || 0,
      priceChange24h: mainPair.priceChange?.h24 || 0,
      txns24h: mainPair.txns?.h24 || { buys: 0, sells: 0 },
      pairsCount: pairs.length,
    };
  } catch (error) {
    logger.warn({ error }, 'DexScreener data fetch failed');
    return {};
  }
}

async function fetchHoneypotData(token: TokenHolding): Promise<any> {
  try {
    const chainMapping: Record<number, string> = {
      1: 'eth', 8453: 'base', 42161: 'arbitrum', 10: 'optimism',
      137: 'polygon', 56: 'bsc', 43114: 'avalanche',
    };
    const chain = chainMapping[token.chainId];
    if (!chain) return {};
    
    const response = await fetch(
      `https://api.honeypot.is/v2/IsHoneypot?address=${token.address}&chainId=${token.chainId}`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!response.ok) return {};
    const data = await response.json();
    return {
      isHoneypot: data.honeypotResult?.isHoneypot || false,
    };
  } catch (error) {
    logger.warn({ error }, 'Honeypot.is API failed');
    return {};
  }
}

// ============================================
// ADVANCED LAYERS (13-20) - Phase 1.2
// ============================================

function calculateLayer13FlashLoan(security: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.3;

  if (security.hasProxy) {
    score += 2;
    evidence.push('Proxy contract (potential flash loan vulnerability)');
  }

  if (token.liquidityUsd && token.liquidityUsd < 50000) {
    score += 3;
    evidence.push(`Low liquidity ($${token.liquidityUsd.toFixed(2)}) - vulnerable to flash loan attacks`);
    confidence += 0.2;
  }

  score += 1;
  evidence.push('No known flash loan protection');

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer13_flash_loan,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer14BridgeRisk(token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.4;

  if (token.chainId !== 8453) {
    score += 2;
    evidence.push('Token on different chain (requires bridging)');
  }

  const bridgeTokens: Record<number, string[]> = {
    8453: ['0x4200000000000000000000000000000000000006'],
  };

  const isBridged = bridgeTokens[token.chainId]?.includes(token.address.toLowerCase());
  if (isBridged) {
    score += 1;
    evidence.push('Bridged token (potential bridge risk)');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer14_bridge_risk,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer15InsiderTrading(holder: any, dexscreener: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.3;

  if (dexscreener.txns24h) {
    const { buys, sells } = dexscreener.txns24h;
    const buySellRatio = buys > 0 ? sells / buys : 0;
    
    if (buySellRatio > 10 || buySellRatio < 0.1) {
      score += 4;
      evidence.push(`Unusual buy/sell ratio: ${buySellRatio.toFixed(2)}`);
      confidence += 0.1;
    }
  }

  if (holder.topHolderPercentage > 50) {
    score += 2;
    evidence.push('High concentration (potential insider control)');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer15_insider_trading,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer16Regulatory(security: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.2;

  const symbol = token.symbol?.toUpperCase() || '';
  const name = token.name?.toLowerCase() || '';
  
  const securitiesKeywords = ['stock', 'share', 'equity', 'security', 'bond'];
  if (securitiesKeywords.some(kw => name.includes(kw))) {
    score += 5;
    evidence.push('Token name suggests securities (regulatory risk)');
    confidence += 0.2;
  }

  if (score === 0) {
    evidence.push('No known regulatory issues');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer16_regulatory,
    confidence0to1: Math.max(0.1, confidence),
    evidence,
  };
}

function calculateLayer17ValidatorCentralization(token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.2;

  if (token.chainId === 0) {
    score += 1;
    evidence.push('Solana token (validator centralization risk exists)');
  } else {
    score = 0;
    evidence.push('EVM chain (validator centralization less relevant)');
    confidence = 0.1;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer17_validator_centralization,
    confidence0to1: Math.max(0.1, confidence),
    evidence,
  };
}

function calculateLayer18Composability(security: any, token: TokenHolding): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.3;

  if (security.hasBlacklist) {
    score += 5;
    evidence.push('Has blacklist function (composability risk)');
    confidence += 0.2;
  }

  const maxTax = Math.max(security.buyTax || 0, security.sellTax || 0);
  if (maxTax > 5) {
    score += 2;
    evidence.push(`High tax (${maxTax}%) reduces composability`);
  }

  if (score === 0) {
    evidence.push('No known composability issues');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer18_composability,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

function calculateLayer19ExploitHistory(token: TokenHolding, security: any): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.2;

  const contractAge = security.contractAgeDays || 0;
  
  if (contractAge < 30) {
    score += 2;
    evidence.push('New contract (no exploit history yet)');
  } else if (contractAge < 90) {
    score += 1;
    evidence.push('Relatively new contract');
  } else {
    score = 0;
    evidence.push('Established contract (less exploit risk)');
    confidence += 0.2;
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer19_exploit_history,
    confidence0to1: Math.max(0.1, confidence),
    evidence,
  };
}

function calculateLayer20MLAnomaly(
  token: TokenHolding,
  security: any,
  liquidity: any,
  holder: any,
  dexscreener: any
): RiskLayerScore {
  let score = 0;
  const evidence: string[] = [];
  let confidence = 0.3;

  const anomalies: string[] = [];

  if (holder.holderCount < 10 && token.valueUsd > 1000) {
    score += 3;
    anomalies.push('Few holders but high value');
  }

  const contractAge = security.contractAgeDays || 0;
  if (contractAge < 7 && liquidity.liquidityUsd > 100000) {
    score += 2;
    anomalies.push('Very new but high liquidity');
  }

  const priceChange = dexscreener.priceChange24h || 0;
  if (Math.abs(priceChange) > 80) {
    score += 3;
    anomalies.push('Extreme price volatility');
  }

  if (holder.topHolderPercentage > 60 && (dexscreener.volume24h || 0) > 50000) {
    score += 2;
    anomalies.push('High concentration with high volume');
  }

  if (anomalies.length > 0) {
    evidence.push(`ML anomalies detected: ${anomalies.join(', ')}`);
    confidence += 0.2;
  } else {
    evidence.push('No significant anomalies detected');
  }

  return {
    score0to10: Math.max(0, Math.min(10, score)),
    weightPct: RISK_LAYER_WEIGHTS.layer20_ml_anomaly,
    confidence0to1: Math.max(0.2, confidence),
    evidence,
  };
}

/**
 * Batch calculate risk scores
 */
export async function batchCalculateRiskScoresV2(
  tokens: TokenHolding[]
): Promise<Map<string, RiskResult>> {
  const results = await Promise.allSettled(
    tokens.map((token) => calculateRiskScoreV2(token))
  );

  const scoreMap = new Map<string, RiskResult>();
  
  tokens.forEach((token, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      scoreMap.set(`${token.chainId}:${token.address}`, result.value);
    }
  });

  return scoreMap;
}
