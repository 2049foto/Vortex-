/**
 * Vortex Protocol - Farcaster Frame Webhook
 * Handles notifications and Mini App events (Add-to-App flow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerNotificationToken } from '@/services/farcasterService';
import { createLogger } from '@/utils/logger';
import { db } from '@/db/client';
import { users, notificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

const logger = createLogger('farcaster-webhook');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, fid, notificationDetails, walletAddress } = body;

    logger.info({ event, fid, hasNotificationDetails: !!notificationDetails }, 'Farcaster webhook event');

    switch (event) {
      case 'frame_added':
      case 'notifications_enabled':
        // User added the Mini App or enabled notifications
        if (notificationDetails && fid) {
          try {
            // Get or create user
            let userId: string;
            if (walletAddress) {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.walletAddress, walletAddress))
                .limit(1);
              
              if (user) {
                userId = user.id;
              } else {
                const [newUser] = await db
                  .insert(users)
                  .values({ walletAddress })
                  .returning();
                userId = newUser.id;
              }
            } else {
              // Use FID as userId if no wallet
              userId = `farcaster:${fid}`;
            }

            // Register notification token
            const clientId = `farcaster:${fid}`;
            await registerNotificationToken(
              userId,
              clientId,
              {
                url: notificationDetails.url || notificationDetails.callbackUrl,
                token: notificationDetails.token,
              }
            );

            logger.info({ fid, userId, clientId }, 'Notification token registered');
          } catch (error) {
            logger.error({ error, fid }, 'Failed to register notification token');
            // Don't fail the webhook
          }
        }
        break;

      case 'frame_removed':
      case 'notifications_disabled':
        // User removed the Mini App or disabled notifications
        try {
          const clientId = `farcaster:${fid}`;
          await db
            .update(notificationTokens)
            .set({ enabled: false })
            .where(eq(notificationTokens.clientId, clientId));
          
          logger.info({ fid, clientId }, 'Notifications disabled');
        } catch (error) {
          logger.error({ error, fid }, 'Failed to disable notifications');
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Webhook processing failed');
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
