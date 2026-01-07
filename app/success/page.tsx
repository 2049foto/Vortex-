/**
 * Vortex Protocol - Success Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getConsolidationStatus } from '../../src/lib/api';
import { Card } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestId = searchParams.get('requestId');

  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setError('No request ID provided');
      setIsLoading(false);
      return;
    }

    // Poll for status
    const pollStatus = async () => {
      try {
        const result = await getConsolidationStatus(requestId);
        setStatus(result.data);

        // Stop polling if completed or failed
        if (result.data.status === 'completed' || result.data.status === 'failed') {
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setIsLoading(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [requestId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h2 className="mb-2 text-xl font-bold">Error</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={() => router.push('/scan')}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <h2 className="mb-2 text-xl font-bold">Processing...</h2>
          <p className="text-gray-600">Your consolidation is being executed</p>
        </Card>
      </div>
    );
  }

  const isSuccess = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md p-6 text-center">
        <div className="mb-4 text-6xl">
          {isSuccess ? '✅' : isFailed ? '❌' : '⏳'}
        </div>
        
        <h2 className="mb-2 text-2xl font-bold">
          {isSuccess ? 'Consolidation Complete!' : isFailed ? 'Consolidation Failed' : 'Processing...'}
        </h2>

        <div className="mb-6 space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium capitalize">{status.status}</span>
          </div>
          
          {status.outputAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Output:</span>
              <span className="font-medium">{status.outputAmount}</span>
            </div>
          )}

          {status.actualGasUsd && (
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Saved:</span>
              <span className="font-medium text-green-600">${status.actualGasUsd}</span>
            </div>
          )}

          {isFailed && status.errorMessage && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {status.errorMessage}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            View Dashboard
          </Button>
          <Button
            onClick={() => router.push('/scan')}
            variant="outline"
            className="flex-1"
          >
            Scan Again
          </Button>
        </div>
      </Card>
    </div>
  );
}

