/**
 * Vortex Protocol - Subscription Checkout API
 * Handles OnchainKit Checkout payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, processPayment } from '@/services/onchainkitCheckout';
import { createLogger } from '@/utils/logger';

const logger = createLogger('checkout-api');

/**
 * POST /api/v1/subscription/checkout
 * Create checkout session or process payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, walletAddress, productId, chainId, sessionId, txHash } = body;

    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'create' || !action) {
      // Create checkout session
      if (!productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID required' },
          { status: 400 }
        );
      }

      const session = await createCheckoutSession({
        walletAddress,
        productId,
        chainId: chainId || 8453, // Default to Base
      });

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl: session.checkoutUrl,
          amount: session.amount,
          amountUsd: session.amountUsd,
          expiresAt: session.expiresAt.toISOString(),
        },
      });
    } else if (action === 'process') {
      // Process payment
      if (!sessionId || !txHash) {
        return NextResponse.json(
          { success: false, error: 'Session ID and transaction hash required' },
          { status: 400 }
        );
      }

      const result = await processPayment({
        sessionId,
        txHash,
        walletAddress,
      });

      return NextResponse.json({
        success: result.success,
        data: {
          subscriptionId: result.subscriptionId,
          expiresAt: result.expiresAt?.toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error({ error }, 'Checkout API error');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process checkout request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
