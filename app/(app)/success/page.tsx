/**
 * Vortex Protocol - Success Page
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getConsolidationStatus } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, X, Loader2, ExternalLink, ArrowRight, Share2 } from 'lucide-react';

function SuccessPageContent() {
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
        if (['COMPLETED', 'completed', 'FAILED', 'failed'].includes(result.data.status)) {
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

  const handleShare = () => {
    const text = `Just cleaned my portfolio with @VortexProtocol! Consolidated dust tokens into ETH on Base 🌀✨`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6"
            >
              <X className="w-10 h-10 text-red-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/scan')}>
              Try Again
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6"
            >
              <Loader2 className="w-10 h-10 text-indigo-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing...</h2>
            <p className="text-slate-600">Your consolidation is being executed</p>
            <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = ['COMPLETED', 'completed'].includes(status.status);
  const isFailed = ['FAILED', 'failed'].includes(status.status);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="py-12">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${
              isSuccess ? 'bg-emerald-100' : isFailed ? 'bg-red-100' : 'bg-amber-100'
            }`}
          >
            {isSuccess ? (
              <Check className="w-12 h-12 text-emerald-600" />
            ) : isFailed ? (
              <X className="w-12 h-12 text-red-600" />
            ) : (
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
            )}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isSuccess ? 'Consolidation Complete!' : isFailed ? 'Consolidation Failed' : 'Processing...'}
            </h2>
            <p className="text-slate-600">
              {isSuccess 
                ? 'Your portfolio has been cleaned and optimized.' 
                : isFailed 
                ? 'Something went wrong with your consolidation.'
                : 'Please wait while we process your transaction.'
              }
            </p>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 mb-8 bg-slate-50 rounded-2xl p-6"
          >
            <div className="flex justify-between">
              <span className="text-slate-600">Status</span>
              <span className={`font-semibold capitalize ${
                isSuccess ? 'text-emerald-600' : isFailed ? 'text-red-600' : 'text-amber-600'
              }`}>
                {status.status?.toLowerCase()}
              </span>
            </div>
            
            {status.outputAmount && (
              <div className="flex justify-between">
                <span className="text-slate-600">Output</span>
                <span className="font-semibold text-slate-900">{status.outputAmount}</span>
              </div>
            )}

            {status.actualGasUsd && (
              <div className="flex justify-between">
                <span className="text-slate-600">Gas Saved</span>
                <span className="font-semibold text-emerald-600">${status.actualGasUsd} (Sponsored)</span>
              </div>
            )}

            {status.txHash && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Transaction</span>
                <a
                  href={`https://basescan.org/tx/${status.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-mono text-sm"
                >
                  {status.txHash.slice(0, 10)}...{status.txHash.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {isFailed && status.errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{status.errorMessage}</p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {isSuccess && (
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share on Twitter
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/scan')}
              >
                Scan Again
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}

