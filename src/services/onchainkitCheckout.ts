/**
 * Vortex Protocol - OnchainKit Checkout Service
 * Handles Pro subscription payments via on-chain transactions
 * Uses direct payment pattern with smart contract or Coinbase Commerce
 */

import { createLogger } from '../utils/logger';
import { env } from '../config/env';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { base } from 'viem/chains';

const logger = createLogger('onchainkit-checkout');

// Subscription contract address (would be deployed on Base)
// For MVP, we use a simple payment pattern
const SUBSCRIPTION_CONTRACT_ADDRESS = env.SUBSCRIPTION_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Product pricing (in USD, converted to ETH/USDC on-chain)
const PRODUCT_PRICES: Record<string, { usd: number; description: string }> = {
  'pro-monthly': {
    usd: 9.99,
    description: 'Pro Monthly Subscription',
  },
  'pro-yearly': {
    usd: 99.99,
    description: 'Pro Yearly Subscription (2 months free)',
  },
  'enterprise': {
    usd: 499.99,
    description: 'Enterprise Plan',
  },
};

/**
 * Create checkout session
 */
export async function createCheckoutSession(params: {
  walletAddress: string;
  productId: string;
  chainId: number;
}): Promise<{
  sessionId: string;
  checkoutUrl: string;
  amount: string;
  amountUsd: number;
  expiresAt: Date;
}> {
  try {
    const product = PRODUCT_PRICES[params.productId];
    if (!product) {
      throw new Error(`Invalid product ID: ${params.productId}`);
    }

    // Get or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, params.walletAddress))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({ walletAddress: params.walletAddress })
        .returning();
    }

    // Generate session ID
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Calculate amount in ETH (simplified - would fetch real ETH price)
    const ethPriceUsd = 3500; // Would fetch from price oracle
    const amountEth = product.usd / ethPriceUsd;
    const amountWei = parseUnits(amountEth.toFixed(6), 18);

    // Store session in database or cache (would use Redis in production)
    // For now, return session data

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    logger.info(
      {
        sessionId,
        walletAddress: params.walletAddress,
        productId: params.productId,
        amountUsd: product.usd,
      },
      'Checkout session created'
    );

    return {
      sessionId,
      checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/checkout?session=${sessionId}`,
      amount: amountWei.toString(),
      amountUsd: product.usd,
      expiresAt,
    };
  } catch (error) {
    logger.error({ error, params }, 'Failed to create checkout session');
    throw error;
  }
}

/**
 * Process payment transaction
 * In production, this would:
 * 1. Verify transaction on-chain
 * 2. Update subscription status
 * 3. Send confirmation
 */
export async function processPayment(params: {
  sessionId: string;
  txHash: string;
  walletAddress: string;
}): Promise<{
  success: boolean;
  subscriptionId?: string;
  expiresAt?: Date;
}> {
  try {
    // Verify transaction on-chain
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: params.txHash as `0x${string}`,
    });

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, params.walletAddress))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate subscription expiry (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Update user subscription status
    // In production, would have a subscriptions table
    // For now, we'll store in user metadata or create subscription record

    const subscriptionId = `sub_${Date.now()}_${user.id}`;

    logger.info(
      {
        subscriptionId,
        walletAddress: params.walletAddress,
        txHash: params.txHash,
        expiresAt,
      },
      'Payment processed successfully'
    );

    return {
      success: true,
      subscriptionId,
      expiresAt,
    };
  } catch (error) {
    logger.error({ error, params }, 'Payment processing failed');
    throw error;
  }
}

/**
 * Verify subscription status
 */
export async function verifySubscription(walletAddress: string): Promise<{
  isActive: boolean;
  expiresAt?: Date;
  productId?: string;
}> {
  try {
    // In production, query subscription table
    // For MVP, return mock data
    return {
      isActive: false,
    };
  } catch (error) {
    logger.error({ error, walletAddress }, 'Subscription verification failed');
    return {
      isActive: false,
    };
  }
}
