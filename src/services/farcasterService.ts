/**
 * Vortex Protocol - Farcaster Mini App Service
 * Frames v2 + Notifications integration
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { db } from '../db/client';
import { notificationTokens } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('farcaster');

const FARCASTER_HUB_URL = env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://hub.farcaster.cast';

// ============================================
// FRAME TYPES
// ============================================
export interface FrameMessage {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    inputText?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  };
  trustedData?: {
    messageBytes: string;
  };
}

export interface FrameContext {
  fid: number;
  buttonIndex: number;
  inputText?: string;
  castId?: {
    fid: number;
    hash: string;
  };
  verified: boolean;
}

export interface FrameAction {
  type: 'scan' | 'consolidate' | 'dashboard' | 'share';
  params?: Record<string, any>;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface NotificationDetails {
  url: string;
  token: string;
}

export interface NotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

// ============================================
// FRAME VALIDATION
// ============================================

/**
 * Validate frame message signature
 */
export async function validateFrameMessage(
  message: FrameMessage
): Promise<FrameContext | null> {
  try {
    // In production, verify signature with Farcaster Hub
    // For MVP, we trust the untrusted data with basic validation
    
    const { untrustedData } = message;
    
    if (!untrustedData.fid || !untrustedData.buttonIndex) {
      logger.warn('Invalid frame message: missing fid or buttonIndex');
      return null;
    }

    // TODO: Implement proper signature verification with Hub
    // const response = await fetch(`${FARCASTER_HUB_URL}/v1/validateMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/octet-stream' },
    //   body: Buffer.from(message.trustedData?.messageBytes || '', 'hex'),
    // });
    
    return {
      fid: untrustedData.fid,
      buttonIndex: untrustedData.buttonIndex,
      inputText: untrustedData.inputText,
      castId: untrustedData.castId,
      verified: false, // Set to true when signature verification is implemented
    };
  } catch (error) {
    logger.error({ error }, 'Frame message validation failed');
    return null;
  }
}

/**
 * Parse frame action from context
 */
export function parseFrameAction(
  context: FrameContext,
  currentScreen: string
): FrameAction {
  // Map button indices to actions based on current screen
  const actionMap: Record<string, Record<number, FrameAction>> = {
    intro: {
      1: { type: 'scan', params: { address: context.inputText } },
      2: { type: 'dashboard' },
    },
    scan_result: {
      1: { type: 'consolidate' },
      2: { type: 'share' },
      3: { type: 'dashboard' },
    },
    success: {
      1: { type: 'share' },
      2: { type: 'dashboard' },
    },
  };

  return actionMap[currentScreen]?.[context.buttonIndex] || { type: 'dashboard' };
}

// ============================================
// FRAME HTML GENERATION
// ============================================

/**
 * Generate frame HTML for intro screen
 */
export function generateIntroFrame(appUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${appUrl}/api/og/frame-intro" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="🔍 Scan My Wallet" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="📊 Open Dashboard" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${appUrl}/dashboard" />
    <meta property="fc:frame:input:text" content="Enter wallet address (0x...)" />
    <meta property="fc:frame:post_url" content="${appUrl}/api/frame" />
    <meta property="og:image" content="${appUrl}/og-image.png" />
    <meta property="og:title" content="Vortex Protocol - Portfolio Hygiene" />
    <meta property="og:description" content="Clean your crypto portfolio, gasless on Base." />
    <title>Vortex Protocol</title>
  </head>
  <body>
    <h1>Vortex Protocol</h1>
    <p>Premium Portfolio Hygiene Engine</p>
  </body>
</html>`;
}

/**
 * Generate frame HTML for scan results
 */
export function generateScanResultFrame(
  appUrl: string,
  dustValue: number,
  tokensCount: number,
  riskCount: number
): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${appUrl}/api/og/scan-result?dust=${dustValue}&tokens=${tokensCount}&risk=${riskCount}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="💫 Consolidate Now" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="📤 Share Results" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Found $${dustValue.toFixed(2)} in dust tokens with @vortex! Clean your wallet: ${appUrl}" />
    <meta property="fc:frame:button:3" content="🏠 Dashboard" />
    <meta property="fc:frame:button:3:action" content="link" />
    <meta property="fc:frame:button:3:target" content="${appUrl}/dashboard" />
    <meta property="fc:frame:post_url" content="${appUrl}/api/frame?action=consolidate" />
    <title>Scan Results - Vortex</title>
  </head>
  <body>
    <h1>Scan Complete</h1>
    <p>Found ${tokensCount} tokens worth $${dustValue.toFixed(2)}</p>
    <p>${riskCount} risky tokens detected</p>
  </body>
</html>`;
}

/**
 * Generate frame HTML for success
 */
export function generateSuccessFrame(
  appUrl: string,
  outputValue: number,
  gasSaved: number,
  txHash: string
): string {
  const explorerUrl = `https://basescan.org/tx/${txHash}`;
  
  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${appUrl}/api/og/success?value=${outputValue}&gas=${gasSaved}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="📤 Share Achievement" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="https://warpcast.com/~/compose?text=Just cleaned my wallet and saved $${gasSaved.toFixed(2)} in gas with @vortex! 🎉 ${appUrl}" />
    <meta property="fc:frame:button:2" content="🔗 View Transaction" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${explorerUrl}" />
    <meta property="fc:frame:button:3" content="🔍 Scan Again" />
    <meta property="fc:frame:button:3:action" content="post" />
    <meta property="fc:frame:post_url" content="${appUrl}/api/frame" />
    <title>Success - Vortex</title>
  </head>
  <body>
    <h1>Consolidation Complete!</h1>
    <p>Output: $${outputValue.toFixed(2)}</p>
    <p>Gas Saved: $${gasSaved.toFixed(2)}</p>
  </body>
</html>`;
}

/**
 * Generate error frame
 */
export function generateErrorFrame(appUrl: string, errorMessage: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${appUrl}/api/og/error?msg=${encodeURIComponent(errorMessage)}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="🔄 Try Again" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:post_url" content="${appUrl}/api/frame" />
    <title>Error - Vortex</title>
  </head>
  <body>
    <h1>Error</h1>
    <p>${errorMessage}</p>
  </body>
</html>`;
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Register notification token for a user
 */
export async function registerNotificationToken(
  userId: string,
  clientId: string,
  details: NotificationDetails
): Promise<void> {
  try {
    await db
      .insert(notificationTokens)
      .values({
        userId,
        clientId,
        callbackUrl: details.url,
        token: details.token,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: [notificationTokens.userId, notificationTokens.clientId],
        set: {
          callbackUrl: details.url,
          token: details.token,
          enabled: true,
          updatedAt: new Date(),
        },
      });

    logger.info({ userId, clientId }, 'Notification token registered');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to register notification token');
    throw error;
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    targetUrl: string;
  }
): Promise<{ sent: number; failed: number }> {
  try {
    // Get all active tokens for user
    const tokens = await db
      .select()
      .from(notificationTokens)
      .where(and(
        eq(notificationTokens.userId, userId),
        eq(notificationTokens.enabled, true)
      ));

    if (tokens.length === 0) {
      logger.info({ userId }, 'No notification tokens found for user');
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Send to each registered client
    for (const tokenRecord of tokens) {
      try {
        const response = await fetch(tokenRecord.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenRecord.token}`,
          },
          body: JSON.stringify({
            notificationId: `vortex-${Date.now()}`,
            title: notification.title,
            body: notification.body,
            targetUrl: notification.targetUrl,
          }),
        });

        if (response.ok) {
          sent++;
          logger.info({ userId, clientId: tokenRecord.clientId }, 'Notification sent');
        } else {
          failed++;
          logger.warn(
            { userId, clientId: tokenRecord.clientId, status: response.status },
            'Failed to send notification'
          );
        }
      } catch (error) {
        failed++;
        logger.error({ error, userId, clientId: tokenRecord.clientId }, 'Notification send error');
      }
    }

    return { sent, failed };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send notifications');
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send dust found notification
 */
export async function notifyDustFound(
  userId: string,
  dustValue: number,
  tokensCount: number
): Promise<void> {
  const appUrl = env.NEXT_PUBLIC_APP_URL || 'https://vortex-protocol.vercel.app';
  
  await sendNotification(userId, {
    title: '💰 Dust Found!',
    body: `Found ${tokensCount} dust tokens worth $${dustValue.toFixed(2)}. Consolidate now to reclaim value!`,
    targetUrl: `${appUrl}/scan`,
  });
}

/**
 * Send consolidation completed notification
 */
export async function notifyConsolidationComplete(
  userId: string,
  outputValue: number,
  gasSaved: number,
  txHash: string
): Promise<void> {
  const appUrl = env.NEXT_PUBLIC_APP_URL || 'https://vortex-protocol.vercel.app';
  
  await sendNotification(userId, {
    title: '✅ Consolidation Complete!',
    body: `You received $${outputValue.toFixed(2)} and saved $${gasSaved.toFixed(2)} in gas fees!`,
    targetUrl: `${appUrl}/success?tx=${txHash}`,
  });
}

/**
 * Disable notifications for a user/client
 */
export async function disableNotifications(
  userId: string,
  clientId?: string
): Promise<void> {
  try {
    if (clientId) {
      await db
        .update(notificationTokens)
        .set({ enabled: false, updatedAt: new Date() })
        .where(and(
          eq(notificationTokens.userId, userId),
          eq(notificationTokens.clientId, clientId)
        ));
    } else {
      await db
        .update(notificationTokens)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(notificationTokens.userId, userId));
    }

    logger.info({ userId, clientId }, 'Notifications disabled');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to disable notifications');
    throw error;
  }
}

export default {
  validateFrameMessage,
  parseFrameAction,
  generateIntroFrame,
  generateScanResultFrame,
  generateSuccessFrame,
  generateErrorFrame,
  registerNotificationToken,
  sendNotification,
  notifyDustFound,
  notifyConsolidationComplete,
  disableNotifications,
};

