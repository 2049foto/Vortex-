/**
 * Vortex Protocol - Consolidation Service
 * Multi-router swap aggregation and execution
 */

import { createLogger } from '../utils/logger';
import type { TokenHolding } from './portfolioService';
import type { RiskResult } from './riskScoringServiceV2';
import * as oneInch from '../blockchain/routers/oneInch';
import * as uniswapV4 from '../blockchain/routers/uniswapV4';
import * as curve from '../blockchain/routers/curve';
import * as balancer from '../blockchain/routers/balancer';
import { simulateTransaction } from '../blockchain/tenderly';
import { sponsorWithFallback } from '../blockchain/coinbase';
import { sendUserOp, getUserOpReceipt } from '../blockchain/pimlico';
import { validatePaymasterPolicy } from '../middleware/paymasterPolicy';
import { getBridgeQuotes, chooseBridge } from './bridgeService';
import { getRelayQuote, executeRelayBridge, toRelayCurrency, isRelaySupported } from './relayService';
import { db } from '../db/client';
import { consolidationRequests, consolidationAnalytics, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const logger = createLogger('consolidation');

export interface ConsolidationPlan {
  id: string;
  tokens: Array<{
    token: TokenHolding;
    risk: RiskResult;
    action: 'swap' | 'skip';
    reason?: string;
  }>;
  swaps: SwapRoute[];
  estimatedGasSaved: string;
  estimatedOutput: string;
  estimatedTime: number; // seconds
}

export interface SwapRoute {
  router: '1inch' | 'uniswap_v4' | 'curve' | 'balancer' | 'relay';
  fromToken: TokenHolding;
  toToken: string; // Base chain target token
  amountIn: string;
  expectedOut: string;
  estimatedGas: string;
  priceImpact: number;
  tx?: {
    to: string;
    data: string;
    value: string;
  };
}

/**
 * Create consolidation plan
 */
export async function createConsolidationPlan(
  walletAddress: string,
  tokens: TokenHolding[],
  riskScores: Map<string, RiskResult>,
  targetToken: string = '0x4200000000000000000000000000000000000006' // WETH on Base
): Promise<ConsolidationPlan> {
  logger.info({ walletAddress, tokenCount: tokens.length }, 'Creating consolidation plan');

  const plan: ConsolidationPlan = {
    id: crypto.randomUUID(),
    tokens: [],
    swaps: [],
    estimatedGasSaved: '0',
    estimatedOutput: '0',
    estimatedTime: 0,
  };

  // Filter tokens to consolidate
  for (const token of tokens) {
    const riskKey = `${token.chainId}:${token.address}`;
    const risk = riskScores.get(riskKey);

    if (!risk) {
      plan.tokens.push({ 
        token, 
        risk: {
          riskScore0to100: 50,
          tier: 'RISK',
          confidence0to1: 0,
          layers: {},
          explanation: 'No risk data available'
        } as RiskResult, 
        action: 'skip', 
        reason: 'No risk data' 
      });
      continue;
    }

    // Skip high-risk tokens
    if (risk.tier === 'RISK') {
      plan.tokens.push({ token, risk, action: 'skip', reason: 'High risk token' });
      continue;
    }

    // Skip native tokens (keep some ETH for gas)
    if (token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      plan.tokens.push({ token, risk, action: 'skip', reason: 'Native token (keep for gas)' });
      continue;
    }

    // Skip if value too low (not worth gas)
    if (token.valueUsd < 0.5) {
      plan.tokens.push({ token, risk, action: 'skip', reason: 'Value too low for gas cost' });
      continue;
    }

    // Add to consolidation
    plan.tokens.push({ token, risk, action: 'swap' });
  }

  // Get swap routes for each token
  const swapTokens = plan.tokens.filter((t) => t.action === 'swap');
  const OUTPUT_CHAIN_ID = 8453; // Base
  
  for (const { token } of swapTokens) {
    try {
      // Same-chain swap (token already on Base)
      if (token.chainId === OUTPUT_CHAIN_ID) {
        const route = await findBestRoute(token, targetToken, walletAddress);
        if (route) {
          plan.swaps.push(route);
          plan.estimatedOutput = (
            parseFloat(plan.estimatedOutput) + parseFloat(route.expectedOut)
          ).toString();
          plan.estimatedGasSaved = (
            parseFloat(plan.estimatedGasSaved) + parseFloat(route.estimatedGas)
          ).toString();
        } else {
          // Mark as skipped if no route found
          const tokenEntry = plan.tokens.find(t => t.token.address === token.address);
          if (tokenEntry) {
            tokenEntry.action = 'skip';
            tokenEntry.reason = 'No swap route available';
          }
        }
        continue;
      }

      // Cross-chain: Token on different chain, need bridge
      // Check if Relay supports this chain pair
      if (isRelaySupported(token.chainId, OUTPUT_CHAIN_ID)) {
        try {
          // Use Relay.link for cross-chain bridge
          const relayQuote = await getRelayQuote({
            user: walletAddress,
            originChainId: token.chainId,
            destinationChainId: OUTPUT_CHAIN_ID,
            originCurrency: toRelayCurrency(token.address),
            destinationCurrency: toRelayCurrency(targetToken),
            amount: token.balance,
            tradeType: 'EXACT_INPUT',
          });

          if (relayQuote.steps && relayQuote.steps.length > 0) {
            // Add bridge step to plan (client-side execution)
            plan.swaps.push({
              router: 'relay',
              fromToken: token,
              toToken: targetToken,
              amountIn: token.balance,
              expectedOut: relayQuote.estimatedOutput || '0',
              estimatedGas: '0', // Gas included in Relay fee
              priceImpact: 0,
              tx: relayQuote.steps[0]?.items[0]?.data ? {
                to: relayQuote.steps[0].items[0].data.to,
                data: relayQuote.steps[0].items[0].data.data,
                value: relayQuote.steps[0].items[0].data.value,
              } : undefined,
            });

            plan.estimatedOutput = (
              parseFloat(plan.estimatedOutput) + parseFloat(relayQuote.estimatedOutput || '0')
            ).toString();

            logger.info(
              { token: token.symbol, requestId: relayQuote.requestId },
              'Relay bridge quote obtained'
            );
            continue;
          }
        } catch (relayError) {
          logger.warn({ error: relayError, token: token.symbol }, 'Relay bridge failed');
        }
      }

      // Relay not supported or failed - try fallback bridge service
      try {
        const bridgeQuotes = await getBridgeQuotes(
          token.chainId,
          OUTPUT_CHAIN_ID,
          token.address,
          token.balance,
          walletAddress
        );
        
        const bridgeDecision = chooseBridge(bridgeQuotes, token.valueUsd);
        
        if (bridgeDecision.shouldBridge && bridgeDecision.selectedBridge) {
          logger.info(
            { token: token.symbol, bridge: bridgeDecision.selectedBridge.bridge },
            'Will bridge token to Base'
          );
          // Add bridge to swaps (future: implement bridge execution)
          continue;
        }
      } catch (bridgeError) {
        logger.warn({ error: bridgeError, token: token.symbol }, 'Bridge service failed');
      }

      // All bridge options failed - skip with clear reason
      const tokenEntry = plan.tokens.find(t => t.token.address === token.address);
      if (tokenEntry) {
        tokenEntry.action = 'skip';
        tokenEntry.reason = `Cross-chain bridge not available (${token.chainId} → ${OUTPUT_CHAIN_ID})`;
      }
      logger.info(
        { token: token.symbol, fromChain: token.chainId },
        'Skipping cross-chain token - no bridge available'
      );

    } catch (error) {
      logger.error({ error, token: token.address }, 'Failed to find route');
      // Mark token as skipped on error
      const tokenEntry = plan.tokens.find(t => t.token.address === token.address);
      if (tokenEntry) {
        tokenEntry.action = 'skip';
        tokenEntry.reason = 'Route finding failed';
      }
    }
  }

  // Estimate total time (assuming sequential execution)
  plan.estimatedTime = plan.swaps.length * 15; // 15 seconds per swap

  logger.info(
    {
      planId: plan.id,
      swapCount: plan.swaps.length,
      estimatedOutput: plan.estimatedOutput,
    },
    'Consolidation plan created'
  );

  return plan;
}

/**
 * Find best swap route across multiple routers (1inch, 0x, Curve, Balancer)
 * Uses real APIs for mainnet production
 */
async function findBestRoute(
  fromToken: TokenHolding,
  toToken: string,
  walletAddress: string
): Promise<SwapRoute | null> {
  const chainId = fromToken.chainId;
  const amountIn = fromToken.balance;

  logger.debug(
    { fromToken: fromToken.address, toToken, chainId },
    'Finding best route across all DEXes'
  );

  // Get quotes from all routers in parallel
  const quotePromises = [
    // 1inch - Primary aggregator
    oneInch.getQuote({
      chainId,
      fromToken: fromToken.address,
      toToken,
      amount: amountIn,
      fromAddress: walletAddress,
    }).catch(e => ({ error: e, router: '1inch' })),
    
    // 0x/Uniswap - Secondary aggregator
    uniswapV4.getQuote({
      chainId,
      fromToken: fromToken.address,
      toToken,
      amount: amountIn,
      fromAddress: walletAddress,
    }).catch(e => ({ error: e, router: 'uniswap_v4' })),
    
    // Curve - Stablecoin specialist
    curve.getQuote({
      chainId,
      fromToken: fromToken.address,
      toToken,
      amount: amountIn,
    }).catch(e => ({ error: e, router: 'curve' })),
    
    // Balancer - Multi-token pools
    balancer.getQuote({
      chainId,
      fromToken: fromToken.address,
      toToken,
      amount: amountIn,
    }).catch(e => ({ error: e, router: 'balancer' })),
  ];

  const quotes = await Promise.all(quotePromises);

  // Find best quote (highest net output after gas)
  let bestQuote: SwapRoute | null = null;
  let bestNetOutput = 0;

  quotes.forEach((result: any) => {
    // Skip failed quotes
    if (result.error) {
      logger.debug({ router: result.router, error: result.error?.message }, 'Quote failed');
      return;
    }

    const quote = result;
    const outputValue = parseFloat(quote.amountOut || '0');
    const gasValue = parseFloat(quote.estimatedGas || '0');
    
    // Calculate net output (output - estimated gas cost in USD)
    // Assume ~$0.01 per 1000 gas on Base
    const gasCostUsd = (gasValue / 1000) * 0.01;
    const netOutput = outputValue - gasCostUsd;

    logger.debug({
      router: quote.router,
      amountOut: quote.amountOut,
      estimatedGas: quote.estimatedGas,
      netOutput: netOutput.toFixed(8),
    }, 'Router quote received');

    if (netOutput > bestNetOutput) {
      bestNetOutput = netOutput;
      bestQuote = {
        router: quote.router,
        fromToken,
        toToken,
        amountIn,
        expectedOut: quote.amountOut,
        estimatedGas: quote.estimatedGas,
        priceImpact: quote.priceImpact || 0,
      };
    }
  });

  if (bestQuote !== null) {
    const route = bestQuote as SwapRoute;
    logger.info({
      router: route.router,
      fromToken: fromToken.symbol,
      toToken,
      expectedOut: route.expectedOut,
      priceImpact: route.priceImpact,
    }, 'Best route selected');
  } else {
    logger.warn({ fromToken: fromToken.address, toToken }, 'No valid route found');
  }

  return bestQuote;
}

/**
 * Execute consolidation plan
 */
export async function executeConsolidation(
  planId: string,
  walletAddress: string,
  plan: ConsolidationPlan
): Promise<{ requestId: string; status: 'pending' | 'success' | 'failed' }> {
  logger.info({ planId, walletAddress }, 'Executing consolidation');

  // Get or create user first
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        walletAddress,
      })
      .returning();
  }

  // Create DB record
  const [request] = await db
    .insert(consolidationRequests)
    .values({
      userId: user.id,
      status: 'PENDING',
      inputTokens: plan.swaps.map((s) => ({
        address: s.fromToken.address,
        chainId: s.fromToken.chainId,
        amountRaw: s.amountIn,
        valueUsd: s.fromToken.valueUsd,
      })),
      outputToken: plan.swaps[0]?.toToken || 'ETH',
      outputChainId: 8453, // Base
      estimatedOutput: plan.estimatedOutput,
      errorMessage: null,
    })
    .returning();

  // Execute swaps sequentially
  let lastTxHash = '';
  try {
    for (const swap of plan.swaps) {
      const txHash = await executeSwap(swap, walletAddress);
      if (txHash) lastTxHash = txHash;
    }

    // Update to success
    await db
      .update(consolidationRequests)
      .set({ 
        status: 'CONFIRMED', 
        actualOutput: plan.estimatedOutput,
        completedAt: new Date(),
        txHash: lastTxHash || null,
      })
      .where(eq(consolidationRequests.id, request.id));

    // Update analytics
    await updateAnalytics(plan, walletAddress);

    return { requestId: request.id, status: 'success' };
  } catch (error) {
    logger.error({ error, planId }, 'Consolidation execution failed');

    // Update to failed
    await db
      .update(consolidationRequests)
      .set({ 
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(consolidationRequests.id, request.id));

    return { requestId: request.id, status: 'failed' };
  }
}

/**
 * Execute single swap or bridge
 */
async function executeSwap(swap: SwapRoute, walletAddress: string): Promise<string> {
  logger.info(
    { router: swap.router, fromToken: swap.fromToken.address },
    'Executing swap'
  );

  // Relay bridges must be executed client-side - skip server execution
  if (swap.router === 'relay') {
    logger.info({ token: swap.fromToken.symbol }, 'Relay bridge - client-side execution required');
    return ''; // Return empty, actual execution happens client-side
  }

  // Get swap transaction
  let swapTx: any;
  
  if (swap.router === '1inch') {
    swapTx = await oneInch.getSwapTx({
      chainId: swap.fromToken.chainId,
      fromToken: swap.fromToken.address,
      toToken: swap.toToken,
      amount: swap.amountIn,
      fromAddress: walletAddress,
      slippage: 0.5,
    });
  }

  if (!swapTx?.tx) {
    throw new Error('Failed to get swap transaction');
  }

  // Simulate on Tenderly
  const simulation = await simulateTransaction({
    chainId: swap.fromToken.chainId,
    from: walletAddress,
    to: swapTx.tx.to,
    data: swapTx.tx.data,
    value: swapTx.tx.value,
  });

  if (!simulation.success) {
    throw new Error(`Simulation failed: ${simulation.errorMessage}`);
  }

  // Build UserOperation
  const userOp = {
    sender: walletAddress,
    nonce: '0', // TODO: Get actual nonce
    initCode: '0x',
    callData: swapTx.tx.data,
    callGasLimit: simulation.gasUsed,
    verificationGasLimit: '100000',
    preVerificationGas: '21000',
    maxFeePerGas: '1000000000',
    maxPriorityFeePerGas: '1000000000',
    paymasterAndData: '0x',
    signature: '0x',
  };

  // Validate paymaster policy before sponsoring
  const estimatedValueUsd = parseFloat(swap.fromToken.valueUsd?.toString() || '0');
  const policyCheck = await validatePaymasterPolicy(
    userOp,
    swap.fromToken.chainId,
    estimatedValueUsd
  );

  if (!policyCheck.allowed) {
    throw new Error(`Paymaster policy violation: ${policyCheck.reason}`);
  }

  // Sponsor with paymaster
  const { result: sponsorData, paymaster } = await sponsorWithFallback(userOp);
  
  userOp.paymasterAndData = sponsorData.paymasterAndData;
  userOp.callGasLimit = sponsorData.callGasLimit;

  logger.info({ paymaster, policyCheck }, 'UserOp sponsored');

  // Send to bundler
  const userOpHash = await sendUserOp(userOp as any);

  // Wait for receipt
  let receipt = null;
  let attempts = 0;
  while (!receipt && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    receipt = await getUserOpReceipt(userOpHash);
    attempts++;
  }

  if (!receipt || !receipt.success) {
    throw new Error('UserOp execution failed');
  }

  const txHash = receipt.receipt.transactionHash;
  logger.info({ userOpHash, txHash }, 'Swap executed');
  
  return txHash;
}

/**
 * Update analytics
 */
async function updateAnalytics(plan: ConsolidationPlan, walletAddress: string): Promise<void> {
  const valueConsolidated = plan.tokens
    .filter((t) => t.action === 'swap')
    .reduce((sum, t) => sum + t.token.valueUsd, 0);

  const date = new Date().toISOString().split('T')[0];
  
  // Check if record exists for today
  const [existing] = await db
    .select()
    .from(consolidationAnalytics)
    .where(eq(consolidationAnalytics.date, date))
    .limit(1);

  if (existing) {
    // Update existing record
    await db
      .update(consolidationAnalytics)
      .set({
        totalConsolidations: existing.totalConsolidations + 1,
        totalDustCleanedUsd: (parseFloat(existing.totalDustCleanedUsd || '0') + valueConsolidated).toString(),
        totalOutputValueUsd: (parseFloat(existing.totalOutputValueUsd || '0') + valueConsolidated).toString(),
        totalBaseTvlAddedUsd: (parseFloat(existing.totalBaseTvlAddedUsd || '0') + valueConsolidated).toString(),
        baseConsolidations: existing.baseConsolidations + 1,
      })
      .where(eq(consolidationAnalytics.date, date));
  } else {
    // Create new record
    await db.insert(consolidationAnalytics).values({
      date,
      totalConsolidations: 1,
      totalDustCleanedUsd: valueConsolidated.toString(),
      totalOutputValueUsd: valueConsolidated.toString(),
      totalGasSavedUsd: '0', // TODO: Calculate
      totalBaseTvlAddedUsd: valueConsolidated.toString(),
      baseConsolidations: 1,
      uniqueUsers: 1,
      newUsers: 1,
      returningUsers: 0,
    });
  }
}

/**
 * Get consolidation status
 */
export async function getConsolidationStatus(requestId: string) {
  const [request] = await db
    .select()
    .from(consolidationRequests)
    .where(eq(consolidationRequests.id, requestId));

  return request || null;
}

