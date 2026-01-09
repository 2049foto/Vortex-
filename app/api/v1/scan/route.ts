/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Scan API Route 2026
 * Production-ready with validation, rate limiting, and error handling
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, scanRequestSchema, detectSuspiciousRequest } from '@/middleware/validation';

// Debug logging helper
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[SCAN-API ${timestamp}] [${level.toUpperCase()}]`;
  if (data) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// Overall timeout for serverless function (Vercel limit is 10s for hobby, 60s for pro)
const OVERALL_TIMEOUT = 25000; // 25 seconds

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  log('info', '=== Scan API Request Started ===');
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Scan timeout - please try again'));
    }, OVERALL_TIMEOUT);
  });
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request with Zod schema
    const validation = validateRequest(scanRequestSchema, body);
    if (!validation.success) {
      log('warn', 'Validation failed', { error: validation.error });
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { walletAddress, chainIds, includeSolana, solanaAddress, turnstileToken } = validation.data;
    
    log('info', 'Request validated', { 
      walletAddress: walletAddress.substring(0, 10) + '...', 
      chainIds,
      includeSolana,
      hasTurnstileToken: !!turnstileToken 
    });

    // Check for suspicious request patterns
    const suspicionCheck = detectSuspiciousRequest({
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
    });

    if (suspicionCheck.suspicious) {
      log('warn', 'Suspicious request detected', { reasons: suspicionCheck.reasons });
      // Don't block, but log for monitoring
    }

    // Turnstile verification - fail-open
    let turnstileVerified = false;
    try {
      const { requireTurnstile } = await import('@/middleware/turnstile');
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      await requireTurnstile(turnstileToken || '', clientIp);
      turnstileVerified = true;
      log('info', 'Turnstile verification passed');
    } catch (turnstileError) {
      log('warn', 'Turnstile verification failed, continuing (fail-open)', { 
        error: turnstileError instanceof Error ? turnstileError.message : 'unknown' 
      });
    }

    // Try to use backend services
    try {
      // Load services
      const { scanWallet } = await import('@/services/portfolioService');
      const { batchCalculateRiskScoresV2 } = await import('@/services/riskScoringServiceV2');

      // Step 1: Scan wallet for tokens with optional Solana
      log('info', 'Starting wallet scan...', { walletAddress, chainIds, includeSolana });
      
      // Race with timeout
      const tokens = await Promise.race([
        scanWallet(walletAddress, chainIds, {
          includeSolana,
          solanaAddress: solanaAddress || undefined,
        }),
        timeoutPromise,
      ]);
      
      log('info', `Scan complete. Found ${tokens.length} tokens in ${Date.now() - startTime}ms`);

      if (tokens.length === 0) {
        log('info', 'No tokens found for wallet');
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
      // Race with remaining time (leave 3s buffer for response)
      const remainingTime = OVERALL_TIMEOUT - (Date.now() - startTime) - 3000;
      log('info', `Calculating risk scores... (${remainingTime}ms remaining)`);
      
      let riskScores: Map<string, any> = new Map();
      try {
        const riskTimeout = new Promise<Map<string, any>>((_, reject) => {
          setTimeout(() => reject(new Error('Risk scoring timeout')), Math.max(remainingTime, 5000));
        });
        
        riskScores = await Promise.race([
          batchCalculateRiskScoresV2(tokens),
          riskTimeout,
        ]);
        log('info', `Risk scores calculated for ${riskScores.size} tokens`);
      } catch (riskError) {
        log('warn', 'Risk scoring failed/timeout, using value-based classification', { 
          error: riskError instanceof Error ? riskError.message : 'unknown' 
        });
        // Continue without risk scores - will use value-based tier classification
      }

      // Step 3: Merge tokens with risk data
      const tokensWithRisk = tokens.map((token) => {
        const riskKey = `${token.chainId}:${token.address}`;
        const risk = riskScores.get(riskKey);

        // Determine tier based on value and risk
        let tier = 'LEGIT';
        if (risk?.tier) {
          tier = risk.tier;
        } else if (risk?.riskScore0to100 >= 70) {
          tier = 'RISK';
        } else if (token.valueUsd < 0.1) {
          tier = 'MICRODUST';
        } else if (token.valueUsd < 10) {
          tier = 'DUST';
        }

        return {
          ...token,
          tier,
          riskScore: risk?.riskScore0to100 || 0,
          reasons: risk ? Object.values(risk.layers || {}).flatMap((l: any) => l.evidence || []) : [],
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

      log('info', 'Scan complete', { summary });

      // Try to send notification (non-blocking)
      if (dustValue >= 10 && dustTokens.length > 0) {
        try {
          const { notifyDustFound } = await import('@/services/farcasterService');
          await notifyDustFound(walletAddress, dustValue, dustTokens.length);
        } catch (notifError) {
          log('warn', 'Notification failed (non-blocking)', { 
            error: notifError instanceof Error ? notifError.message : 'unknown' 
          });
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
      const errorMessage = serviceError instanceof Error ? serviceError.message : 'Unknown service error';
      const errorStack = serviceError instanceof Error ? serviceError.stack : '';
      
      log('error', 'Service error occurred', { 
        message: errorMessage,
        stack: errorStack?.substring(0, 500)
      });
      
      // Return detailed error instead of empty mock data
      return NextResponse.json({
        success: false,
        error: 'Portfolio scan service error',
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? errorStack?.substring(0, 500) : undefined,
      }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Scan API fatal error', { message: errorMessage });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan wallet',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'scan-api',
    timestamp: new Date().toISOString(),
    env: {
      hasMoralisKey: !!process.env.MORALIS_API_KEY,
      hasAlchemyKey: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    }
  });
}