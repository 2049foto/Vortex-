/**
 * Vortex Protocol - Analytics Dashboard API Route (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // If backend is available, proxy to it
    if (BACKEND_URL && BACKEND_URL !== 'http://localhost:3001') {
      const response = await fetch(`${BACKEND_URL}/api/v1/analytics/dashboard`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // Fallback: Return mock analytics data
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPortfoliosClean: 0,
          dustValueCleaned: '0.00',
          baseTvlAdded: '0.00',
          gasSaved: '0.00',
          totalConsolidations: 0,
          uniqueUsers: 0,
        },
        timeSeries: [],
        recentActivity: [],
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

