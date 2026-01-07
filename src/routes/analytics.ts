/**
 * Vortex Protocol - Analytics Route
 * GET /api/v1/analytics/dashboard
 */

import { Elysia, t } from 'elysia';
import { db } from '../db/client';
import { consolidationRequests, consolidationAnalytics } from '../db/schema';
import { sql, desc } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('route:analytics');

export const analyticsRoute = new Elysia({ prefix: '/api/v1/analytics' })
  .get(
    '/dashboard',
    async ({ set }) => {
      logger.debug('Fetching dashboard analytics');

      try {
        // Aggregate metrics from consolidation_requests
        const [metrics] = await db
          .select({
            totalConsolidations: sql<number>`COUNT(*)`,
            completedConsolidations: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
            uniqueUsers: sql<number>`COUNT(DISTINCT user_id)`,
            totalGasSaved: sql<string>`COALESCE(SUM(CAST(actual_gas_usd AS DECIMAL)), 0)`,
            totalValue: sql<string>`COALESCE(SUM(CAST(output_amount AS DECIMAL)), 0)`,
          })
          .from(consolidationRequests);

        // Get time-series data (last 30 days)
        const timeSeries = await db
          .select({
            date: consolidationAnalytics.date,
            consolidations: consolidationAnalytics.totalConsolidations,
            volumeUsd: consolidationAnalytics.volumeUsd,
            gasSavedUsd: consolidationAnalytics.gasSavedUsd,
          })
          .from(consolidationAnalytics)
          .orderBy(desc(consolidationAnalytics.date))
          .limit(30);

        // Calculate Base TVL (total value on Base chain)
        const [baseTvl] = await db
          .select({
            tvl: sql<string>`COALESCE(SUM(CAST(output_amount AS DECIMAL)), 0)`,
          })
          .from(consolidationRequests)
          .where(sql`8453 = ANY(chain_ids)`); // Base chain ID

        // Recent activity
        const recentActivity = await db
          .select()
          .from(consolidationRequests)
          .orderBy(desc(consolidationRequests.createdAt))
          .limit(10);

        const data = {
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
            tokenCount: activity.tokensIn.length,
            createdAt: activity.createdAt,
          })),
        };

        logger.info({ metrics: data.overview }, 'Dashboard analytics fetched');

        return {
          success: true,
          data,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to fetch analytics');
        set.status = 500;
        return {
          success: false,
          error: 'Failed to fetch analytics',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
        }),
        500: t.Object({
          success: t.Boolean(),
          error: t.String(),
          message: t.Optional(t.String()),
        }),
      },
    }
  );

