/**
 * Vortex Protocol - Dashboard Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/ui-components/dashboard';
import { getUserHistory } from '@/lib/api';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
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
        
        // Transform API response to expected format
        const activities = (result.data?.requests || []).map((req: any) => ({
          id: req.id,
          type: 'consolidate',
          chainId: req.outputChainId || 8453,
          amountUSD: parseFloat(req.actualOutput || req.estimatedOutput || '0'),
          date: new Date(req.createdAt || req.created_at),
          status: req.status === 'COMPLETED' || req.status === 'completed' ? 'complete' : req.status,
          txHash: req.txHash,
        }));

        // Calculate stats from history
        const stats = {
          xp: activities.filter((a: any) => a.status === 'complete').length * 50,
          level: Math.floor(activities.filter((a: any) => a.status === 'complete').length / 5) + 1,
          dustFoundUSD: activities.reduce((sum: number, a: any) => sum + (a.amountUSD || 0), 0),
          baseTVLAdded: activities.reduce((sum: number, a: any) => sum + (a.amountUSD || 0), 0),
          portfoliosCleaned: activities.filter((a: any) => a.status === 'complete').length,
          streak: 0, // Would need to calculate based on consecutive days
        };

        setHistory({ stats, activities });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address]);

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

