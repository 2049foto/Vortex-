/**
 * Vortex Protocol - Dashboard Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Dashboard } from '../../src/ui-components/dashboard';
import { getUserHistory } from '../../src/lib/api';

export default function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const result = await getUserHistory(address);
        setHistory(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address]);

  if (!address) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Connect Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      address={address}
      history={history}
      isLoading={isLoading}
      error={error}
      onNavigate={(path) => router.push(path)}
    />
  );
}

