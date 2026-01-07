/**
 * Vortex Protocol - Multi-Router Comparison Service
 * Find optimal swap route across 1inch, Uniswap V4, Curve, Balancer
 */

import { createLogger } from '../utils/logger';
import * as oneInch from '../blockchain/routers/oneInch';
import * as uniswapV4 from '../blockchain/routers/uniswapV4';
import * as curve from '../blockchain/routers/curve';
import * as balancer from '../blockchain/routers/balancer';

const logger = createLogger('router-service');

// ============================================
// TYPES
// ============================================
export type RouterName = '1inch' | 'uniswap_v4' | 'curve' | 'balancer';

export interface SwapQuote {
  router: RouterName;
  amountOut: string;
  amountOutUsd: number;
  estimatedGas: string;
  gasCostUsd: number;
  priceImpact: number;
  netOutputUsd: number;
  platformFeeUsd: number;
}

export interface EvaluatedRoute extends SwapQuote {
  rank: number;
  savings: number; // Compared to worst route
  isBest: boolean;
}

export interface RouteComparisonResult {
  routes: EvaluatedRoute[];
  bestRoute: EvaluatedRoute;
  worstRoute: EvaluatedRoute;
  timestamp: number;
}

// ============================================
// CONFIGURATION
// ============================================
const PLATFORM_FEE_PERCENT = 0.008; // 0.8%
const GAS_PRICE_GWEI = 0.001; // Base chain very cheap gas

// Token prices (should be fetched from price oracle in production)
const TOKEN_PRICES: Record<string, number> = {
  ETH: 3500,
  WETH: 3500,
  USDC: 1,
  USDT: 1,
  DAI: 1,
};

// ============================================
// QUOTE FETCHING
// ============================================

/**
 * Fetch quote from a single router with timeout
 */
async function fetchQuoteWithTimeout(
  router: RouterName,
  params: {
    chainId: number;
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress?: string;
  },
  timeoutMs: number = 5000
): Promise<SwapQuote | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let rawQuote: any;

    switch (router) {
      case '1inch':
        rawQuote = await oneInch.getQuote(params);
        break;
      case 'uniswap_v4':
        rawQuote = await uniswapV4.getQuote(params);
        break;
      case 'curve':
        rawQuote = await curve.getQuote(params);
        break;
      case 'balancer':
        rawQuote = await balancer.getQuote(params);
        break;
      default:
        throw new Error(`Unknown router: ${router}`);
    }

    clearTimeout(timeout);

    // Calculate USD values
    const toTokenSymbol = getTokenSymbol(params.toToken);
    const tokenPrice = TOKEN_PRICES[toTokenSymbol] || 1;
    
    const amountOutNum = parseFloat(rawQuote.amountOut) / 1e18; // Assuming 18 decimals
    const amountOutUsd = amountOutNum * tokenPrice;
    
    const gasEstimate = parseInt(rawQuote.estimatedGas || '200000');
    const gasCostUsd = gasEstimate * GAS_PRICE_GWEI * TOKEN_PRICES.ETH / 1e9;
    
    const platformFeeUsd = amountOutUsd * PLATFORM_FEE_PERCENT;
    const netOutputUsd = amountOutUsd - gasCostUsd - platformFeeUsd;

    return {
      router,
      amountOut: rawQuote.amountOut,
      amountOutUsd,
      estimatedGas: rawQuote.estimatedGas,
      gasCostUsd,
      priceImpact: rawQuote.priceImpact || 0,
      netOutputUsd,
      platformFeeUsd,
    };
  } catch (error) {
    logger.warn({ error, router }, `Quote fetch failed for ${router}`);
    return null;
  }
}

/**
 * Fetch quotes from all routers in parallel
 */
async function fetchAllQuotes(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress?: string;
}): Promise<SwapQuote[]> {
  const routers: RouterName[] = ['1inch', 'uniswap_v4', 'curve', 'balancer'];

  const quotePromises = routers.map((router) =>
    fetchQuoteWithTimeout(router, params)
  );

  const results = await Promise.allSettled(quotePromises);

  const quotes: SwapQuote[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      quotes.push(result.value);
    } else {
      logger.debug({ router: routers[index] }, 'Router quote unavailable');
    }
  });

  return quotes;
}

// ============================================
// ROUTE COMPARISON
// ============================================

/**
 * Compare routes and select the best one
 */
export async function findOptimalRoute(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress?: string;
}): Promise<RouteComparisonResult> {
  logger.info(
    {
      chainId: params.chainId,
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
    },
    'Finding optimal route'
  );

  const quotes = await fetchAllQuotes(params);

  if (quotes.length === 0) {
    throw new Error('No quotes available from any router');
  }

  // Sort by net output (descending)
  const sortedQuotes = [...quotes].sort((a, b) => b.netOutputUsd - a.netOutputUsd);

  const bestRoute = sortedQuotes[0];
  const worstRoute = sortedQuotes[sortedQuotes.length - 1];

  // Calculate rankings and savings
  const evaluatedRoutes: EvaluatedRoute[] = sortedQuotes.map((quote, index) => ({
    ...quote,
    rank: index + 1,
    savings: quote.netOutputUsd - worstRoute.netOutputUsd,
    isBest: index === 0,
  }));

  const result: RouteComparisonResult = {
    routes: evaluatedRoutes,
    bestRoute: evaluatedRoutes[0],
    worstRoute: evaluatedRoutes[evaluatedRoutes.length - 1],
    timestamp: Date.now(),
  };

  logger.info(
    {
      bestRouter: result.bestRoute.router,
      bestNetOutput: result.bestRoute.netOutputUsd,
      routesCompared: evaluatedRoutes.length,
    },
    'Optimal route found'
  );

  return result;
}

/**
 * Get transaction data for the best route
 */
export async function getSwapTransaction(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage?: number;
  preferredRouter?: RouterName;
}): Promise<{
  router: RouterName;
  calldata: string;
  to: string;
  value: string;
  estimatedGas: string;
}> {
  // Find best route first
  const comparison = await findOptimalRoute(params);
  const router = params.preferredRouter || comparison.bestRoute.router;

  let txData: any;

  switch (router) {
    case '1inch':
      txData = await oneInch.getSwapTx(params);
      return {
        router,
        calldata: txData.tx?.data || '0x',
        to: txData.tx?.to || '',
        value: txData.tx?.value || '0',
        estimatedGas: txData.estimatedGas,
      };

    case 'uniswap_v4':
      txData = await uniswapV4.getSwapTx(params);
      return {
        router,
        calldata: txData.calldata,
        to: '0x2626664c2603336E57B271c5C0b26F421741e481', // Universal Router
        value: '0',
        estimatedGas: txData.estimatedGas,
      };

    case 'curve':
      txData = await curve.getSwapTx(params);
      return {
        router,
        calldata: txData.calldata,
        to: txData.to,
        value: '0',
        estimatedGas: txData.estimatedGas,
      };

    case 'balancer':
      txData = await balancer.getSwapTx(params);
      return {
        router,
        calldata: txData.calldata,
        to: txData.to,
        value: '0',
        estimatedGas: txData.estimatedGas,
      };

    default:
      throw new Error(`Unknown router: ${router}`);
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Get token symbol from address
 */
function getTokenSymbol(address: string): string {
  const symbols: Record<string, string> = {
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
    '0x4200000000000000000000000000000000000006': 'WETH', // Base WETH
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC', // Base USDC
    '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'DAI', // Base DAI
  };

  return symbols[address.toLowerCase()] || 'UNKNOWN';
}

/**
 * Check if token pair is suitable for Curve (stablecoin focus)
 */
export function isCurveSuitable(fromToken: string, toToken: string): boolean {
  const stablecoins = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD'];
  const fromSymbol = getTokenSymbol(fromToken);
  const toSymbol = getTokenSymbol(toToken);
  
  return stablecoins.includes(fromSymbol) && stablecoins.includes(toSymbol);
}

/**
 * Format route comparison for display
 */
export function formatRouteComparison(result: RouteComparisonResult): string {
  const lines = [
    '🔄 Route Comparison:',
    '',
    ...result.routes.map(
      (route) =>
        `${route.isBest ? '✅' : '  '} #${route.rank} ${route.router}: $${route.netOutputUsd.toFixed(2)} (saves $${route.savings.toFixed(2)})`
    ),
    '',
    `Best: ${result.bestRoute.router} → $${result.bestRoute.netOutputUsd.toFixed(2)}`,
  ];

  return lines.join('\n');
}

export default {
  findOptimalRoute,
  getSwapTransaction,
  isCurveSuitable,
  formatRouteComparison,
};

