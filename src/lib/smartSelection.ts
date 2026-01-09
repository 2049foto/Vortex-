/**
 * Vortex Protocol - Smart Token Selection System
 * Intelligent, optimized, and secure token selection logic
 * 
 * DESIGN PRINCIPLES:
 * 1. SAFETY FIRST: Never auto-select risky tokens
 * 2. VALUE OPTIMIZATION: Maximize output, minimize fees
 * 3. GAS EFFICIENCY: Group by chain, skip micro-dust if gas > value
 * 4. USER FRIENDLY: Clear recommendations with explanations
 * 5. TRANSPARENCY: Show why each token is/isn't recommended
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  chainName: string;
  balance: string;
  balanceUsd: number;
  tier: 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';
  riskScore: number;
  logo?: string;
}

export interface SelectionResult {
  selectedIds: Set<string>;
  recommendations: TokenRecommendation[];
  summary: SelectionSummary;
  warnings: string[];
}

export interface TokenRecommendation {
  token: Token;
  action: 'select' | 'skip' | 'warning';
  reason: string;
  priority: number; // 1-10, higher = more recommended
  estimatedNetGain: number; // USD after fees
}

export interface SelectionSummary {
  totalSelected: number;
  totalValue: number;
  estimatedOutput: number;
  estimatedFees: number;
  estimatedGasSaved: number;
  chainsInvolved: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// ════════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Fine-tuned thresholds
// ════════════════════════════════════════════════════════════════════════════════

export const SELECTION_CONFIG = {
  // Value thresholds
  MIN_SWAP_VALUE_USD: 0.10,        // Minimum value to consider swapping
  MIN_NET_GAIN_USD: 0.05,         // Minimum net gain after fees to recommend
  DUST_THRESHOLD_USD: 10,         // Below this = DUST
  MICRODUST_THRESHOLD_USD: 1,     // Below this = MICRODUST
  
  // Risk thresholds
  MAX_RISK_AUTO_SELECT: 50,       // Auto-select if risk < this
  MAX_RISK_WITH_WARNING: 70,      // Allow with warning if risk < this
  BLOCKED_RISK_THRESHOLD: 85,     // Block if risk >= this
  
  // Gas estimates (USD) - conservative estimates
  SAME_CHAIN_SWAP_GAS: 0.05,      // Base chain swap gas
  CROSS_CHAIN_BRIDGE_GAS: 0.50,   // Cross-chain bridge gas
  APPROVAL_GAS: 0.02,             // Token approval gas
  
  // Fee structure
  PROTOCOL_FEE_PCT: 0.8,          // 0.8% protocol fee
  AVG_SLIPPAGE_PCT: 0.5,          // Expected slippage
  BRIDGE_FEE_PCT: 0.3,            // Bridge fee estimate
  
  // Output tokens on Base (excluded from selection)
  BASE_OUTPUT_TOKENS: {
    ETH: [
      '0x4200000000000000000000000000000000000006', // WETH
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
    ],
    USDC: [
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
    ],
  },
  
  // Chain priorities (lower = faster/cheaper, higher priority)
  CHAIN_PRIORITY: {
    8453: 10,   // Base - highest priority (target chain)
    42161: 9,   // Arbitrum - fast & cheap
    10: 8,      // Optimism - fast & cheap
    137: 7,     // Polygon - cheap but slower
    56: 6,      // BSC - cheap
    43114: 5,   // Avalanche
    324: 4,     // zkSync
    1: 3,       // Ethereum - expensive
  } as Record<number, number>,
};

// ════════════════════════════════════════════════════════════════════════════════
// CORE SELECTION LOGIC
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Smart Select All - Intelligent auto-selection
 * Selects optimal tokens based on value, risk, and efficiency
 */
export function smartSelectAll(
  tokens: Token[],
  outputToken: 'ETH' | 'USDC' = 'ETH'
): SelectionResult {
  const recommendations: TokenRecommendation[] = [];
  const selectedIds = new Set<string>();
  const warnings: string[] = [];
  
  // Analyze each token
  for (const token of tokens) {
    const recommendation = analyzeToken(token, outputToken);
    recommendations.push(recommendation);
    
    if (recommendation.action === 'select') {
      selectedIds.add(token.id);
    }
    
    if (recommendation.action === 'warning') {
      warnings.push(`${token.symbol}: ${recommendation.reason}`);
    }
  }
  
  // Sort recommendations by priority (highest first)
  recommendations.sort((a, b) => b.priority - a.priority);
  
  // Calculate summary
  const summary = calculateSummary(tokens, selectedIds, outputToken);
  
  return {
    selectedIds,
    recommendations,
    summary,
    warnings,
  };
}

/**
 * Analyze single token for selection
 */
export function analyzeToken(
  token: Token,
  outputToken: 'ETH' | 'USDC' = 'ETH'
): TokenRecommendation {
  const reasons: string[] = [];
  let action: 'select' | 'skip' | 'warning' = 'skip';
  let priority = 0;
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 1: Check if token is output token on Base (NEVER select)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isOutputToken(token, outputToken)) {
    return {
      token,
      action: 'skip',
      reason: 'Output token on Base - no conversion needed',
      priority: 0,
      estimatedNetGain: 0,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 2: Risk-based filtering (SECURITY FIRST)
  // ─────────────────────────────────────────────────────────────────────────────
  if (token.riskScore >= SELECTION_CONFIG.BLOCKED_RISK_THRESHOLD) {
    return {
      token,
      action: 'skip',
      reason: `High risk (${token.riskScore}/100) - potentially unsafe`,
      priority: 0,
      estimatedNetGain: 0,
    };
  }
  
  if (token.riskScore >= SELECTION_CONFIG.MAX_RISK_WITH_WARNING) {
    reasons.push(`Elevated risk score (${token.riskScore}/100)`);
    action = 'warning';
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 3: Value-based filtering
  // ─────────────────────────────────────────────────────────────────────────────
  if (token.balanceUsd < SELECTION_CONFIG.MIN_SWAP_VALUE_USD) {
    return {
      token,
      action: 'skip',
      reason: `Value too low ($${token.balanceUsd.toFixed(4)}) - gas would exceed value`,
      priority: 0,
      estimatedNetGain: 0,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 4: Calculate estimated net gain
  // ─────────────────────────────────────────────────────────────────────────────
  const netGain = calculateNetGain(token);
  
  if (netGain < SELECTION_CONFIG.MIN_NET_GAIN_USD) {
    return {
      token,
      action: 'skip',
      reason: `Low net gain ($${netGain.toFixed(4)}) after fees - not worth gas`,
      priority: 1,
      estimatedNetGain: netGain,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 5: Tier-based priority
  // ─────────────────────────────────────────────────────────────────────────────
  switch (token.tier) {
    case 'LEGIT':
      // High value tokens - don't auto-select but allow manual
      reasons.push('Valuable token - manual selection recommended');
      action = action === 'warning' ? 'warning' : 'skip';
      priority = 2;
      break;
      
    case 'DUST':
      // Perfect candidates for consolidation
      if (token.riskScore < SELECTION_CONFIG.MAX_RISK_AUTO_SELECT) {
        action = action === 'warning' ? 'warning' : 'select';
        priority = 8;
        reasons.push('Good dust candidate');
      } else {
        action = 'warning';
        priority = 5;
        reasons.push('Dust with moderate risk');
      }
      break;
      
    case 'MICRODUST':
      // Only select if on Base (no bridge fee) or value > bridge cost
      if (token.chainId === 8453) {
        action = action === 'warning' ? 'warning' : 'select';
        priority = 7;
        reasons.push('Micro-dust on Base - efficient to clean');
      } else if (netGain > SELECTION_CONFIG.CROSS_CHAIN_BRIDGE_GAS * 1.5) {
        action = action === 'warning' ? 'warning' : 'select';
        priority = 4;
        reasons.push('Micro-dust worth bridging');
      } else {
        action = 'skip';
        priority = 1;
        reasons.push('Micro-dust bridge cost exceeds value');
      }
      break;
      
    case 'RISK':
      // Never auto-select risky tokens
      return {
        token,
        action: 'skip',
        reason: 'Risk tier token - skipped for safety',
        priority: 0,
        estimatedNetGain: 0,
      };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RULE 6: Chain priority boost
  // ─────────────────────────────────────────────────────────────────────────────
  const chainPriority = SELECTION_CONFIG.CHAIN_PRIORITY[token.chainId] || 1;
  priority = Math.min(10, priority + Math.floor(chainPriority / 3));
  
  // Base chain tokens get extra priority (no bridge needed)
  if (token.chainId === 8453) {
    priority = Math.min(10, priority + 2);
    reasons.push('On Base - no bridge needed');
  }
  
  return {
    token,
    action,
    reason: reasons.join('. ') || 'Recommended for consolidation',
    priority,
    estimatedNetGain: netGain,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Check if token is an output token on Base
 */
function isOutputToken(token: Token, outputToken: 'ETH' | 'USDC'): boolean {
  if (token.chainId !== 8453) return false;
  
  const outputAddresses = SELECTION_CONFIG.BASE_OUTPUT_TOKENS[outputToken];
  const address = token.address.toLowerCase();
  
  return outputAddresses.some(addr => addr.toLowerCase() === address);
}

/**
 * Calculate net gain after all fees
 */
function calculateNetGain(token: Token): number {
  const value = token.balanceUsd;
  
  // Deduct protocol fee
  const afterProtocolFee = value * (1 - SELECTION_CONFIG.PROTOCOL_FEE_PCT / 100);
  
  // Deduct slippage
  const afterSlippage = afterProtocolFee * (1 - SELECTION_CONFIG.AVG_SLIPPAGE_PCT / 100);
  
  // Estimate gas cost based on chain
  let gasCost = SELECTION_CONFIG.SAME_CHAIN_SWAP_GAS;
  
  if (token.chainId !== 8453) {
    // Cross-chain: add bridge cost
    gasCost += SELECTION_CONFIG.CROSS_CHAIN_BRIDGE_GAS;
    // Add bridge fee percentage
    const bridgeFee = value * (SELECTION_CONFIG.BRIDGE_FEE_PCT / 100);
    return afterSlippage - gasCost - bridgeFee;
  }
  
  // Check if needs approval (ERC20 tokens)
  if (token.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    gasCost += SELECTION_CONFIG.APPROVAL_GAS;
  }
  
  return afterSlippage - gasCost;
}

/**
 * Calculate selection summary
 */
function calculateSummary(
  tokens: Token[],
  selectedIds: Set<string>,
  outputToken: 'ETH' | 'USDC'
): SelectionSummary {
  const selectedTokens = tokens.filter(t => selectedIds.has(t.id));
  
  const totalValue = selectedTokens.reduce((sum, t) => sum + t.balanceUsd, 0);
  const totalFees = selectedTokens.reduce((sum, t) => {
    let fee = t.balanceUsd * (SELECTION_CONFIG.PROTOCOL_FEE_PCT / 100);
    fee += t.balanceUsd * (SELECTION_CONFIG.AVG_SLIPPAGE_PCT / 100);
    if (t.chainId !== 8453) {
      fee += t.balanceUsd * (SELECTION_CONFIG.BRIDGE_FEE_PCT / 100);
    }
    return sum + fee;
  }, 0);
  
  const chains = new Set(selectedTokens.map(t => t.chainId));
  
  // Calculate risk level
  const avgRisk = selectedTokens.length > 0
    ? selectedTokens.reduce((sum, t) => sum + t.riskScore, 0) / selectedTokens.length
    : 0;
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (avgRisk > 50) riskLevel = 'medium';
  if (avgRisk > 70) riskLevel = 'high';
  
  // Estimate gas saved by batching
  const estimatedGasSaved = selectedTokens.length * 0.02; // Saved by batching vs individual swaps
  
  return {
    totalSelected: selectedIds.size,
    totalValue,
    estimatedOutput: totalValue - totalFees,
    estimatedFees: totalFees,
    estimatedGasSaved,
    chainsInvolved: chains.size,
    riskLevel,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// SELECTION MODES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Select only dust tokens (safest, most recommended)
 */
export function selectDustOnly(tokens: Token[], outputToken: 'ETH' | 'USDC' = 'ETH'): Set<string> {
  const result = smartSelectAll(tokens, outputToken);
  
  // Filter to only DUST and MICRODUST with action = 'select'
  const dustIds = new Set<string>();
  
  for (const rec of result.recommendations) {
    if (
      rec.action === 'select' &&
      (rec.token.tier === 'DUST' || rec.token.tier === 'MICRODUST')
    ) {
      dustIds.add(rec.token.id);
    }
  }
  
  return dustIds;
}

/**
 * Select tokens on Base only (cheapest, fastest)
 */
export function selectBaseOnly(tokens: Token[], outputToken: 'ETH' | 'USDC' = 'ETH'): Set<string> {
  const result = smartSelectAll(tokens, outputToken);
  
  const baseIds = new Set<string>();
  
  for (const rec of result.recommendations) {
    if (rec.action === 'select' && rec.token.chainId === 8453) {
      baseIds.add(rec.token.id);
    }
  }
  
  return baseIds;
}

/**
 * Select high-value dust (best ROI)
 */
export function selectHighValueDust(
  tokens: Token[],
  minValue: number = 1,
  outputToken: 'ETH' | 'USDC' = 'ETH'
): Set<string> {
  const result = smartSelectAll(tokens, outputToken);
  
  const ids = new Set<string>();
  
  for (const rec of result.recommendations) {
    if (
      rec.action === 'select' &&
      rec.token.balanceUsd >= minValue &&
      rec.token.tier !== 'LEGIT'
    ) {
      ids.add(rec.token.id);
    }
  }
  
  return ids;
}

/**
 * Get selection presets for UI
 */
export function getSelectionPresets(
  tokens: Token[],
  outputToken: 'ETH' | 'USDC' = 'ETH'
): {
  smart: { ids: Set<string>; label: string; description: string };
  dustOnly: { ids: Set<string>; label: string; description: string };
  baseOnly: { ids: Set<string>; label: string; description: string };
  highValue: { ids: Set<string>; label: string; description: string };
} {
  const smartResult = smartSelectAll(tokens, outputToken);
  const dustIds = selectDustOnly(tokens, outputToken);
  const baseIds = selectBaseOnly(tokens, outputToken);
  const highValueIds = selectHighValueDust(tokens, 1, outputToken);
  
  return {
    smart: {
      ids: smartResult.selectedIds,
      label: 'Smart Select',
      description: `${smartResult.selectedIds.size} tokens optimized for best return`,
    },
    dustOnly: {
      ids: dustIds,
      label: 'Dust Only',
      description: `${dustIds.size} small tokens safe to clean`,
    },
    baseOnly: {
      ids: baseIds,
      label: 'Base Only',
      description: `${baseIds.size} tokens on Base (no bridge fees)`,
    },
    highValue: {
      ids: highValueIds,
      label: 'High Value',
      description: `${highValueIds.size} tokens worth $1+ each`,
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validate selection before consolidation
 */
export function validateSelection(
  tokens: Token[],
  selectedIds: Set<string>,
  outputToken: 'ETH' | 'USDC' = 'ETH'
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  adjustedIds?: Set<string>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const adjustedIds = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const token = tokens.find(t => t.id === id);
    if (!token) {
      errors.push(`Token ${id} not found`);
      adjustedIds.delete(id);
      continue;
    }
    
    // Check output token
    if (isOutputToken(token, outputToken)) {
      warnings.push(`${token.symbol} is output token - removed`);
      adjustedIds.delete(id);
      continue;
    }
    
    // Check risk
    if (token.riskScore >= SELECTION_CONFIG.BLOCKED_RISK_THRESHOLD) {
      errors.push(`${token.symbol} has dangerous risk score (${token.riskScore})`);
      adjustedIds.delete(id);
      continue;
    }
    
    if (token.riskScore >= SELECTION_CONFIG.MAX_RISK_WITH_WARNING) {
      warnings.push(`${token.symbol} has elevated risk (${token.riskScore}/100)`);
    }
    
    // Check value
    if (token.balanceUsd < SELECTION_CONFIG.MIN_SWAP_VALUE_USD) {
      warnings.push(`${token.symbol} has very low value ($${token.balanceUsd.toFixed(4)})`);
    }
  }
  
  return {
    valid: errors.length === 0 && adjustedIds.size > 0,
    errors,
    warnings,
    adjustedIds: adjustedIds.size !== selectedIds.size ? adjustedIds : undefined,
  };
}
