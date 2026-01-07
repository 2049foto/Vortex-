/**
 * Vortex Protocol - Analytics Dashboard API Route (Next.js)
 * Implements backend logic directly
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to query database if available
    try {
      // Dynamic import to avoid build-time errors
      const { db } = await import('@/db/client');
      const { consolidationRequests, consolidationAnalytics } = await import('@/db/schema');
      const { sql, desc } = await import('drizzle-orm');

      // Aggregate metrics from consolidation_requests
      const [metrics] = await db
        .select({
          totalConsolidations: sql<number>`COUNT(*)`,
          completedConsolidations: sql<number>`COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)`,
          uniqueUsers: sql<number>`COUNT(DISTINCT user_id)`,
          totalGasSaved: sql<string>`COALESCE(SUM(CAST(gas_sponsored_usd AS DECIMAL)), 0)`,
          totalValue: sql<string>`COALESCE(SUM(CAST(actual_output AS DECIMAL)), 0)`,
        })
        .from(consolidationRequests);

      // Get time-series data (last 30 days)
      const timeSeries = await db
        .select({
          date: consolidationAnalytics.date,
          consolidations: consolidationAnalytics.totalConsolidations,
          volumeUsd: consolidationAnalytics.totalOutputValueUsd,
          gasSavedUsd: consolidationAnalytics.totalGasSavedUsd,
        })
        .from(consolidationAnalytics)
        .orderBy(desc(consolidationAnalytics.date))
        .limit(30);

      // Calculate Base TVL (total value on Base chain)
      const [baseTvl] = await db
        .select({
          tvl: sql<string>`COALESCE(SUM(CAST(actual_output AS DECIMAL)), 0)`,
        })
        .from(consolidationRequests)
        .where(sql`output_chain_id = 8453`); // Base chain ID

      // Recent activity
      const recentActivity = await db
        .select()
        .from(consolidationRequests)
        .orderBy(desc(consolidationRequests.createdAt))
        .limit(10);

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalPortfoliosClean: metrics.completedConsolidations || 0,
            dustValueCleaned: parseFloat(metrics.totalValue || '0').toFixed(2),
            baseTvlAdded: parseFloat(baseTvl?.tvl || '0').toFixed(2),
            gasSaved: parseFloat(metrics.totalGasSaved || '0').toFixed(2),
            totalConsolidations: metrics.totalConsolidations || 0,
            uniqueUsers: metrics.uniqueUsers || 0,
          },
          timeSeries: timeSeries.reverse(), // Chronological order
          recentActivity: recentActivity.map((activity) => ({
            id: activity.id,
            user: activity.userId,
            status: activity.status,
            tokenCount: Array.isArray(activity.inputTokens) ? activity.inputTokens.length : 0,
            createdAt: activity.createdAt,
          })),
        },
      });
    } catch (dbError) {
      // Database not available, return mock data
      console.warn('Database not available, using mock data:', dbError);
      
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
    }
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

