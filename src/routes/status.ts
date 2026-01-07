/**
 * Vortex Protocol - Status Route
 * GET /api/v1/status/:id
 */

import { Elysia, t } from 'elysia';
import { getConsolidationStatus } from '../services/consolidationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('route:status');

export const statusRoute = new Elysia({ prefix: '/api/v1' })
  .get(
    '/status/:id',
    async ({ params, set }) => {
      const { id } = params;

      logger.debug({ requestId: id }, 'Getting consolidation status');

      try {
        const request = await getConsolidationStatus(id);

        if (!request) {
          set.status = 404;
          return {
            success: false,
            error: 'Consolidation request not found',
          };
        }

        return {
          success: true,
          data: {
            requestId: request.id,
            status: request.status,
            tokensIn: request.tokensIn,
            tokenOut: request.tokenOut,
            chainIds: request.chainIds,
            estimatedGasUsd: request.estimatedGasUsd,
            actualGasUsd: request.actualGasUsd,
            outputAmount: request.outputAmount,
            errorMessage: request.errorMessage,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
          },
        };
      } catch (error) {
        logger.error({ error, requestId: id }, 'Failed to get status');
        set.status = 500;
        return {
          success: false,
          error: 'Failed to fetch status',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
        }),
        404: t.Object({
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

