/**
 * Vortex Protocol - Scan Page Client Component
 * Smart, secure, and user-friendly scanning experience
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Scan } from '@/ui-components/scan';
import { scanWallet } from '@/lib/api';
import Turnstile from '@/components/ui/turnstile';

// All supported mainnet chains (10 EVM + Solana special handling)
const SUPPORTED_CHAIN_IDS = [1, 8453, 42161, 10, 137, 56, 43114, 324, 838592];
// Monad (838592) included as mainnet

export function ScanPageClient() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const hasScanned = useRef(false);
  const scanAttempts = useRef(0);

  // Smart scan with retry logic
  const handleScan = useCallback(async (walletAddress?: string) => {
    const targetAddress = walletAddress || address;
    
    if (!targetAddress) {
      setError('Please connect your wallet to scan');
      return;
    }

    // Check if we need Turnstile and it's not ready yet
    const needsTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (needsTurnstile && !turnstileToken && scanAttempts.current < 3) {
      // Wait a bit for Turnstile to complete
      scanAttempts.current++;
      setTimeout(() => handleScan(targetAddress), 1000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[SCAN-CLIENT] Starting scan...', { 
        targetAddress: targetAddress.substring(0, 10) + '...',
        chains: SUPPORTED_CHAIN_IDS.length,
        hasTurnstile: !!turnstileToken,
      });

      const result = await scanWallet(targetAddress, SUPPORTED_CHAIN_IDS, turnstileToken);
      
      console.log('[SCAN-CLIENT] Scan result:', {
        success: result.success,
        tokenCount: result.data?.tokens?.length || 0,
        summary: result.data?.summary,
      });

      if (result.success === false) {
        // API returned an error
        throw new Error((result as any).message || (result as any).error || 'Scan failed');
      }

      setScanResult(result.data);
      
      // Track successful scan
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('wallet_scanned', {
          tokens_found: result.data?.tokens?.length || 0,
          chains_scanned: SUPPORTED_CHAIN_IDS.length,
        });
      }
    } catch (err: any) {
      console.error('[SCAN-CLIENT] Scan error:', err);
      
      // Extract error message
      let errorMessage = 'Failed to scan wallet';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      }
      
      // Provide helpful error messages
      if (errorMessage.includes('Bot verification') || errorMessage.includes('Turnstile')) {
        setError('Security check issue. Please refresh the page and try again.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('MORALIS') || errorMessage.includes('API key')) {
        setError('Backend configuration issue. Please try again later.');
      } else {
        setError(errorMessage);
      }

      // Still allow UI to show even with error
      setScanResult({ tokens: [], summary: null });
    } finally {
      setIsLoading(false);
    }
  }, [address, turnstileToken]);

  // Auto-scan when wallet connected and Turnstile ready (or not needed)
  useEffect(() => {
    const needsTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const canScan = address && !hasScanned.current && (!needsTurnstile || turnstileReady);
    
    if (canScan) {
      hasScanned.current = true;
      handleScan(address);
    }
  }, [address, turnstileReady, handleScan]);

  // Handle Turnstile verification
  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileReady(true);
  }, []);

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500 mb-6">Connect your wallet to scan your portfolio across {SUPPORTED_CHAIN_IDS.length} chains</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Scan
        address={address}
        isLoading={isLoading}
        scanResult={scanResult}
        error={error}
        onScan={handleScan}
        onNavigate={(path) => router.push(path)}
      />

      {/* Turnstile widget (invisible mode - hidden from user) */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="sr-only" aria-hidden="true">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={handleTurnstileVerify}
            onError={() => {
              // Silently proceed without Turnstile if there's an error
              // This allows the app to work even when Turnstile domain is misconfigured
              setTurnstileReady(true);
            }}
            size="invisible"
          />
        </div>
      )}
    </>
  );
}
