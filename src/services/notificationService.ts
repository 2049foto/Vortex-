/**
 * Vortex Protocol - Notification Service
 * Farcaster Mini App notifications
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { db } from '../db/client';
import { notificationTokens } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('notification');

const FARCASTER_API_URL = env.FARCASTER_API_URL || 'https://api.warpcast.com';

export interface NotificationPayload {
  userId: string; // FID or wallet
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
}

/**
 * Register notification token for user
 */
export async function registerNotificationToken(
  userId: string,
  token: string,
  platform: 'farcaster' | 'web'
): Promise<void> {
  try {
    await db
      .insert(notificationTokens)
      .values({
        userId,
        clientId: platform === 'farcaster' ? 'farcaster' : 'web',
        callbackUrl: platform === 'farcaster' ? env.FARCASTER_API_URL || 'https://api.warpcast.com' : '',
        token,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: [notificationTokens.userId, notificationTokens.clientId],
        set: {
          token,
          enabled: true,
          updatedAt: new Date(),
        },
      });

    logger.info({ userId, platform }, 'Notification token registered');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to register notification token');
    throw error;
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    // Get user's notification tokens
    const tokens = await db
      .select()
      .from(notificationTokens)
      .where(and(
        eq(notificationTokens.userId, payload.userId),
        eq(notificationTokens.enabled, true)
      ));

    if (tokens.length === 0) {
      logger.warn({ userId: payload.userId }, 'No notification tokens found');
      return;
    }

    // Send to each platform
    const results = await Promise.allSettled(
      tokens.map(async (tokenRecord) => {
        if (tokenRecord.clientId === 'farcaster') {
          return sendFarcasterNotification(tokenRecord.token, payload);
        } else if (tokenRecord.clientId === 'web') {
          return sendWebPushNotification(tokenRecord.token, payload);
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    logger.info(
      { userId: payload.userId, successCount, totalTokens: tokens.length },
      'Notifications sent'
    );
  } catch (error) {
    logger.error({ error, userId: payload.userId }, 'Failed to send notification');
    throw error;
  }
}

/**
 * Send Farcaster notification (Frames v2)
 */
async function sendFarcasterNotification(
  token: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const response = await fetch(`${FARCASTER_API_URL}/v2/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.FARCASTER_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        notification_token: token,
        title: payload.title,
        body: payload.body,
        url: payload.url || `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
        image_url: payload.imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Farcaster API error: ${response.statusText}`);
    }

    logger.debug({ token }, 'Farcaster notification sent');
  } catch (error) {
    logger.error({ error, token }, 'Farcaster notification failed');
    throw error;
  }
}

/**
 * Send Web Push notification
 */
async function sendWebPushNotification(
  token: string,
  payload: NotificationPayload
): Promise<void> {
  // TODO: Implement Web Push (using service like OneSignal or Firebase)
  logger.debug({ token }, 'Web push notification (not implemented)');
}

/**
 * Send consolidation complete notification
 */
export async function notifyConsolidationComplete(
  userId: string,
  outputAmount: string,
  outputToken: string
): Promise<void> {
  await sendNotification({
    userId,
    title: '✅ Consolidation Complete!',
    body: `Successfully consolidated to ${outputAmount} ${outputToken}`,
    url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
    imageUrl: `${env.NEXT_PUBLIC_APP_URL}/og-success.png`,
  });
}

/**
 * Send consolidation failed notification
 */
export async function notifyConsolidationFailed(
  userId: string,
  reason: string
): Promise<void> {
  await sendNotification({
    userId,
    title: '❌ Consolidation Failed',
    body: reason,
    url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}

/**
 * Send high-risk token alert
 */
export async function notifyHighRiskToken(
  userId: string,
  tokenSymbol: string,
  riskReason: string
): Promise<void> {
  await sendNotification({
    userId,
    title: '⚠️ High Risk Token Detected',
    body: `${tokenSymbol}: ${riskReason}`,
    url: `${env.NEXT_PUBLIC_APP_URL}/scan`,
  });
}

/**
 * Deactivate notification token
 */
export async function deactivateNotificationToken(
  userId: string,
  token: string
): Promise<void> {
  await db
    .update(notificationTokens)
    .set({ enabled: false, updatedAt: new Date() })
    .where(and(
      eq(notificationTokens.userId, userId),
      eq(notificationTokens.token, token)
    ));

  logger.info({ userId, token }, 'Notification token deactivated');
}

