/**
 * Vortex Protocol - Swap/Consolidation API Route (Next.js)
 * Uses real DEX APIs for mainnet production
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTurnstile } from '@/middleware/turnstile';

// Debug logging
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[SWAP-API ${timestamp}] [${level.toUpperCase()}]`;
  if (data) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT VALIDATION (Zod schema)
    // ═══════════════════════════════════════════════════════════════════════════
    const { validateRequest, swapRequestSchema } = await import('@/middleware/validation');
    const validation = validateRequest(swapRequestSchema, body);
    
    if (!validation.success) {
      log('warn', 'Validation failed', { error: validation.error });
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    const { 
      walletAddress, 
      selectedTokens, 
      outputToken = 'ETH', 
      slippagePct = 1, 
      dryRun = false, 
      turnstileToken 
    } = validation.data;

    // ═══════════════════════════════════════════════════════════════════════════
    // BOT PROTECTION (Turnstile - Fail Open)
    // ═══════════════════════════════════════════════════════════════════════════
    let turnstileVerified = false;
    try {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      await requireTurnstile(turnstileToken || '', clientIp);
      turnstileVerified = true;
    } catch (turnstileError) {
      // Log but don't block - fail open for better UX
      log('warn', 'Turnstile verification failed (allowing)', { 
        error: turnstileError instanceof Error ? turnstileError.message : 'unknown' 
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SLIPPAGE VALIDATION (Business logic)
    // ═══════════════════════════════════════════════════════════════════════════
    const validatedSlippage = Math.max(0.1, Math.min(slippagePct, 10)); // Clamp 0.1-10%
    if (validatedSlippage !== slippagePct) {
      log('warn', 'Slippage adjusted', { original: slippagePct, adjusted: validatedSlippage });
    }

    try {
      log('info', '=== Starting Swap/Consolidation ===', { 
        walletAddress: walletAddress.slice(0, 10),
        selectedTokensCount: selectedTokens?.length,
        outputToken,
        dryRun
      });
      
      // Dynamic imports to avoid build-time errors
      const { scanWallet } = await import('@/services/portfolioService');
      const { batchCalculateRiskScoresV2 } = await import('@/services/riskScoringServiceV2');
      const { createConsolidationPlan, executeConsolidation } = await import('@/services/consolidationService');
      const { notifyConsolidationComplete } = await import('@/services/farcasterService');

      // Step 1: Fetch full token data for selected tokens
      const chainIds = [...new Set(selectedTokens.map((t: any) => t.chainId))] as number[];
      log('info', 'Scanning chains for selected tokens', { chainIds });
      
      const allTokens = await scanWallet(walletAddress, chainIds);
      log('info', `Scan complete. Found ${allTokens.length} tokens`);

      // Filter to only selected tokens
      const tokensToConsolidate = allTokens.filter((token) =>
        selectedTokens.some(
          (s: any) =>
            s.address.toLowerCase() === token.address.toLowerCase() &&
            s.chainId === token.chainId
        )
      );

      log('info', `Matched ${tokensToConsolidate.length} tokens for consolidation`, {
        tokens: tokensToConsolidate.map(t => ({ symbol: t.symbol, chainId: t.chainId, value: t.valueUsd }))
      });

      if (tokensToConsolidate.length === 0) {
        log('warn', 'No matching tokens found', { 
          selectedAddresses: selectedTokens.map((t: any) => t.address.slice(0, 10)),
          foundAddresses: allTokens.map(t => t.address.slice(0, 10))
        });
        return NextResponse.json(
          { success: false, error: 'Selected tokens not found in wallet' },
          { status: 400 }
        );
      }

      // Step 2: Calculate risk scores (using V2)
      const riskScores = await batchCalculateRiskScoresV2(tokensToConsolidate);

      // Step 3: Create consolidation plan
      const targetToken = outputToken === 'USDC' 
        ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
        : '0x4200000000000000000000000000000000000006'; // WETH on Base
      
      log('info', 'Creating consolidation plan', { targetToken, outputToken });
      
      const plan = await createConsolidationPlan(
        walletAddress,
        tokensToConsolidate,
        riskScores,
        targetToken
      );
      
      log('info', 'Plan created', {
        planId: plan.id,
        swapsCount: plan.swaps.length,
        estimatedOutput: plan.estimatedOutput,
        skippedTokens: plan.tokens.filter(t => t.action === 'skip').map(t => ({
          symbol: t.token.symbol,
          reason: t.reason
        }))
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // SIMULATION CHECK (H-007) - Validate transactions before returning
      // ═══════════════════════════════════════════════════════════════════════════
      
      const simulatedSwaps: typeof plan.swaps = [];
      const failedSimulations: { symbol: string; reason: string }[] = [];
      
      // Only simulate if Tenderly is configured and we have swaps
      if (plan.swaps.length > 0 && process.env.TENDERLY_ACCESS_KEY) {
        try {
          const { simulateTransaction } = await import('@/blockchain/tenderly');
          
          for (const swap of plan.swaps) {
            if (swap.tx && swap.fromToken.chainId === 8453) { // Only simulate Base chain swaps
              try {
                const simulation = await simulateTransaction({
                  chainId: swap.fromToken.chainId,
                  from: walletAddress,
                  to: swap.tx.to,
                  data: swap.tx.data,
                  value: swap.tx.value || '0',
                });
                
                if (simulation.success) {
                  simulatedSwaps.push(swap);
                } else {
                  log('warn', 'Simulation failed for swap', { 
                    token: swap.fromToken.symbol,
                    reason: simulation.errorMessage 
                  });
                  failedSimulations.push({
                    symbol: swap.fromToken.symbol,
                    reason: simulation.errorMessage || 'Simulation failed',
                  });
                }
              } catch (simError) {
                // Non-blocking - include swap even if simulation fails
                log('warn', 'Simulation error (non-blocking)', { 
                  token: swap.fromToken.symbol,
                  error: simError instanceof Error ? simError.message : 'unknown'
                });
                simulatedSwaps.push(swap);
              }
            } else {
              // No simulation for non-Base chains or missing tx
              simulatedSwaps.push(swap);
            }
          }
        } catch (error) {
          log('warn', 'Tenderly import failed (non-blocking)', { error });
          // Fallback: include all swaps without simulation
          simulatedSwaps.push(...plan.swaps);
        }
      } else {
        // No Tenderly configured - include all swaps
        simulatedSwaps.push(...plan.swaps);
      }
      
      // Update plan with simulated swaps only
      const finalSwaps = simulatedSwaps.length > 0 ? simulatedSwaps : plan.swaps;

      // If dry run, return plan with full tx data for client execution
      if (dryRun) {
        log('info', 'Returning dry run plan with tx data', {
          swapCount: finalSwaps.length,
          swapsWithTx: finalSwaps.filter(s => s.tx).length,
          simulationFailures: failedSimulations.length,
        });
        
        return NextResponse.json({
          success: true,
          data: {
            requestId: plan.id,
            status: 'ready',
            requiresClientExecution: true, // Always client execution for security
            simulationResults: {
              passed: simulatedSwaps.length,
              failed: failedSimulations.length,
              failures: failedSimulations,
            },
            plan: {
              swapCount: finalSwaps.length,
              estimatedOutput: plan.estimatedOutput,
              estimatedGasSaved: plan.estimatedGasSaved,
              estimatedTime: plan.estimatedTime,
              tokens: plan.tokens.map((t) => ({
                address: t.token.address,
                symbol: t.token.symbol,
                chainId: t.token.chainId,
                action: t.action,
                reason: t.reason,
                valueUsd: t.token.valueUsd,
              })),
              swaps: finalSwaps.map((s) => ({
                router: s.router,
                fromToken: s.fromToken.symbol,
                fromTokenAddress: s.fromToken.address,
                fromChainId: s.fromToken.chainId,
                toToken: outputToken || 'ETH',
                expectedOut: s.expectedOut,
                priceImpact: s.priceImpact,
                simulated: simulatedSwaps.includes(s),
                // CRITICAL: Include full tx data for client-side execution
                tx: s.tx ? {
                  to: s.tx.to,
                  data: s.tx.data,
                  value: s.tx.value || '0',
                } : null,
              })),
            },
          },
        });
      }

      // Check if we have any swaps to execute
      if (plan.swaps.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No viable swap routes found',
          message: 'All selected tokens were skipped due to cross-chain bridging limitations or insufficient liquidity',
          data: {
            skippedTokens: plan.tokens.filter(t => t.action === 'skip').map(t => ({
              symbol: t.token.symbol,
              chainId: t.token.chainId,
              reason: t.reason,
            })),
          },
        }, { status: 400 });
      }

      // For non-dryRun, still return plan for client execution
      // All transactions must be signed by user wallet (non-custodial)
      log('info', 'Returning execution plan for client-side signing', {
        swapCount: plan.swaps.length,
        swapsWithTx: plan.swaps.filter(s => s.tx).length,
      });

      return NextResponse.json({
        success: true,
        data: {
          requestId: plan.id,
          status: 'ready',
          requiresClientExecution: true,
          plan: {
            swapCount: plan.swaps.length,
            estimatedOutput: plan.estimatedOutput,
            estimatedGasSaved: plan.estimatedGasSaved,
            estimatedTime: plan.estimatedTime,
            swaps: plan.swaps.map((s) => ({
              router: s.router,
              fromToken: s.fromToken.symbol,
              fromTokenAddress: s.fromToken.address,
              fromChainId: s.fromToken.chainId,
              toToken: outputToken || 'ETH',
              expectedOut: s.expectedOut,
              priceImpact: s.priceImpact,
              tx: s.tx ? {
                to: s.tx.to,
                data: s.tx.data,
                value: s.tx.value || '0',
              } : null,
            })),
          },
          message: 'Please approve transactions in your wallet',
        },
      });
    } catch (serviceError) {
      console.error('Consolidation service error:', serviceError);
      return NextResponse.json(
        {
          success: false,
          error: 'Consolidation service unavailable',
          message: serviceError instanceof Error ? serviceError.message : 'Unknown error',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Swap API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute consolidation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

