/**
 * Vortex Protocol - Consolidate (Execute) Page Client Component
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Consolidate } from '@/ui-components/consolidate';
import { createConsolidation } from '@/lib/api';

export function ConsolidatePageClient() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputToken, setOutputToken] = useState<'ETH' | 'USDC'>('ETH');

  // Get tokens from URL query params - parse safely
  const selectedTokens = useMemo(() => {
    try {
      const tokensParam = searchParams.get('tokens');
      if (!tokensParam) return [];
      const decoded = decodeURIComponent(tokensParam);
      const parsed = JSON.parse(decoded);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse tokens from URL:', e);
      return [];
    }
  }, [searchParams]);

  const handleExecute = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!isConnected) {
      setError('Wallet not connected');
      return;
    }

    if (selectedTokens.length === 0) {
      setError('No tokens selected for consolidation');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Format tokens for API - include all required fields
      const tokensForApi = selectedTokens.map((t: any) => ({
        address: t.contractAddress || t.address,
        chainId: t.chainId,
        symbol: t.symbol,
        valueUSD: t.valueUSD || t.valueUsd || 0,
      }));

      const result = await createConsolidation({
        walletAddress: address,
        selectedTokens: tokensForApi,
        outputToken: outputToken,
        dryRun: false,
      });

      // Redirect to success page with request ID
      router.push(`/success?requestId=${result.data.requestId}`);
    } catch (err) {
      console.error('Consolidation error:', err);
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
