/**
 * Vortex Protocol - User Route
 * GET /api/v1/user/history
 */

import { Elysia, t } from 'elysia';
import { db } from '../db/client';
import { consolidationRequests } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('route:user');

export const userRoute = new Elysia({ prefix: '/api/v1/user' })
  .get(
    '/history',
    async ({ query, set }) => {
      const { walletAddress, limit = 10, offset = 0 } = query;

      if (!walletAddress) {
        set.status = 400;
        return {
          success: false,
          error: 'walletAddress is required',
        };
      }

      logger.debug({ walletAddress, limit, offset }, 'Fetching user history');

      try {
        const requests = await db
          .select()
          .from(consolidationRequests)
          .where(eq(consolidationRequests.userId, walletAddress))
          .orderBy(desc(consolidationRequests.createdAt))
          .limit(limit)
          .offset(offset);

        // Calculate summary stats
        const completed = requests.filter((r) => r.status === 'completed');
        const totalGasSaved = completed.reduce(
          (sum, r) => sum + parseFloat(r.actualGasUsd || '0'),
          0
        );
        const totalValueConsolidated = completed.reduce(
          (sum, r) => sum + parseFloat(r.outputAmount || '0'),
          0
        );

        return {
          success: true,
          data: {
            requests,
            summary: {
              total: requests.length,
              completed: completed.length,
              pending: requests.filter((r) => r.status === 'pending').length,
              failed: requests.filter((r) => r.status === 'failed').length,
              totalGasSaved: totalGasSaved.toFixed(2),
              totalValueConsolidated: totalValueConsolidated.toFixed(2),
            },
          },
        };
      } catch (error) {
        logger.error({ error, walletAddress }, 'Failed to fetch history');
        set.status = 500;
        return {
          success: false,
          error: 'Failed to fetch history',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      query: t.Object({
        walletAddress: t.String({
          pattern: '^0x[a-fA-F0-9]{40}$',
        }),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Number({ minimum: 0 })),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
        }),
        400: t.Object({
          success: t.Boolean(),
          error: t.String(),
        }),
        500: t.Object({
          success: t.Boolean(),
          error: t.String(),
          message: t.Optional(t.String()),
        }),
      },
    }
  );

