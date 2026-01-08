/**
 * Vortex Protocol - Subscription Checkout API
 * Handles OnchainKit Checkout payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, productId, amount, chainId } = body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Get or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({ walletAddress })
        .returning();
    }

    // In production, this would:
    // 1. Create OnchainKit Checkout session
    // 2. Return checkout URL
    // 3. Handle webhook for payment confirmation
    // 4. Update subscription status in DB

    // For now, return mock success
    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/checkout?session=xxx`,
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // Mock
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
