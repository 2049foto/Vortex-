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
    const { walletAddress, selectedTokens, outputToken, slippagePct, dryRun, turnstileToken } = body;

    // Verify Turnstile token (bot protection) - FAIL OPEN for better UX
    let turnstileVerified = false;
    try {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      await requireTurnstile(turnstileToken || '', clientIp);
      turnstileVerified = true;
    } catch (turnstileError) {
      // Log but don't block - fail open
      console.warn('Turnstile verification failed (allowing):', turnstileError);
    }

    // Validate required fields
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    if (!selectedTokens || selectedTokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tokens selected for consolidation' },
        { status: 400 }
      );
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

      // If dry run, return plan without execution
      if (dryRun) {
        return NextResponse.json({
          success: true,
          data: {
            requestId: plan.id,
            status: 'simulated',
            plan: {
              swapCount: plan.swaps.length,
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
              swaps: plan.swaps.map((s) => ({
                router: s.router,
                fromToken: s.fromToken.symbol,
                toToken: outputToken || 'ETH',
                expectedOut: s.expectedOut,
                priceImpact: s.priceImpact,
                // Include Relay tx data for client-side execution
                tx: s.tx,
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

      // Step 4: For Relay bridges, return plan for client-side execution
      const hasRelayBridges = plan.swaps.some(s => s.router === 'relay');
      
      if (hasRelayBridges) {
        // Return plan with Relay tx data - client will execute
        return NextResponse.json({
          success: true,
          data: {
            requestId: plan.id,
            status: 'pending_client_execution',
            requiresClientExecution: true,
            plan: {
              swapCount: plan.swaps.length,
              estimatedOutput: plan.estimatedOutput,
              estimatedGasSaved: plan.estimatedGasSaved,
              swaps: plan.swaps.map((s) => ({
                router: s.router,
                fromToken: s.fromToken.symbol,
                fromTokenAddress: s.fromToken.address,
                fromChainId: s.fromToken.chainId,
                toToken: outputToken || 'ETH',
                expectedOut: s.expectedOut,
                priceImpact: s.priceImpact,
                tx: s.tx, // Relay tx data for client execution
              })),
            },
            message: 'Cross-chain swap requires wallet signature. Please approve transactions.',
          },
        });
      }

      // Step 5: Execute same-chain swaps server-side
      const result = await executeConsolidation(plan.id, walletAddress, plan);

      // Step 5: Send notification on completion
      if (result.status === 'success') {
        try {
          // Get consolidation request to get txHash
          const { getConsolidationStatus } = await import('@/services/consolidationService');
          const consolidation = await getConsolidationStatus(result.requestId);
          
          const outputValue = parseFloat(plan.estimatedOutput || '0');
          const gasSaved = parseFloat(plan.estimatedGasSaved || '0');
          const txHash = consolidation?.txHash || '';
          
          await notifyConsolidationComplete(walletAddress, outputValue, gasSaved, txHash);
        } catch (notifError) {
          // Don't fail if notification fails
          console.warn('Failed to send completion notification:', notifError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          requestId: result.requestId,
          status: result.status,
          plan: {
            swapCount: plan.swaps.length,
            estimatedOutput: plan.estimatedOutput,
            estimatedGasSaved: plan.estimatedGasSaved,
          },
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

