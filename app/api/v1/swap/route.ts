/**
 * Vortex Protocol - Swap API Route (Next.js)
 * Proxies to backend or implements directly
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If backend is available, proxy to it
    if (BACKEND_URL && BACKEND_URL !== 'http://localhost:3001') {
      const response = await fetch(`${BACKEND_URL}/api/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // Fallback: Return mock response
    return NextResponse.json({
      success: true,
      data: {
        requestId: crypto.randomUUID(),
        status: 'pending',
        plan: {
          swapCount: 0,
          estimatedOutput: '0',
          estimatedTime: 0,
        },
      },
    });
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

