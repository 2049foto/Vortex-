/**
 * Vortex Protocol - Farcaster Frame Route
 * POST /api/frame
 */

import { Elysia, t } from 'elysia';
import { scanWallet } from '../services/portfolioService';
import { batchCalculateRiskScores } from '../services/riskScoringService';
import { registerNotificationToken } from '../services/notificationService';
import { createLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createLogger('route:frame');

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export const frameRoute = new Elysia({ prefix: '/api' })
  .post(
    '/frame',
    async ({ body, set }) => {
      const { untrustedData, trustedData } = body;

      logger.info({ fid: untrustedData?.fid }, 'Frame interaction received');

      try {
        // Verify trusted data signature (Farcaster SDK)
        // TODO: Implement signature verification

        const buttonIndex = untrustedData?.buttonIndex || 1;
        const inputText = untrustedData?.inputText || '';
        const fid = untrustedData?.fid;

        // Button 1: Scan Wallet
        if (buttonIndex === 1 && inputText) {
          // Validate wallet address
          if (!/^0x[a-fA-F0-9]{40}$/.test(inputText)) {
            return createFrameResponse({
              image: `${APP_URL}/api/og/error?message=Invalid wallet address`,
              buttons: [
                { label: 'Try Again', action: 'post' },
                { label: 'Open App', action: 'link', target: APP_URL },
              ],
              inputText: 'Enter wallet address (0x...)',
            });
          }

          // Scan wallet
          const tokens = await scanWallet(inputText);
          const riskScores = await batchCalculateRiskScores(tokens);

          // Count by tier
          const tokensWithRisk = tokens.map((token) => {
            const riskKey = `${token.chainId}:${token.address}`;
            return {
              ...token,
              tier: riskScores.get(riskKey)?.tier || 'LEGIT',
            };
          });

          const dustCount = tokensWithRisk.filter(
            (t) => t.tier === 'DUST' || t.tier === 'MICRODUST'
          ).length;
          const riskCount = tokensWithRisk.filter((t) => t.tier === 'RISK').length;
          const totalValue = tokensWithRisk.reduce((sum, t) => sum + t.valueUsd, 0);

          // Generate result frame
          return createFrameResponse({
            image: `${APP_URL}/api/og/scan-result?tokens=${tokens.length}&dust=${dustCount}&risk=${riskCount}&value=${totalValue.toFixed(2)}`,
            buttons: [
              { label: '🔥 Consolidate on Base', action: 'post', target: `${APP_URL}/api/frame/consolidate` },
              { label: 'Share Results', action: 'link', target: `${APP_URL}/share?wallet=${inputText}` },
              { label: 'Open Dashboard', action: 'link', target: `${APP_URL}/dashboard` },
            ],
            state: JSON.stringify({ wallet: inputText, dustCount, riskCount }),
          });
        }

        // Button 2: Consolidate
        if (buttonIndex === 2) {
          const state = JSON.parse(untrustedData?.state || '{}');
          const wallet = state.wallet;

          if (!wallet) {
            return createFrameResponse({
              image: `${APP_URL}/api/og/error?message=Wallet not found`,
              buttons: [{ label: 'Start Over', action: 'post' }],
            });
          }

          return createFrameResponse({
            image: `${APP_URL}/api/og/consolidate?wallet=${wallet}`,
            buttons: [
              { label: 'Open Vortex App', action: 'link', target: `${APP_URL}/execute?wallet=${wallet}` },
              { label: '🔔 Enable Notifications', action: 'post', target: `${APP_URL}/api/frame/notify` },
            ],
            state: untrustedData?.state,
          });
        }

        // Button 3: Enable Notifications
        if (buttonIndex === 3) {
          const notificationToken = untrustedData?.notificationToken;
          if (notificationToken && fid) {
            await registerNotificationToken(fid.toString(), notificationToken, 'farcaster');
          }

          return createFrameResponse({
            image: `${APP_URL}/api/og/success?message=Notifications enabled!`,
            buttons: [
              { label: 'Open App', action: 'link', target: APP_URL },
            ],
          });
        }

        // Default: Initial frame
        return createFrameResponse({
          image: `${APP_URL}/api/og/frame-intro`,
          buttons: [
            { label: 'Scan Wallet', action: 'post' },
            { label: 'Learn More', action: 'link', target: `${APP_URL}/about` },
          ],
          inputText: 'Enter wallet address (0x...)',
        });
      } catch (error) {
        logger.error({ error }, 'Frame handler error');
        set.status = 500;
        return createFrameResponse({
          image: `${APP_URL}/api/og/error?message=Something went wrong`,
          buttons: [
            { label: 'Try Again', action: 'post' },
            { label: 'Get Help', action: 'link', target: `${APP_URL}/support` },
          ],
        });
      }
    },
    {
      body: t.Object({
        untrustedData: t.Optional(t.Any()),
        trustedData: t.Optional(t.Any()),
      }),
    }
  );

/**
 * Create Farcaster Frame response
 */
function createFrameResponse(options: {
  image: string;
  buttons?: Array<{
    label: string;
    action: 'post' | 'post_redirect' | 'link';
    target?: string;
  }>;
  inputText?: string;
  state?: string;
}): string {
  const buttons = options.buttons || [];
  const buttonTags = buttons
    .map(
      (btn, i) =>
        `<meta property="fc:frame:button:${i + 1}" content="${btn.label}" />` +
        `<meta property="fc:frame:button:${i + 1}:action" content="${btn.action}" />` +
        (btn.target ? `<meta property="fc:frame:button:${i + 1}:target" content="${btn.target}" />` : '')
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${options.image}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    ${buttonTags}
    ${options.inputText ? `<meta property="fc:frame:input:text" content="${options.inputText}" />` : ''}
    ${options.state ? `<meta property="fc:frame:state" content="${options.state}" />` : ''}
    <meta property="og:image" content="${options.image}" />
    <title>Vortex Protocol - Portfolio Hygiene</title>
  </head>
  <body>
    <h1>Vortex Protocol</h1>
    <p>Clean your crypto portfolio, gasless.</p>
  </body>
</html>`;
}

