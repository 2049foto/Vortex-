/**
 * Vortex Protocol - OnchainKit Checkout Component
 * Pro subscription payment integration
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

// OnchainKit Checkout (when available)
// import { Checkout } from '@coinbase/onchainkit/checkout';

interface CheckoutProps {
  productId?: string;
  amount?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export function OnchainKitCheckout({ productId, amount, onSuccess, onError }: CheckoutProps) {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isConnected || !address) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Please connect your wallet to subscribe</p>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // OnchainKit Checkout integration
      // This is a placeholder - actual implementation depends on OnchainKit API
      
      // Example flow:
      // 1. Create checkout session
      // 2. User approves transaction
      // 3. Process payment
      // 4. Update subscription status in DB
      
      const response = await fetch('/api/v1/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          productId: productId || 'pro-monthly',
          amount: amount || '9.99',
          chainId: base.id,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.txHash) {
        onSuccess?.(data.txHash);
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Pro Subscription</h3>
        <p className="text-sm text-muted-foreground">Unlock advanced features</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Monthly Plan</span>
          <span className="font-semibold">${amount || '9.99'}/month</span>
        </div>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>✓ Unlimited consolidations</li>
          <li>✓ Priority support</li>
          <li>✓ Advanced analytics</li>
          <li>✓ API access</li>
        </ul>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Subscribe with OnchainKit'}
      </button>
    </div>
  );
}
