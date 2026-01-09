/**
 * Vortex Protocol - Consolidate (Execute) Page Client Component
 * Smart consolidation with cross-chain bridge support via Relay.link
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Consolidate } from '@/ui-components/consolidate';
import { createConsolidation } from '@/lib/api';

// Relay status polling endpoint
const RELAY_STATUS_URL = 'https://api.relay.link/intents/status/v3';

export function ConsolidatePageClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<string>('');
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

  // Execute Relay bridge transaction
  const executeRelayTransaction = useCallback(async (swap: any): Promise<string> => {
    if (!walletClient || !swap.tx) {
      throw new Error('Wallet not ready or no transaction data');
    }

    setExecutionStep(`Bridging ${swap.fromToken} via Relay...`);

    // Execute the transaction
    const txHash = await walletClient.sendTransaction({
      to: swap.tx.to as `0x${string}`,
      data: swap.tx.data as `0x${string}`,
      value: BigInt(swap.tx.value || '0'),
    });

    console.log('Relay transaction sent:', txHash);
    return txHash;
  }, [walletClient]);

  // Poll Relay status
  const pollRelayStatus = useCallback(async (requestId: string, maxAttempts = 60): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${RELAY_STATUS_URL}?requestId=${requestId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          return true;
        } else if (data.status === 'failed' || data.status === 'refunded') {
          throw new Error(`Bridge failed: ${data.error || 'Unknown error'}`);
        }
        
        // Wait 3 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 3000));
        setExecutionStep(`Waiting for bridge confirmation... (${i + 1}/${maxAttempts})`);
      } catch (e) {
        console.warn('Status poll error:', e);
      }
    }
    return false;
  }, []);

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
    setExecutionStep('Creating consolidation plan...');

    try {
      // Format tokens for API
      const tokensForApi = selectedTokens.map((t: any) => ({
        address: t.contractAddress || t.address,
        chainId: t.chainId,
        symbol: t.symbol,
        valueUSD: t.valueUSD || t.valueUsd || 0,
      }));

      // Get consolidation plan from API
      const result = await createConsolidation({
        walletAddress: address,
        selectedTokens: tokensForApi,
        outputToken: outputToken,
        dryRun: false,
      });

      const { data } = result;

      // Check if client-side execution is required (Relay bridges)
      if (data.requiresClientExecution && data.plan?.swaps) {
        setExecutionStep('Executing cross-chain bridges...');
        
        // Execute each Relay bridge transaction
        for (const swap of data.plan.swaps) {
          if (swap.router === 'relay' && swap.tx) {
            try {
              // Execute the bridge transaction
              const txHash = await executeRelayTransaction(swap);
              
              // Wait for transaction confirmation
              if (publicClient) {
                setExecutionStep('Waiting for transaction confirmation...');
                await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
              }
              
              console.log(`Bridge transaction confirmed: ${txHash}`);
            } catch (txError) {
              console.error('Bridge transaction failed:', txError);
              throw new Error(`Failed to bridge ${swap.fromToken}: ${txError instanceof Error ? txError.message : 'Unknown error'}`);
            }
          }
        }
        
        setExecutionStep('All transactions complete!');
      }

      // Redirect to success page
      router.push(`/success?requestId=${data.requestId}`);
      
    } catch (err) {
      console.error('Consolidation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute consolidation';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('user rejected')) {
        setError('Transaction was cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for gas. Please add ETH to your wallet.');
      } else if (errorMessage.includes('No viable swap routes')) {
        setError('No swap routes available for selected tokens. Try selecting different tokens.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsExecuting(false);
      setExecutionStep('');
    }
  };

  return (
    <Consolidate
      address={address}
      tokens={selectedTokens}
      isExecuting={isExecuting}
      executionStep={executionStep}
      error={error}
      onExecute={handleExecute}
      onNavigate={(path) => router.push(path)}
    />
  );
}
