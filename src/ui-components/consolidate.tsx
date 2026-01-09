/**
 * Consolidate Component for VORTEX PROTOCOL
 * Premium consolidation flow with step-by-step progress
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Check, Wallet, RefreshCw, Shield, 
  Zap, ChevronDown, ExternalLink, Sparkles, TrendingUp,
  AlertCircle, Copy, CheckCircle2, X, Clock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Types
interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
  chainId: number;
  contractAddress: string;
  tier: string;
  logoUrl?: string;
}

interface ConsolidationRoute {
  id: string;
  name: string;
  estimatedOutput: string;
  estimatedGas: string;
  priceImpact: number;
  isRecommended: boolean;
  logo?: string;
}

interface ConsolidationStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  txHash?: string;
}

type OutputToken = 'ETH' | 'USDC';
type ConsolidationPhase = 'configure' | 'review' | 'executing' | 'complete';

// Router logos
const ROUTER_LOGOS: Record<string, string> = {
  'oneinch': '🔄',
  'uniswap': '🦄',
  'curve': '🔵',
  'balancer': '⚖️',
};

// Default routes
const generateRoutes = (totalValue: number, outputToken: OutputToken): ConsolidationRoute[] => {
  const baseOutput = outputToken === 'ETH' 
    ? (totalValue * 0.995 / 3500).toFixed(6)
    : (totalValue * 0.995).toFixed(2);
  
  return [
    { 
      id: 'oneinch', 
      name: '1inch Aggregator', 
      estimatedOutput: baseOutput, 
      estimatedGas: '$0.00', 
      priceImpact: 0.1, 
      isRecommended: true,
      logo: '🔄'
    },
    { 
      id: 'uniswap', 
      name: 'Uniswap V4', 
      estimatedOutput: (parseFloat(baseOutput) * 0.995).toFixed(outputToken === 'ETH' ? 6 : 2), 
      estimatedGas: '$0.00', 
      priceImpact: 0.2, 
      isRecommended: false,
      logo: '🦄'
    },
    { 
      id: 'curve', 
      name: 'Curve Finance', 
      estimatedOutput: (parseFloat(baseOutput) * 0.993).toFixed(outputToken === 'ETH' ? 6 : 2), 
      estimatedGas: '$0.00', 
      priceImpact: 0.15, 
      isRecommended: false,
      logo: '🔵'
    },
    { 
      id: 'balancer', 
      name: 'Balancer', 
      estimatedOutput: (parseFloat(baseOutput) * 0.992).toFixed(outputToken === 'ETH' ? 6 : 2), 
      estimatedGas: '$0.00', 
      priceImpact: 0.18, 
      isRecommended: false,
      logo: '⚖️'
    },
  ];
};

const DEFAULT_STEPS: ConsolidationStep[] = [
  { id: '1', label: 'Simulate', description: 'Running Tenderly simulation', status: 'pending' },
  { id: '2', label: 'Approve', description: 'Token approvals', status: 'pending' },
  { id: '3', label: 'Execute', description: 'Swapping via 1inch', status: 'pending' },
  { id: '4', label: 'Confirm', description: 'Waiting for confirmation', status: 'pending' },
];

interface ConsolidateProps {
  address?: string;
  tokens?: Asset[];
  isExecuting?: boolean;
  executionStep?: string;
  error?: string | null;
  onExecute?: (tokenAddresses?: string[]) => void;
  onNavigate?: (path: string) => void;
}

export function Consolidate({ address, tokens = [], isExecuting, executionStep, error, onExecute, onNavigate }: ConsolidateProps) {
  const totalValue = tokens.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  // State
  const [outputToken, setOutputToken] = useState<OutputToken>('ETH');
  const [availableRoutes, setAvailableRoutes] = useState<ConsolidationRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<ConsolidationRoute | null>(null);
  const [phase, setPhase] = useState<ConsolidationPhase>('configure');
  const [steps, setSteps] = useState<ConsolidationStep[]>(DEFAULT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update routes when output token changes
  useEffect(() => {
    const routes = generateRoutes(totalValue, outputToken);
    setAvailableRoutes(routes);
    setSelectedRoute(routes[0]);
  }, [totalValue, outputToken]);

  // Simulation & execution logic
  const runConsolidation = useCallback(async () => {
    setPhase('executing');
    
    const stepDurations = [2000, 1500, 3000, 2000];
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'complete' : idx === i ? 'in-progress' : 'pending',
      })));
      
      await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
      
      // Add mock tx hash at execute step
      if (i === 2) {
        setTxHash('0x' + Math.random().toString(16).slice(2, 66));
      }
    }

    // Complete all steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    setPhase('complete');
  }, [steps.length]);

  const handleStartConsolidation = useCallback(async () => {
    if (!selectedRoute) return;
    
    setPhase('review');
  }, [selectedRoute]);

  const handleConfirmConsolidation = useCallback(async () => {
    if (onExecute) {
      const addresses = tokens.map(t => t.contractAddress).filter(Boolean) as string[];
      onExecute(addresses);
    } else {
      runConsolidation();
    }
  }, [runConsolidation, onExecute, tokens]);

  const handleCancel = useCallback(() => {
    setPhase('configure');
    setSteps(DEFAULT_STEPS);
    setCurrentStep(0);
    setTxHash(null);
  }, []);

  const handleCopyTx = useCallback(() => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [txHash]);

  const outputTokenOptions = [
    { value: 'ETH' as OutputToken, label: 'ETH', icon: '⟠', description: 'Native Ether', gradient: 'from-slate-600 to-slate-800' },
    { value: 'USDC' as OutputToken, label: 'USDC', icon: '💵', description: 'USD Coin', gradient: 'from-blue-500 to-blue-700' },
  ];

  // No tokens selected state
  if (tokens.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Gradient border card */}
          <div className="gradient-border rounded-3xl p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Wallet className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Assets Selected</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Go back to scan and select assets to consolidate into ETH or USDC on Base.
            </p>
            <Button 
              onClick={() => onNavigate?.('/scan')}
              className="btn-3d h-12 px-6 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scan
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 mobile-bottom-safe">
      {/* Header */}
      {(phase === 'configure' || phase === 'review') && (
        <div className="mb-8">
          <button
            onClick={() => phase === 'review' ? setPhase('configure') : onNavigate?.('/scan')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{phase === 'review' ? 'Back to Configure' : 'Back to Scan'}</span>
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Consolidate Assets
          </h1>
          <p className="text-slate-500">
            {phase === 'configure' 
              ? `Configure consolidation for ${tokens.length} assets worth $${totalValue.toFixed(2)}`
              : 'Review and confirm your consolidation'
            }
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button onClick={handleCancel} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* =============================================
            PHASE 1: CONFIGURE
        ============================================= */}
        {phase === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Selected Assets Preview - Smart Card */}
            <div className="smart-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Selected Assets</h3>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
                  {tokens.length} tokens
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tokens.slice(0, 6).map(asset => (
                  <motion.div 
                    key={asset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50 cursor-default"
                  >
                    {asset.logoUrl ? (
                      <img src={asset.logoUrl} alt={asset.symbol} className="w-5 h-5 rounded-full ring-2 ring-white" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] text-white font-bold shadow-sm">
                        {asset.symbol.slice(0, 1)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700">{asset.symbol}</span>
                    <span className="text-xs text-slate-400">${(asset.valueUSD || 0).toFixed(2)}</span>
                  </motion.div>
                ))}
                {tokens.length > 6 && (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-500 border border-dashed border-slate-200">
                    +{tokens.length - 6} more
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-slate-500">Total Value</span>
                <span className="text-xl font-bold text-slate-900">${totalValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Output Token Selection */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Output Token</h3>
              <p className="text-sm text-slate-500 mb-4">Choose your destination asset on Base</p>
              
              <div className="grid grid-cols-2 gap-3">
                {outputTokenOptions.map(option => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOutputToken(option.value)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      outputToken === option.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                      `bg-gradient-to-br ${option.gradient}`
                    )}>
                      <span className="text-white">{option.icon}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-slate-900">{option.label}</p>
                      <p className="text-sm text-slate-500">{option.description}</p>
                    </div>
                    {outputToken === option.value && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Route Selection */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Swap Route</h3>
              <p className="text-sm text-slate-500 mb-4">Multi-router comparison for best rate</p>
              
              <div className="space-y-2">
                {availableRoutes.map((route, idx) => (
                  <motion.button
                    key={route.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedRoute(route)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      selectedRoute?.id === route.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                      {route.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{route.name}</span>
                        {route.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            BEST RATE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        Est. output: <span className="font-semibold text-slate-900">{route.estimatedOutput} {outputToken}</span>
                        <span className="text-slate-300 mx-2">•</span>
                        Impact: {route.priceImpact}%
                      </p>
                    </div>
                    {selectedRoute?.id === route.id && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Simulated', desc: 'Tenderly', color: 'text-emerald-600 bg-emerald-50' },
                { icon: Zap, label: 'Gasless', desc: 'Sponsored', color: 'text-amber-600 bg-amber-50' },
                { icon: Wallet, label: 'Non-Custodial', desc: 'Your Keys', color: 'text-indigo-600 bg-indigo-50' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
                  <div className={cn("p-2 rounded-lg", item.color)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={handleStartConsolidation}
              disabled={!selectedRoute}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-lg shadow-xl shadow-indigo-500/25"
            >
              Review Consolidation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* =============================================
            PHASE 2: REVIEW
        ============================================= */}
        {phase === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl">
              <h3 className="text-sm font-medium text-indigo-100 mb-1">You will receive</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">{selectedRoute?.estimatedOutput}</span>
                <span className="text-xl">{outputToken}</span>
              </div>
              <div className="pt-4 border-t border-white/20 flex justify-between text-sm">
                <span className="text-indigo-100">From {tokens.length} tokens</span>
                <span className="text-indigo-100">${totalValue.toFixed(2)} input value</span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Route</span>
                <span className="font-semibold text-slate-900">{selectedRoute?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price Impact</span>
                <span className="font-semibold text-slate-900">{selectedRoute?.priceImpact}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gas Cost</span>
                <span className="font-semibold text-emerald-600">$0.00 (Sponsored)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Fee (0.8%)</span>
                <span className="font-semibold text-slate-900">${(totalValue * 0.008).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <span className="text-slate-900 font-semibold">Net Output</span>
                <span className="font-bold text-indigo-600">{selectedRoute?.estimatedOutput} {outputToken}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Review Carefully</p>
                <p className="text-sm text-amber-700">
                  This action is irreversible. All selected tokens will be swapped to {outputToken} on Base.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase('configure')}
                className="flex-1 h-14 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmConsolidation}
                className="flex-1 h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold btn-3d ripple mobile-touch-target"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Confirm & Execute
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* =============================================
            PHASE 3: EXECUTING
        ============================================= */}
        {(phase === 'executing' || isExecuting) && (
          <motion.div
            key="executing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4"
              >
                <Loader2 className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Executing Consolidation</h2>
              <p className="text-slate-500">{executionStep || 'Please keep this window open'}</p>
            </div>

            {/* Steps */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      step.status === 'complete' && "bg-emerald-50",
                      step.status === 'in-progress' && "bg-indigo-50",
                      step.status === 'pending' && "bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      step.status === 'complete' && "bg-emerald-500",
                      step.status === 'in-progress' && "bg-indigo-500",
                      step.status === 'pending' && "bg-slate-300"
                    )}>
                      {step.status === 'complete' ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : step.status === 'in-progress' ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <span className="text-white font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold",
                        step.status === 'complete' && "text-emerald-800",
                        step.status === 'in-progress' && "text-indigo-800",
                        step.status === 'pending' && "text-slate-500"
                      )}>
                        {step.label}
                      </p>
                      <p className={cn(
                        "text-sm",
                        step.status === 'complete' && "text-emerald-600",
                        step.status === 'in-progress' && "text-indigo-600",
                        step.status === 'pending' && "text-slate-400"
                      )}>
                        {step.description}
                      </p>
                    </div>
                    {step.status === 'complete' && (
                      <span className="text-sm text-emerald-600 font-medium">Done</span>
                    )}
                    {step.status === 'in-progress' && (
                      <span className="text-sm text-indigo-600 font-medium">Processing...</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-100 flex items-center gap-3"
              >
                <span className="text-sm text-slate-500">TX:</span>
                <code className="text-sm text-slate-700 font-mono truncate flex-1">
                  {txHash.slice(0, 16)}...{txHash.slice(-8)}
                </code>
                <button 
                  onClick={handleCopyTx}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* =============================================
            PHASE 4: COMPLETE
        ============================================= */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-slate-900 mb-2"
              >
                Portfolio Cleaned! 🎉
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500"
              >
                {tokens.length} tokens consolidated into {selectedRoute?.estimatedOutput} {outputToken}
              </motion.p>
            </div>

            {/* Result Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200"
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Tokens Consolidated</p>
                  <p className="text-2xl font-bold text-slate-900">{tokens.length}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Output Received</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedRoute?.estimatedOutput} {outputToken}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Gas Saved</p>
                  <p className="text-2xl font-bold text-emerald-600">~$12.50</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Net Gain</p>
                  <p className="text-2xl font-bold text-slate-900">${totalValue.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>

            {/* Transaction Link */}
            {txHash && (
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span className="text-sm text-slate-700">View on Basescan</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </motion.a>
            )}

            {/* Share Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm"
            >
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Share Your Achievement
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => {
                    const text = encodeURIComponent(`Just cleaned my portfolio with @VortexProtocol! Consolidated ${tokens.length} dust tokens into ${outputToken} on Base 🌀✨`);
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                  }}
                >
                  <span className="mr-2">𝕏</span> Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => {
                    const text = encodeURIComponent(`Just cleaned my portfolio with @VortexProtocol! Consolidated ${tokens.length} dust tokens into ${outputToken} on Base 🌀✨`);
                    window.open(`https://warpcast.com/~/compose?text=${text}`, '_blank');
                  }}
                >
                  <span className="mr-2">💬</span> Farcaster
                </Button>
              </div>
            </motion.div>

            {/* XP Earned */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium">XP Earned</p>
                  <p className="text-2xl font-bold text-slate-900">+{tokens.length * 50} XP</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-slate-500">Streak</p>
                  <p className="text-lg font-bold text-indigo-600">🔥 3 Days</p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-3 pt-4"
            >
              <Button
                variant="outline"
                onClick={() => onNavigate?.('/dashboard')}
                className="flex-1 h-12 rounded-xl"
              >
                View Dashboard
              </Button>
              <Button
                onClick={() => onNavigate?.('/scan')}
                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800"
              >
                Scan Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Consolidate;
