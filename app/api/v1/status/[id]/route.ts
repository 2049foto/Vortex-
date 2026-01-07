/**
 * Vortex Protocol - Status API Route (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // If backend is available, proxy to it
    if (BACKEND_URL && BACKEND_URL !== 'http://localhost:3001') {
      const response = await fetch(`${BACKEND_URL}/api/v1/status/${id}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // Fallback: Return mock status
    return NextResponse.json({
      success: true,
      data: {
        requestId: id,
        status: 'pending',
        tokensIn: [],
        tokenOut: '',
        chainIds: [],
        estimatedGasUsd: '0',
        actualGasUsd: '0',
        outputAmount: '0',
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

