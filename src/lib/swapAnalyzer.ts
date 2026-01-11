/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Smart Swap Analyzer
 * Determines which tokens can be profitably swapped vs burned
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  chainName: string;
  balance: string;
  balanceUsd: number;
  logo?: string;
  tier: 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';
  riskScore: number;
  reasons?: string[];
}

export interface SwapAnalysis {
  tokenId: string;
  action: 'swap' | 'burn' | 'skip' | 'hold';
  reason: string;
  estimatedGasCost: number;
  estimatedOutput: number;
  netGain: number;
  profitMargin: number; // percentage
  priority: number; // 1-10, higher = more urgent to swap
  warnings: string[];
}

export interface SwapSummary {
  totalSwappable: number;
  totalBurnable: number;
  totalSkipped: number;
  totalHold: number;
  estimatedTotalGas: number;
  estimatedTotalOutput: number;
  estimatedNetGain: number;
  swappableTokens: Token[];
  burnableTokens: Token[];
  skippedTokens: Token[];
  holdTokens: Token[];
}

// Gas costs per chain (in USD, estimated)
const GAS_COSTS: Record<number, { swap: number; bridge: number; burn: number }> = {
  8453: { swap: 0.02, bridge: 0, burn: 0.005 },      // Base - very cheap
  1: { swap: 2.5, bridge: 5, burn: 0.5 },            // Ethereum - expensive
  42161: { swap: 0.05, bridge: 0.1, burn: 0.01 },    // Arbitrum - cheap
  10: { swap: 0.03, bridge: 0.08, burn: 0.008 },     // Optimism - cheap
  137: { swap: 0.01, bridge: 0.15, burn: 0.003 },    // Polygon - very cheap
  56: { swap: 0.08, bridge: 0.2, burn: 0.02 },       // BNB - cheap
  43114: { swap: 0.15, bridge: 0.3, burn: 0.04 },    // Avalanche - moderate
  324: { swap: 0.02, bridge: 0.1, burn: 0.005 },     // zkSync - cheap
  0: { swap: 0.001, bridge: 0.5, burn: 0.0003 },     // Solana - very cheap
};

// Minimum profitable thresholds
const THRESHOLDS = {
  MIN_SWAP_VALUE: 0.10,       // Minimum token value to consider swapping
  MIN_NET_GAIN: 0.01,         // Minimum net gain after gas to be profitable
  MIN_PROFIT_MARGIN: 10,      // Minimum profit margin percentage
  BRIDGE_MULTIPLIER: 1.5,     // Bridge costs more than same-chain swap
  BURN_MAX_VALUE: 0.05,       // Tokens below this are candidates for burning
  HIGH_RISK_THRESHOLD: 70,    // Risk score above this = risky token
  LEGIT_MIN_VALUE: 10,        // Tokens worth more than this should be held
};

// Base chain ID for target output
const BASE_CHAIN_ID = 8453;

// Output token addresses on Base
const BASE_OUTPUT_TOKENS = {
  ETH: [
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
    '0x4200000000000000000000000000000000000006', // WETH
  ],
  USDC: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ],
};

/**
 * Analyze a single token for swap viability
 */
export function analyzeToken(
  token: Token,
  outputToken: 'ETH' | 'USDC' = 'ETH'
): SwapAnalysis {
  const warnings: string[] = [];
  const isOnBase = token.chainId === BASE_CHAIN_ID;
  const gasCosts = GAS_COSTS[token.chainId] || GAS_COSTS[1]; // Default to ETH costs
  
  // Check if this IS the output token (should skip)
  const outputAddresses = BASE_OUTPUT_TOKENS[outputToken];
  const isOutputToken = isOnBase && outputAddresses.some(
    addr => addr.toLowerCase() === token.address.toLowerCase()
  );
  
  if (isOutputToken) {
    return {
      tokenId: token.id,
      action: 'skip',
      reason: `Already ${outputToken} on Base`,
      estimatedGasCost: 0,
      estimatedOutput: token.balanceUsd,
      netGain: 0,
      profitMargin: 0,
      priority: 0,
      warnings: [],
    };
  }

  // Calculate estimated gas cost
  const baseCost = isOnBase ? gasCosts.swap : gasCosts.swap + gasCosts.bridge * THRESHOLDS.BRIDGE_MULTIPLIER;
  const estimatedGasCost = baseCost;
  
  // Calculate estimated output (assume 0.5% slippage + 0.3% DEX fee)
  const slippageAndFees = token.balanceUsd * 0.008;
  const estimatedOutput = Math.max(0, token.balanceUsd - slippageAndFees);
  
  // Calculate net gain
  const netGain = estimatedOutput - estimatedGasCost;
  const profitMargin = token.balanceUsd > 0 ? (netGain / token.balanceUsd) * 100 : 0;

  // Determine action based on analysis
  let action: 'swap' | 'burn' | 'skip' | 'hold' = 'skip';
  let reason = '';
  let priority = 0;

  // High-value legitimate tokens - suggest holding
  if (token.tier === 'LEGIT' && token.balanceUsd >= THRESHOLDS.LEGIT_MIN_VALUE) {
    action = 'hold';
    reason = 'Valuable token - consider holding';
    priority = 0;
    warnings.push('This token has significant value. Are you sure you want to swap?');
  }
  // High risk tokens - warn but allow
  else if (token.riskScore >= THRESHOLDS.HIGH_RISK_THRESHOLD) {
    if (token.balanceUsd >= THRESHOLDS.MIN_SWAP_VALUE && netGain >= THRESHOLDS.MIN_NET_GAIN) {
      action = 'swap';
      reason = '⚠️ High risk - swap to exit position';
      priority = 8; // High priority to exit risky positions
      warnings.push('This token has high risk score. Swapping is recommended to exit.');
    } else if (token.balanceUsd <= THRESHOLDS.BURN_MAX_VALUE) {
      action = 'burn';
      reason = 'High risk + low value - burn recommended';
      priority = 2;
    } else {
      action = 'skip';
      reason = 'High risk but not enough value to profitably swap';
      priority = 0;
    }
  }
  // Token too small to swap profitably
  else if (token.balanceUsd < THRESHOLDS.MIN_SWAP_VALUE) {
    if (token.balanceUsd <= THRESHOLDS.BURN_MAX_VALUE) {
      action = 'burn';
      reason = `Value too low ($${token.balanceUsd.toFixed(4)}) - burn for carbon credits`;
      priority = 1;
    } else {
      action = 'skip';
      reason = `Value below minimum ($${THRESHOLDS.MIN_SWAP_VALUE})`;
      priority = 0;
    }
  }
  // Swap would result in net loss
  else if (netGain < THRESHOLDS.MIN_NET_GAIN) {
    action = 'skip';
    reason = `Gas cost ($${estimatedGasCost.toFixed(2)}) exceeds potential gain`;
    priority = 0;
    warnings.push('This swap would result in a net loss due to gas costs.');
  }
  // Profit margin too low
  else if (profitMargin < THRESHOLDS.MIN_PROFIT_MARGIN) {
    action = 'skip';
    reason = `Low profit margin (${profitMargin.toFixed(1)}%)`;
    priority = 0;
    warnings.push('Profit margin is too low to be worthwhile.');
  }
  // Cross-chain swap (needs bridge)
  else if (!isOnBase) {
    action = 'swap';
    reason = `Bridge + swap → Base (est. +$${netGain.toFixed(2)})`;
    priority = calculatePriority(token, netGain, profitMargin, isOnBase);
    if (gasCosts.bridge > 0.5) {
      warnings.push('Cross-chain bridging has higher fees.');
    }
  }
  // Same-chain swap on Base
  else {
    action = 'swap';
    reason = `Swap on Base (est. +$${netGain.toFixed(2)})`;
    priority = calculatePriority(token, netGain, profitMargin, isOnBase);
  }

  return {
    tokenId: token.id,
    action,
    reason,
    estimatedGasCost,
    estimatedOutput,
    netGain,
    profitMargin,
    priority,
    warnings,
  };
}

/**
 * Calculate priority score (1-10)
 */
function calculatePriority(
  token: Token,
  netGain: number,
  profitMargin: number,
  isOnBase: boolean
): number {
  let priority = 5; // Base priority
  
  // Higher value = higher priority
  if (netGain >= 5) priority += 2;
  else if (netGain >= 1) priority += 1;
  
  // Better margin = higher priority
  if (profitMargin >= 80) priority += 2;
  else if (profitMargin >= 50) priority += 1;
  
  // Base chain = higher priority (no bridging)
  if (isOnBase) priority += 1;
  
  // Dust tier = higher priority (clean up portfolio)
  if (token.tier === 'DUST' || token.tier === 'MICRODUST') priority += 1;
  
  return Math.min(10, Math.max(1, priority));
}

/**
 * Analyze all tokens and generate summary
 */
export function analyzeAllTokens(
  tokens: Token[],
  outputToken: 'ETH' | 'USDC' = 'ETH'
): { analyses: Map<string, SwapAnalysis>; summary: SwapSummary } {
  const analyses = new Map<string, SwapAnalysis>();
  
  const swappableTokens: Token[] = [];
  const burnableTokens: Token[] = [];
  const skippedTokens: Token[] = [];
  const holdTokens: Token[] = [];
  
  let estimatedTotalGas = 0;
  let estimatedTotalOutput = 0;
  
  for (const token of tokens) {
    const analysis = analyzeToken(token, outputToken);
    analyses.set(token.id, analysis);
    
    switch (analysis.action) {
      case 'swap':
        swappableTokens.push(token);
        estimatedTotalGas += analysis.estimatedGasCost;
        estimatedTotalOutput += analysis.estimatedOutput;
        break;
      case 'burn':
        burnableTokens.push(token);
        break;
      case 'hold':
        holdTokens.push(token);
        break;
      case 'skip':
        skippedTokens.push(token);
        break;
    }
  }
  
  // Sort by priority (highest first)
  swappableTokens.sort((a, b) => {
    const aAnalysis = analyses.get(a.id)!;
    const bAnalysis = analyses.get(b.id)!;
    return bAnalysis.priority - aAnalysis.priority;
  });
  
  const summary: SwapSummary = {
    totalSwappable: swappableTokens.length,
    totalBurnable: burnableTokens.length,
    totalSkipped: skippedTokens.length,
    totalHold: holdTokens.length,
    estimatedTotalGas,
    estimatedTotalOutput,
    estimatedNetGain: estimatedTotalOutput - estimatedTotalGas,
    swappableTokens,
    burnableTokens,
    skippedTokens,
    holdTokens,
  };
  
  return { analyses, summary };
}

/**
 * Get smart auto-selection (only profitable swaps)
 */
export function getSmartSelection(
  tokens: Token[],
  outputToken: 'ETH' | 'USDC' = 'ETH'
): Set<string> {
  const { analyses, summary } = analyzeAllTokens(tokens, outputToken);
  const selected = new Set<string>();
  
  // Auto-select all swappable tokens
  for (const token of summary.swappableTokens) {
    selected.add(token.id);
  }
  
  return selected;
}

/**
 * Get burn selection (micro-dust tokens)
 */
export function getBurnSelection(
  tokens: Token[],
  outputToken: 'ETH' | 'USDC' = 'ETH'
): Set<string> {
  const { summary } = analyzeAllTokens(tokens, outputToken);
  const selected = new Set<string>();
  
  for (const token of summary.burnableTokens) {
    selected.add(token.id);
  }
  
  return selected;
}

export { THRESHOLDS, GAS_COSTS, BASE_CHAIN_ID };
