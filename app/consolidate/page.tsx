/**
 * Vortex Protocol - Consolidate (Execute) Page
 */

'use client';

import { Suspense, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Consolidate } from '@/ui-components/consolidate';
import { createConsolidation } from '@/lib/api';

function ConsolidatePageContent() {
  const { address } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tokens from URL query params
  const tokensParam = searchParams.get('tokens');
  const selectedTokens = tokensParam ? JSON.parse(decodeURIComponent(tokensParam)) : [];

  const handleExecute = async (tokenAddresses?: string[]) => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const result = await createConsolidation({
        walletAddress: address,
        tokenAddresses: tokenAddresses || selectedTokens.map((t: any) => t.address),
        targetToken: '0x4200000000000000000000000000000000000006', // WETH on Base
        chainId: 8453, // Base
      });

      // Redirect to success page with request ID
      router.push(`/success?requestId=${result.data.requestId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute consolidation');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Consolidate
      address={address}
      tokens={selectedTokens}
      isExecuting={isExecuting}
      error={error}
      onExecute={handleExecute}
      onNavigate={(path) => router.push(path)}
    />
  );
}

export default function ConsolidatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <ConsolidatePageContent />
    </Suspense>
  );
}

