/**
 * Vortex Protocol - Scan Page
 * Auto-scans connected wallet on mount
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Scan } from '@/ui-components/scan';
import { scanWallet } from '@/lib/api';
import Turnstile from '@/components/ui/turnstile';

export const dynamic = 'force-dynamic';

export default function ScanPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const hasScanned = useRef(false);

  const handleScan = async (walletAddress?: string) => {
    const targetAddress = walletAddress || address;
    
    if (!targetAddress) {
      setError('Please connect your wallet to scan');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await scanWallet(targetAddress);
      setScanResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scan on mount if connected
  useEffect(() => {
    if (address && !hasScanned.current) {
      hasScanned.current = true;
      handleScan(address);
    }
  }, [address]);

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500 mb-6">Connect your wallet to scan your portfolio</p>
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

      {/* Turnstile widget (hidden, for bot protection) */}
      <div className="hidden">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          onVerify={(token) => setTurnstileToken(token)}
        />
      </div>
    </>
  );
}
