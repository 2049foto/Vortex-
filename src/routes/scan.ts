/**
 * Vortex Protocol - Scan Route
 * POST /api/v1/scan
 */

import { Elysia, t } from 'elysia';
import { scanWallet } from '../services/portfolioService';
import { batchCalculateRiskScores } from '../services/riskScoringService';
import { createLogger } from '../utils/logger';

const logger = createLogger('route:scan');

export const scanRoute = new Elysia({ prefix: '/api/v1' })
  .post(
    '/scan',
    async ({ body, set }) => {
      const { walletAddress, chainIds } = body;

      logger.info({ walletAddress, chainIds }, 'Scanning wallet');

      try {
        // Step 1: Fetch all token holdings
        const tokens = await scanWallet(walletAddress, chainIds);

        if (tokens.length === 0) {
          return {
            success: true,
            data: {
              wallet: walletAddress,
              tokens: [],
              summary: {
                totalTokens: 0,
                totalValue: 0,
                byTier: { LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 },
              },
            },
          };
        }

        // Step 2: Calculate risk scores for all tokens
        const riskScores = await batchCalculateRiskScores(tokens);

        // Step 3: Merge tokens with risk data
        const tokensWithRisk = tokens.map((token) => {
          const riskKey = `${token.chainId}:${token.address}`;
          const risk = riskScores.get(riskKey);

          return {
            ...token,
            tier: risk?.tier || 'LEGIT',
            riskScore: risk?.totalScore || 0,
            reasons: risk?.reasons || [],
            recommendations: risk?.recommendations || [],
          };
        });

        // Step 4: Generate summary
        const summary = {
          totalTokens: tokensWithRisk.length,
          totalValue: tokensWithRisk.reduce((sum, t) => sum + t.valueUsd, 0),
          byTier: {
            LEGIT: tokensWithRisk.filter((t) => t.tier === 'LEGIT').length,
            DUST: tokensWithRisk.filter((t) => t.tier === 'DUST').length,
            MICRODUST: tokensWithRisk.filter((t) => t.tier === 'MICRODUST').length,
            RISK: tokensWithRisk.filter((t) => t.tier === 'RISK').length,
          },
          consolidationOpportunity: {
            tokenCount: tokensWithRisk.filter((t) => t.tier === 'DUST' || t.tier === 'MICRODUST').length,
            totalValue: tokensWithRisk
              .filter((t) => t.tier === 'DUST' || t.tier === 'MICRODUST')
              .reduce((sum, t) => sum + t.valueUsd, 0),
          },
        };

        logger.info(
          {
            walletAddress,
            totalTokens: summary.totalTokens,
            totalValue: summary.totalValue,
          },
          'Scan complete'
        );

        return {
          success: true,
          data: {
            wallet: walletAddress,
            tokens: tokensWithRisk,
            summary,
          },
        };
      } catch (error) {
        logger.error({ error, walletAddress }, 'Scan failed');
        set.status = 500;
        return {
          success: false,
          error: 'Failed to scan wallet',
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
        chainIds: t.Optional(t.Array(t.Number())),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Object({
            wallet: t.String(),
            tokens: t.Array(t.Any()),
            summary: t.Any(),
          }),
        }),
        500: t.Object({
          success: t.Boolean(),
          error: t.String(),
          message: t.Optional(t.String()),
        }),
      },
    }
  );

