/**
 * Vortex Protocol - Scan API Route (Next.js)
 * Proxies to backend or implements directly
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If backend is available, proxy to it
    if (BACKEND_URL && BACKEND_URL !== 'http://localhost:3001') {
      const response = await fetch(`${BACKEND_URL}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // Fallback: Return mock data for development
    return NextResponse.json({
      success: true,
      data: {
        wallet: body.walletAddress,
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

