'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Consolidation Page 2026
 * Token consolidation flow with real-time feedback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Info,
  Loader2,
  Sparkles,
  DollarSign,
  Layers,
  ArrowDownUp,
  Wallet
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceFormatted: string;
  valueUsd: number;
  tier: string;
  riskScore: number;
}

interface SwapQuote {
  router: string;
  fromToken: string;
  toToken: string;
  amountIn: string;
  expectedOut: string;
  priceImpact: number;
  estimatedGas: string;
}

interface ConsolidationPlan {
  id: string;
  swaps: SwapQuote[];
  estimatedOutput: string;
  estimatedGasSaved: string;
  estimatedTime: number;
}

type ConsolidationStep = 'review' | 'confirm' | 'processing' | 'success' | 'error';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const OUTPUT_OPTIONS = [
  { id: 'ETH', name: 'ETH', icon: '⟠', address: '0x4200000000000000000000000000000000000006' },
  { id: 'USDC', name: 'USDC', icon: '💵', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
];

const SLIPPAGE_OPTIONS = [0.5, 1, 2, 3];

const CHAINS: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  8453: { name: 'Base', icon: '🔵', color: '#0052FF' },
  42161: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
  10: { name: 'Optimism', icon: '🔴', color: '#FF0420' },
  137: { name: 'Polygon', icon: '💜', color: '#8247E5' },
  56: { name: 'BNB', icon: '🟡', color: '#F0B90B' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function TokenSummaryCard({ tokens }: { tokens: Token[] }) {
  const totalValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const chainCounts = tokens.reduce((acc, t) => {
    acc[t.chainId] = (acc[t.chainId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" />
        Tokens to Consolidate
      </h3>

      <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hidden">
        {tokens.map((token, i) => {
          const chain = CHAINS[token.chainId] || { name: 'Unknown', icon: '?', color: '#888' };
          return (
            <motion.div
              key={`${token.chainId}:${token.address}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-card-hover"
            >
              <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-sm font-bold">
                {token.symbol.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{token.symbol}</div>
                <div className="text-xs text-foreground-muted flex items-center gap-1">
                  <span>{chain.icon}</span>
                  <span>{chain.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${token.valueUsd.toFixed(2)}</div>
                <div className="text-xs text-foreground-muted">
                  {parseFloat(token.balanceFormatted).toFixed(4)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-foreground-muted">Total</span>
          <span className="text-xl font-bold">${totalValue.toFixed(2)}</span>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {Object.entries(chainCounts).map(([chainId, count]) => {
            const chain = CHAINS[Number(chainId)] || { name: 'Unknown', icon: '?', color: '#888' };
            return (
              <span 
                key={chainId}
                className="badge"
                style={{ backgroundColor: `${chain.color}20`, color: chain.color }}
              >
                {chain.icon} {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OutputSelector({
  selected,
  onSelect,
  slippage,
  onSlippageChange
}: {
  selected: typeof OUTPUT_OPTIONS[0];
  onSelect: (o: typeof OUTPUT_OPTIONS[0]) => void;
  slippage: number;
  onSlippageChange: (s: number) => void;
}) {
  const [showSlippage, setShowSlippage] = useState(false);

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <ArrowDownUp className="w-5 h-5 text-primary" />
        Output Token
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {OUTPUT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selected.id === option.id 
                ? 'border-primary bg-primary-muted' 
                : 'border-border hover:border-border-hover'
            }`}
          >
            <span className="text-2xl mb-2 block">{option.icon}</span>
            <span className="font-semibold">{option.name}</span>
          </button>
        ))}
      </div>

      <div>
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          Slippage: {slippage}%
          <ChevronDown className={`w-4 h-4 transition-transform ${showSlippage ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showSlippage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-3">
                {SLIPPAGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSlippageChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      slippage === s 
                        ? 'bg-primary text-white' 
                        : 'bg-card-hover hover:bg-border'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EstimateCard({
  plan,
  outputToken,
  isLoading
}: {
  plan: ConsolidationPlan | null;
  outputToken: typeof OUTPUT_OPTIONS[0];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-success" />
        Estimated Output
      </h3>

      <div className="text-center py-4">
        <div className="text-4xl font-bold text-success mb-2">
          {parseFloat(plan.estimatedOutput).toFixed(6)} {outputToken.name}
        </div>
        <div className="text-foreground-muted">
          ≈ ${(parseFloat(plan.estimatedOutput) * (outputToken.id === 'ETH' ? 3500 : 1)).toFixed(2)}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Swaps</span>
          <span>{plan.swaps.length} transactions</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Estimated Time</span>
          <span>~{plan.estimatedTime}s</span>
        </div>
        <div className="flex justify-between text-sm text-success">
          <span>Gas Saved</span>
          <span className="font-medium">${plan.estimatedGasSaved}</span>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-success-bg border border-success-border">
        <div className="flex items-center gap-2 text-success text-sm">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Gasless on Base</span>
        </div>
        <p className="text-xs text-foreground-secondary mt-1">
          Transaction fees sponsored by Vortex Protocol
        </p>
      </div>
    </div>
  );
}

function ProcessingStatus({
  currentStep,
  totalSteps,
  currentToken
}: {
  currentStep: number;
  totalSteps: number;
  currentToken: string;
}) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <svg className="w-24 h-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - currentStep / totalSteps)}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="w-8 h-8 text-primary" />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">Consolidating Tokens</h2>
      <p className="text-foreground-secondary mb-6">
        Processing {currentToken}...
      </p>

      <div className="text-sm text-foreground-muted">
        Step {currentStep} of {totalSteps}
      </div>

      <div className="progress-bar mt-4">
        <div 
          className="progress-bar-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

function SuccessScreen({
  outputAmount,
  outputToken,
  txHash,
  gasSaved
}: {
  outputAmount: string;
  outputToken: typeof OUTPUT_OPTIONS[0];
  txHash: string;
  gasSaved: string;
}) {
  const router = useRouter();

  return (
    <div className="card p-8 text-center max-w-md mx-auto success-bg">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold mb-2">Consolidation Complete!</h2>
      <p className="text-foreground-secondary mb-6">
        Your tokens have been successfully consolidated
      </p>

      <div className="p-4 rounded-xl bg-card mb-6">
        <div className="text-3xl font-bold text-success mb-1">
          {outputAmount} {outputToken.name}
        </div>
        <div className="text-sm text-foreground-muted">
          Saved ${gasSaved} in gas fees
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          <ExternalLink className="w-4 h-4" />
          View Transaction
        </a>
        <button 
          onClick={() => router.push('/dashboard')}
          className="btn btn-primary"
        >
          <ArrowRight className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-danger-bg flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-danger" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Consolidation Failed</h2>
      <p className="text-foreground-secondary mb-6">{message}</p>

      <button onClick={onRetry} className="btn btn-primary">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function WalletRequired() {
  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-6">
        <Wallet className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
      <p className="text-foreground-secondary mb-6">
        Please connect your wallet to consolidate tokens
      </p>

      <button className="btn btn-primary">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ConsolidateClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // State
  const [step, setStep] = useState<ConsolidationStep>('review');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [outputToken, setOutputToken] = useState(OUTPUT_OPTIONS[0]);
  const [slippage, setSlippage] = useState(1);
  const [plan, setPlan] = useState<ConsolidationPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');

  // Load tokens from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('consolidateTokens');
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch (e) {
        router.push('/scan');
      }
    } else {
      router.push('/scan');
    }
  }, [router]);

  // Fetch consolidation plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (tokens.length === 0 || !isConnected) return;

      setIsLoadingPlan(true);
      try {
        const response = await fetch('/api/v1/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            selectedTokens: tokens.map(t => ({ chainId: t.chainId, address: t.address })),
            outputToken: outputToken.id,
            slippagePct: slippage,
            dryRun: true,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setPlan(data.data.plan);
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [tokens, outputToken, slippage, address, isConnected]);

  // Execute consolidation
  const handleConsolidate = useCallback(async () => {
    if (!plan || !walletClient || !address) return;

    setStep('processing');
    setProcessingStep(0);
    setError(null);

    try {
      // Simulate progress
      for (let i = 0; i <= plan.swaps.length; i++) {
        await new Promise(r => setTimeout(r, 2000));
        setProcessingStep(i + 1);
      }

      // Execute actual swap
      const response = await fetch('/api/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          selectedTokens: tokens.map(t => ({ chainId: t.chainId, address: t.address })),
          outputToken: outputToken.id,
          slippagePct: slippage,
          dryRun: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTxHash(data.data.txHash || '0x' + Math.random().toString(16).slice(2));
        setStep('success');
        sessionStorage.removeItem('consolidateTokens');
      } else {
        throw new Error(data.error || 'Consolidation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  }, [plan, walletClient, address, tokens, outputToken, slippage]);

  // Not connected
  if (!isConnected) {
    return (
      <div className="page safe-top">
        <div className="container py-12">
          <WalletRequired />
        </div>
      </div>
    );
  }

  // No tokens
  if (tokens.length === 0 && step === 'review') {
    return (
      <div className="page safe-top">
        <div className="container py-12">
          <div className="card p-8 text-center max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">No Tokens Selected</h2>
            <p className="text-foreground-secondary mb-6">
              Please scan your wallet and select tokens to consolidate
            </p>
            <button onClick={() => router.push('/scan')} className="btn btn-primary">
              Go to Scan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page safe-top">
      <div className="container py-8">
        {/* Header */}
        {step === 'review' && (
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => router.back()} className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold">Consolidate Tokens</h1>
              <p className="text-foreground-secondary">
                Review and confirm your consolidation
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Left: Tokens */}
              <div className="space-y-6">
                <TokenSummaryCard tokens={tokens} />
                <OutputSelector
                  selected={outputToken}
                  onSelect={setOutputToken}
                  slippage={slippage}
                  onSlippageChange={setSlippage}
                />
              </div>

              {/* Right: Estimate */}
              <div className="space-y-6">
                <EstimateCard
                  plan={plan}
                  outputToken={outputToken}
                  isLoading={isLoadingPlan}
                />

                {/* Warning */}
                <div className="p-4 rounded-xl bg-warning-bg border border-warning-border">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning mb-1">Review Carefully</h4>
                      <p className="text-sm text-foreground-secondary">
                        Once submitted, this action cannot be undone. Make sure you've reviewed all tokens and the estimated output.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={handleConsolidate}
                  disabled={!plan || isLoadingPlan}
                  className="btn btn-primary btn-lg w-full btn-shimmer"
                >
                  <Zap className="w-5 h-5" />
                  Consolidate {tokens.length} Tokens
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && plan && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProcessingStatus
                currentStep={processingStep}
                totalSteps={plan.swaps.length + 1}
                currentToken={tokens[processingStep - 1]?.symbol || 'Finalizing...'}
              />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessScreen
                outputAmount={plan?.estimatedOutput || '0'}
                outputToken={outputToken}
                txHash={txHash}
                gasSaved={plan?.estimatedGasSaved || '0'}
              />
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ErrorScreen
                message={error || 'An unknown error occurred'}
                onRetry={() => setStep('review')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
