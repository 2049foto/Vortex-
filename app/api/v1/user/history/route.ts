/**
 * Vortex Protocol - User History API Route (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'walletAddress is required' },
        { status: 400 }
      );
    }
    
    // If backend is available, proxy to it
    if (BACKEND_URL && BACKEND_URL !== 'http://localhost:3001') {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/user/history?walletAddress=${walletAddress}&limit=${limit}&offset=${offset}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // Fallback: Return mock history
    return NextResponse.json({
      success: true,
      data: {
        requests: [],
        summary: {
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          totalGasSaved: '0.00',
          totalValueConsolidated: '0.00',
        },
      },
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

