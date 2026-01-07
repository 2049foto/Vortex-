/**
 * Vortex Protocol - Scan Page
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Scan } from '@/ui-components/scan';
import { scanWallet } from '@/lib/api';

export default function ScanPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (walletAddress?: string) => {
    const targetAddress = walletAddress || address;
    
    if (!targetAddress) {
      setError('Please connect your wallet or enter an address');
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

  return (
    <Scan
      address={address}
      isLoading={isLoading}
      scanResult={scanResult}
      error={error}
      onScan={handleScan}
      onNavigate={(path) => router.push(path)}
    />
  );
}

