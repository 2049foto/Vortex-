'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ChevronDown,
  Settings,
  Info,
  ArrowLeft,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react';
import { parseEther, formatEther } from 'viem';

interface SelectedToken {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  chainName: string;
  balance: string;
  balanceUsd: number;
  tier?: string;
  riskScore?: number;
  // Custom amount support
  amountPct?: number; // Percentage to swap (1-100)
  swapBalance?: string; // Actual balance to swap
  swapBalanceUsd?: number; // USD value to swap
}

interface ConsolidationData {
  wallet: string;
  tokens: SelectedToken[];
  totalValue?: number;
}

interface SwapTx {
  router: string;
  fromToken: string;
  fromTokenAddress: string;
  fromChainId: number;
  toToken: string;
  expectedOut: string;
  priceImpact: number;
  tx?: {
    to: string;
    data: string;
    value: string;
  };
}

const OUTPUT_OPTIONS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
];

const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0];

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism',
  137: 'Polygon',
  56: 'BNB Chain',
  43114: 'Avalanche',
  324: 'zkSync',
};

// Output token addresses on Base - filter these from consolidation based on selected output
const BASE_OUTPUT_ADDRESSES: Record<string, string[]> = {
  ETH: [
    '0x4200000000000000000000000000000000000006', // WETH on Base
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH sentinel
  ],
  USDC: [
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
  ],
};

// Filter tokens to remove output tokens on Base
function filterOutputTokens(tokens: SelectedToken[], outputToken: string): SelectedToken[] {
  const addressesToExclude = BASE_OUTPUT_ADDRESSES[outputToken] || [];
  return tokens.filter(token => {
    // Only filter Base tokens (chainId 8453)
    if (token.chainId !== 8453) return true;
    // Check if this token matches output
    const address = (token.address || '').toLowerCase();
    return !addressesToExclude.includes(address);
  });
}

type Step = 'review' | 'configure' | 'confirm' | 'processing' | 'success' | 'error';

export default function ConsolidateClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Transaction hooks
  const { sendTransaction, isPending: isSending, data: txHash } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // State
  const [step, setStep] = useState<Step>('review');
  const [data, setData] = useState<ConsolidationData | null>(null);
  const [outputToken, setOutputToken] = useState('ETH');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentTxIndex, setCurrentTxIndex] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState<SwapTx[]>([]);
  const [executedTxHashes, setExecutedTxHashes] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Load selected tokens from session
  useEffect(() => {
    const stored = sessionStorage.getItem('vortex_consolidation');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch (e) {
        router.push('/scan');
      }
    } else {
      router.push('/scan');
    }
  }, [router]);

  // Filter out tokens that match the output token on Base
  const tokensToConsolidate = useMemo(() => {
    if (!data?.tokens) return [];
    return filterOutputTokens(data.tokens, outputToken);
  }, [data?.tokens, outputToken]);

  // Calculate totals based on filtered tokens (using custom amounts if set)
  const totals = useMemo(() => {
    if (tokensToConsolidate.length === 0) return { value: 0, tokens: 0, chains: 0, excludedCount: 0 };
    const chains = new Set(tokensToConsolidate.map(t => t.chainId));
    const excludedCount = (data?.tokens?.length || 0) - tokensToConsolidate.length;
    return {
      // Use swapBalanceUsd if available (custom amount), otherwise full balanceUsd
      value: tokensToConsolidate.reduce((sum, t) => sum + (t.swapBalanceUsd ?? t.balanceUsd), 0),
      tokens: tokensToConsolidate.length,
      chains: chains.size,
      excludedCount,
    };
  }, [tokensToConsolidate, data?.tokens?.length]);

  // Estimate output (simplified)
  const estimatedOutput = useMemo(() => {
    const fee = totals.value * 0.008; // 0.8% fee
    const slippageCost = totals.value * (slippage / 100);
    return totals.value - fee - slippageCost;
  }, [totals.value, slippage]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('[CONSOLIDATE] Transaction confirmed:', txHash);
      setExecutedTxHashes(prev => [...prev, txHash]);
      
      // Move to next swap
      if (currentTxIndex < pendingSwaps.length - 1) {
        setCurrentTxIndex(prev => prev + 1);
        setProgress(Math.round(((currentTxIndex + 1) / pendingSwaps.length) * 100));
      } else {
        // All done
        setProgress(100);
        setStep('success');
        sessionStorage.removeItem('vortex_consolidation');
      }
    }
  }, [isConfirmed, txHash, currentTxIndex, pendingSwaps.length]);

  // Execute next pending swap when index changes
  useEffect(() => {
    if (step === 'processing' && pendingSwaps.length > 0 && currentTxIndex < pendingSwaps.length) {
      executeNextSwap();
    }
  }, [currentTxIndex, pendingSwaps, step]);

  // Execute a single swap transaction
  const executeNextSwap = useCallback(async () => {
    const swap = pendingSwaps[currentTxIndex];
    if (!swap || !swap.tx) {
      console.error('[CONSOLIDATE] No transaction data for swap:', swap);
      setError(`No transaction data for ${swap?.fromToken || 'token'}`);
      setStep('error');
      return;
    }

    console.log('[CONSOLIDATE] Executing swap', currentTxIndex + 1, 'of', pendingSwaps.length, swap);
    setStatusMessage(`Swapping ${swap.fromToken} (${CHAIN_NAMES[swap.fromChainId] || 'Chain ' + swap.fromChainId})...`);

    try {
      // Check if we need to switch chains
      if (swap.fromChainId !== currentChainId) {
        console.log('[CONSOLIDATE] Switching to chain', swap.fromChainId);
        setStatusMessage(`Switching to ${CHAIN_NAMES[swap.fromChainId] || 'Chain ' + swap.fromChainId}...`);
        
        try {
          await switchChain({ chainId: swap.fromChainId });
          // Wait for chain switch
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (switchError) {
          console.error('[CONSOLIDATE] Chain switch failed:', switchError);
          setError(`Please switch to ${CHAIN_NAMES[swap.fromChainId] || 'Chain ' + swap.fromChainId} manually`);
          setStep('error');
          return;
        }
      }

      // Send the transaction
      setStatusMessage(`Confirm transaction in your wallet...`);
      
      sendTransaction({
        to: swap.tx.to as `0x${string}`,
        data: swap.tx.data as `0x${string}`,
        value: BigInt(swap.tx.value || '0'),
      });

    } catch (err) {
      console.error('[CONSOLIDATE] Swap execution error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    }
  }, [pendingSwaps, currentTxIndex, currentChainId, switchChain, sendTransaction]);

  // Handle consolidation
  const handleConsolidate = async () => {
    if (!data || !isConnected || !address) return;
    
    // Check if there are tokens to consolidate
    if (tokensToConsolidate.length === 0) {
      setError('No tokens to consolidate. All selected tokens are output tokens.');
      setStep('error');
      return;
    }
    
    setStep('processing');
    setProgress(0);
    setError(null);
    setCurrentTxIndex(0);
    setPendingSwaps([]);
    setExecutedTxHashes([]);
    setStatusMessage('Creating consolidation plan...');

    try {
      // Step 1: Get consolidation plan (dry run to get tx data)
      setProgress(5);
      
      const planResponse = await fetch('/api/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          // Use filtered tokens (excludes output token on Base)
          selectedTokens: tokensToConsolidate.map(t => ({
            chainId: t.chainId,
            address: t.address || t.id?.split('-')[1],
          })),
          outputToken: outputToken,
          slippagePct: slippage,
          dryRun: true,
        }),
      });

      const planData = await planResponse.json();
      console.log('[CONSOLIDATE] Plan response:', planData);
      
      if (!planData.success) {
        const errorMsg = planData.message || planData.error || 'Failed to create consolidation plan';
        const skippedTokens = planData.data?.skippedTokens;
        
        if (skippedTokens && skippedTokens.length > 0) {
          const reasons = skippedTokens.map((t: any) => `${t.symbol}: ${t.reason}`).join(', ');
          throw new Error(`${errorMsg}. Tokens skipped: ${reasons}`);
        }
        throw new Error(errorMsg);
      }

      setProgress(15);
      setStatusMessage('Analyzing swap routes...');

      // Step 2: Extract swaps with transaction data
      const swaps: SwapTx[] = planData.data?.plan?.swaps || [];
      
      if (swaps.length === 0) {
        throw new Error('No viable swap routes found. All tokens may require bridging or have insufficient liquidity.');
      }

      // Filter swaps that have transaction data
      const executableSwaps = swaps.filter((s: SwapTx) => s.tx && s.tx.to && s.tx.data);
      
      if (executableSwaps.length === 0) {
        // No executable swaps - might be server-side only or missing tx data
        throw new Error('No transactions available for client execution. Please try again.');
      }

      console.log('[CONSOLIDATE] Executable swaps:', executableSwaps.length);
      setProgress(20);
      setStatusMessage(`Found ${executableSwaps.length} swap${executableSwaps.length > 1 ? 's' : ''} to execute`);

      // Store pending swaps and start execution
      setPendingSwaps(executableSwaps);
      
      // Wait a moment for state to update, then first swap will execute via useEffect
      await new Promise(r => setTimeout(r, 500));
      
    } catch (err: any) {
      console.error('[CONSOLIDATE] Error:', err);
      setError(err?.message || 'Consolidation failed. Please try again.');
      setStep('error');
    }
  };

  if (!data) {
    return (
      <div className="page safe-top">
        <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '60px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--success-light))' }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: 'hsl(var(--success))' }} />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Consolidation Complete!</h1>
            <p className="mb-6" style={{ color: 'hsl(var(--text-secondary))' }}>
              {totals.tokens} tokens consolidated to {outputToken} on Base
            </p>
            
            <div className="card mb-6" style={{ maxWidth: 320, margin: '0 auto' }}>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Estimated received
                </p>
                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                  ${estimatedOutput.toFixed(2)}
                </p>
                <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  in {outputToken} on Base
                </p>
              </div>
            </div>

            {/* Transaction links */}
            {executedTxHashes.length > 0 && (
              <div className="mb-6 text-left max-w-xs mx-auto">
                <p className="text-sm font-medium mb-2">Transactions:</p>
                {executedTxHashes.map((hash, i) => (
                  <a
                    key={hash}
                    href={`https://basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline mb-1"
                    style={{ color: 'hsl(var(--accent))' }}
                  >
                    <span>Tx {i + 1}: {hash.slice(0, 10)}...{hash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/scan')}
              >
                Scan Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '80px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  border: '3px solid hsl(var(--border))',
                  borderTopColor: 'hsl(var(--accent))'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold">{progress}%</span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              {isSending ? 'Confirm in Wallet' : isConfirming ? 'Confirming...' : 'Processing'}
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              {statusMessage || `Consolidating ${totals.tokens} tokens...`}
            </p>

            {pendingSwaps.length > 1 && (
              <p className="text-sm mt-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
                Transaction {Math.min(currentTxIndex + 1, pendingSwaps.length)} of {pendingSwaps.length}
              </p>
            )}
            
            <div className="progress-bar mt-6 max-w-xs mx-auto">
              <motion.div 
                className="progress-bar-fill"
                animate={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-xs mt-4" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Please don't close this page
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '60px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--danger-light))' }}
            >
              <AlertCircle className="w-10 h-10" style={{ color: 'hsl(var(--danger))' }} />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Consolidation Failed</h1>
            <p className="mb-6 px-4" style={{ color: 'hsl(var(--text-secondary))', maxWidth: '400px', margin: '0 auto 24px' }}>
              {error || 'Something went wrong. Please try again.'}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/scan')}
              >
                Back to Scan
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setError(null);
                  setStep('review');
                }}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Review/Configure/Confirm states
  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <button 
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => router.push('/scan')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Consolidate</h2>
          <button 
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '16px' }}>
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="card" style={{ padding: '16px' }}>
                <h4 className="text-sm font-semibold mb-3">Slippage Tolerance</h4>
                <div className="flex gap-2">
                  {SLIPPAGE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`chain-chip ${slippage === opt ? 'active' : ''}`}
                      onClick={() => setSlippage(opt)}
                    >
                      {opt}%
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
              You're consolidating
            </span>
            <span className="badge badge-primary">
              {totals.tokens} tokens
            </span>
          </div>
          
          <div className="text-center py-4">
            <p className="text-3xl font-bold mb-1">${totals.value.toFixed(2)}</p>
            <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
              from {totals.chains} chain{totals.chains > 1 ? 's' : ''}
            </p>
            {totals.excludedCount > 0 && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--warning))' }}>
                {totals.excludedCount} {outputToken} token{totals.excludedCount > 1 ? 's' : ''} on Base excluded
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 py-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--bg-tertiary))' }}
            >
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
          
          {/* Output Token Selector */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Receive as (on Base)
            </p>
            <div className="flex gap-2">
              {OUTPUT_OPTIONS.map(opt => (
                <button
                  key={opt.symbol}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    outputToken === opt.symbol 
                      ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent-light))]' 
                      : 'border-[hsl(var(--border))]'
                  }`}
                  onClick={() => setOutputToken(opt.symbol)}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-semibold">{opt.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Fee Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="summary-panel mb-4"
        >
          <div className="summary-row">
            <span className="summary-label">Input Value</span>
            <span className="summary-value">${totals.value.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label flex items-center gap-1">
              Protocol Fee (0.8%)
              <Info className="w-3 h-3" style={{ color: 'hsl(var(--text-tertiary))' }} />
            </span>
            <span className="summary-value">-${(totals.value * 0.008).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Max Slippage ({slippage}%)</span>
            <span className="summary-value">-${(totals.value * slippage / 100).toFixed(2)}</span>
          </div>
          <div className="summary-row" style={{ borderBottom: 'none' }}>
            <span className="summary-label font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
              Estimated Output
            </span>
            <span className="summary-value text-lg" style={{ color: 'hsl(var(--success))' }}>
              ${estimatedOutput.toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-6 text-center"
        >
          <div className="flex-1 flex flex-col items-center gap-1">
            <Zap className="w-5 h-5" style={{ color: 'hsl(var(--warning))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Optimized Routes
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <Shield className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Non-custodial
            </span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            className="btn btn-primary btn-lg w-full"
            onClick={handleConsolidate}
            disabled={!isConnected}
          >
            {!isConnected ? 'Connect Wallet' : 'Confirm Consolidation'}
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-xs text-center mt-3" style={{ color: 'hsl(var(--text-tertiary))' }}>
            You will be asked to approve each transaction
          </p>
        </motion.div>
      </div>
    </div>
  );
}
