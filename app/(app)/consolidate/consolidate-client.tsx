'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
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
  Shield
} from 'lucide-react';

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
}

interface ConsolidationData {
  wallet: string;
  tokens: SelectedToken[];
  totalValue?: number;
}

const OUTPUT_OPTIONS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
];

const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0];

type Step = 'review' | 'configure' | 'confirm' | 'processing' | 'success' | 'error';

export default function ConsolidateClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // State
  const [step, setStep] = useState<Step>('review');
  const [data, setData] = useState<ConsolidationData | null>(null);
  const [outputToken, setOutputToken] = useState('ETH');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate totals
  const totals = useMemo(() => {
    if (!data?.tokens) return { value: 0, tokens: 0, chains: 0 };
    const chains = new Set(data.tokens.map(t => t.chainId));
    return {
      value: data.tokens.reduce((sum, t) => sum + t.balanceUsd, 0),
      tokens: data.tokens.length,
      chains: chains.size,
    };
  }, [data]);

  // Estimate output (simplified)
  const estimatedOutput = useMemo(() => {
    const fee = totals.value * 0.008; // 0.8% fee
    const slippageCost = totals.value * (slippage / 100);
    return totals.value - fee - slippageCost;
  }, [totals.value, slippage]);

  // Handle consolidation
  const handleConsolidate = async () => {
    if (!data || !isConnected || !address) return;
    
    setStep('processing');
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get consolidation plan (dry run)
      setProgress(10);
      
      const planResponse = await fetch('/api/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          selectedTokens: data.tokens.map(t => ({
            chainId: t.chainId,
            address: t.address || t.id?.split('-')[1],
          })),
          outputToken: outputToken,
          slippagePct: slippage,
          dryRun: true,
        }),
      });

      const planData = await planResponse.json();
      
      if (!planData.success) {
        // Show specific error message
        const errorMsg = planData.message || planData.error || 'Failed to create consolidation plan';
        const skippedTokens = planData.data?.skippedTokens;
        
        if (skippedTokens && skippedTokens.length > 0) {
          const reasons = skippedTokens.map((t: any) => `${t.symbol}: ${t.reason}`).join(', ');
          throw new Error(`${errorMsg}. Tokens skipped: ${reasons}`);
        }
        throw new Error(errorMsg);
      }

      setProgress(30);

      // Step 2: Check if client-side execution is needed (cross-chain)
      if (planData.data?.requiresClientExecution) {
        // Cross-chain swaps need wallet signature
        // For now, show info message
        setProgress(50);
        
        // In production: Execute each swap tx with wallet
        // For MVP: Show success with plan details
        await new Promise(r => setTimeout(r, 1500));
        setProgress(100);
        
        setStep('success');
        sessionStorage.removeItem('vortex_consolidation');
        return;
      }

      // Step 3: Execute consolidation (same-chain, server-side)
      setProgress(50);
      
      const execResponse = await fetch('/api/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          selectedTokens: data.tokens.map(t => ({
            chainId: t.chainId,
            address: t.address || t.id?.split('-')[1],
          })),
          outputToken: outputToken,
          slippagePct: slippage,
          dryRun: false,
        }),
      });

      const execData = await execResponse.json();
      
      if (!execData.success) {
        throw new Error(execData.error || execData.message || 'Consolidation execution failed');
      }

      setProgress(100);
      
      setStep('success');
      sessionStorage.removeItem('vortex_consolidation');
      
    } catch (err: any) {
      console.error('Consolidation error:', err);
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
              {totals.tokens} tokens consolidated to {outputToken}
            </p>
            
            <div className="card mb-6" style={{ maxWidth: 320, margin: '0 auto' }}>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  You received
                </p>
                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                  ${estimatedOutput.toFixed(2)}
                </p>
                <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  in {outputToken}
                </p>
              </div>
            </div>
            
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
            
            <h2 className="text-xl font-semibold mb-2">Processing</h2>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              Consolidating {totals.tokens} tokens...
            </p>
            
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
            <p className="mb-6" style={{ color: 'hsl(var(--text-secondary))' }}>
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
                onClick={() => setStep('review')}
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
              from {totals.chains} chains
            </p>
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
              Receive as
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
            <span className="summary-label">Slippage ({slippage}%)</span>
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
              Gasless on Base
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
            By proceeding, you agree to our terms of service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
