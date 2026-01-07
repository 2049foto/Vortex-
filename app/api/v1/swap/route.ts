/**
 * Vortex Protocol - Swap/Consolidation API Route (Next.js)
 * Uses real DEX APIs for mainnet production
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, selectedTokens, outputToken, slippagePct, dryRun } = body;

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
      // Dynamic imports to avoid build-time errors
      const { scanWallet } = await import('@/services/portfolioService');
      const { batchCalculateRiskScores } = await import('@/services/riskScoringService');
      const { createConsolidationPlan, executeConsolidation } = await import('@/services/consolidationService');

      // Step 1: Fetch full token data for selected tokens
      const chainIds = [...new Set(selectedTokens.map((t: any) => t.chainId))] as number[];
      const allTokens = await scanWallet(walletAddress, chainIds);

      // Filter to only selected tokens
      const tokensToConsolidate = allTokens.filter((token) =>
        selectedTokens.some(
          (s: any) =>
            s.address.toLowerCase() === token.address.toLowerCase() &&
            s.chainId === token.chainId
        )
      );

      if (tokensToConsolidate.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Selected tokens not found in wallet' },
          { status: 400 }
        );
      }

      // Step 2: Calculate risk scores
      const riskScores = await batchCalculateRiskScores(tokensToConsolidate);

      // Step 3: Create consolidation plan
      const targetToken = outputToken === 'USDC' 
        ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
        : '0x4200000000000000000000000000000000000006'; // WETH on Base
      
      const plan = await createConsolidationPlan(
        walletAddress,
        tokensToConsolidate,
        riskScores,
        targetToken
      );

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
              })),
            },
          },
        });
      }

      // Step 4: Execute consolidation (real mainnet execution)
      const result = await executeConsolidation(plan.id, walletAddress, plan);

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

