/**
 * Vortex Protocol - Swap Route
 * POST /api/v1/swap
 */

import { Elysia, t } from 'elysia';
import { createConsolidationPlan, executeConsolidation } from '../services/consolidationService';
import { scanWallet } from '../services/portfolioService';
import { batchCalculateRiskScores } from '../services/riskScoringService';
import { createLogger } from '../utils/logger';

const logger = createLogger('route:swap');

export const swapRoute = new Elysia({ prefix: '/api/v1' })
  .post(
    '/swap',
    async ({ body, set }) => {
      const { walletAddress, tokenAddresses, targetToken, chainId } = body;

      logger.info({ walletAddress, tokenCount: tokenAddresses?.length || 'all' }, 'Creating consolidation');

      try {
        // Step 1: Scan wallet to get current holdings
        const allTokens = await scanWallet(walletAddress, chainId ? [chainId] : undefined);

        // Step 2: Filter tokens to consolidate
        let tokensToConsolidate = allTokens;
        if (tokenAddresses && tokenAddresses.length > 0) {
          tokensToConsolidate = allTokens.filter((token) =>
            tokenAddresses.some(
              (addr) => addr.toLowerCase() === token.address.toLowerCase()
            )
          );
        }

        if (tokensToConsolidate.length === 0) {
          set.status = 400;
          return {
            success: false,
            error: 'No tokens found to consolidate',
          };
        }

        // Step 3: Calculate risk scores
        const riskScores = await batchCalculateRiskScores(tokensToConsolidate);

        // Step 4: Create consolidation plan
        const plan = await createConsolidationPlan(
          walletAddress,
          tokensToConsolidate,
          riskScores,
          targetToken
        );

        if (plan.swaps.length === 0) {
          set.status = 400;
          return {
            success: false,
            error: 'No viable swaps found. Tokens may be too risky or have insufficient liquidity.',
          };
        }

        // Step 5: Execute consolidation
        const result = await executeConsolidation(plan.id, walletAddress, plan);

        logger.info(
          {
            walletAddress,
            requestId: result.requestId,
            status: result.status,
          },
          'Consolidation initiated'
        );

        return {
          success: true,
          data: {
            requestId: result.requestId,
            status: result.status,
            plan: {
              swapCount: plan.swaps.length,
              estimatedOutput: plan.estimatedOutput,
              estimatedTime: plan.estimatedTime,
            },
          },
        };
      } catch (error) {
        logger.error({ error, walletAddress }, 'Swap failed');
        set.status = 500;
        return {
          success: false,
          error: 'Failed to execute consolidation',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    {
      body: t.Object({
        walletAddress: t.String({
          pattern: '^0x[a-fA-F0-9]{40}$',
          error: 'Invalid wallet address',
        }),
        tokenAddresses: t.Optional(
          t.Array(
            t.String({
              pattern: '^0x[a-fA-F0-9]{40}$',
            })
          )
        ),
        targetToken: t.Optional(t.String()),
        chainId: t.Optional(t.Number()),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Object({
            requestId: t.String(),
            status: t.String(),
            plan: t.Any(),
          }),
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

