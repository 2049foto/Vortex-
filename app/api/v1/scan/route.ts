/**
 * Vortex Protocol - Scan API Route (Next.js)
 * Implements backend logic directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTurnstile } from '@/middleware/turnstile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, chainIds, turnstileToken } = body;

    // Verify Turnstile token (bot protection)
    try {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      await requireTurnstile(turnstileToken || '', clientIp);
    } catch (turnstileError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot verification failed',
          message: turnstileError instanceof Error ? turnstileError.message : 'Please complete the verification',
        },
        { status: 403 }
      );
    }

    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address',
        },
        { status: 400 }
      );
    }

    // Try to use backend services if available
    try {
      // Dynamic import to avoid build-time errors
      const { scanWallet } = await import('@/services/portfolioService');
      const { batchCalculateRiskScoresV2 } = await import('@/services/riskScoringServiceV2');
      const { notifyDustFound } = await import('@/services/farcasterService');

      // Step 1: Scan wallet for tokens
      const tokens = await scanWallet(walletAddress, chainIds);

      if (tokens.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            wallet: walletAddress,
            tokens: [],
            summary: {
              totalTokens: 0,
              totalValue: 0,
              byTier: { LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 },
              consolidationOpportunity: {
                tokenCount: 0,
                totalValue: 0,
              },
            },
          },
        });
      }

      // Step 2: Calculate risk scores (using V2 with all 12 layers)
      const riskScores = await batchCalculateRiskScoresV2(tokens);

      // Step 3: Merge tokens with risk data
      const tokensWithRisk = tokens.map((token) => {
        const riskKey = `${token.chainId}:${token.address}`;
        const risk = riskScores.get(riskKey);

        return {
          ...token,
          tier: risk?.tier || 'LEGIT',
          riskScore: risk?.riskScore0to100 || 0,
          reasons: risk ? Object.values(risk.layers).flatMap(l => l.evidence) : [],
          recommendations: risk?.explanation ? [risk.explanation] : [],
        };
      });

      // Step 4: Generate summary
      const dustTokens = tokensWithRisk.filter((t) => t.tier === 'DUST' || t.tier === 'MICRODUST');
      const dustValue = dustTokens.reduce((sum, t) => sum + t.valueUsd, 0);
      
      const summary = {
        totalTokens: tokensWithRisk.length,
        totalValue: tokensWithRisk.reduce((sum, t) => sum + t.valueUsd, 0),
        byTier: {
          LEGIT: tokensWithRisk.filter((t) => t.tier === 'LEGIT').length,
          DUST: tokensWithRisk.filter((t) => t.tier === 'DUST').length,
          MICRODUST: tokensWithRisk.filter((t) => t.tier === 'MICRODUST').length,
          RISK: tokensWithRisk.filter((t) => t.tier === 'RISK').length,
        },
        consolidationOpportunity: {
          tokenCount: dustTokens.length,
          totalValue: dustValue,
        },
      };

      // Step 5: Send notification if dust found (threshold: $10)
      if (dustValue >= 10 && dustTokens.length > 0) {
        try {
          await notifyDustFound(walletAddress, dustValue, dustTokens.length);
        } catch (notifError) {
          // Don't fail the scan if notification fails
          console.warn('Failed to send dust notification:', notifError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          wallet: walletAddress,
          tokens: tokensWithRisk,
          summary,
        },
      });
    } catch (serviceError) {
      // Services not available, return mock data
      console.warn('Backend services not available, using mock data:', serviceError);
      
      return NextResponse.json({
        success: true,
        data: {
          wallet: walletAddress,
          tokens: [],
          summary: {
            totalTokens: 0,
            totalValue: 0,
            byTier: { LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 },
            consolidationOpportunity: {
              tokenCount: 0,
              totalValue: 0,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan wallet',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

