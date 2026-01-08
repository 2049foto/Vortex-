/**
 * Consolidate Page for VORTEX PROTOCOL
 * Output token selection, route picker, and transaction execution
 * Light Mode Design
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Check, Wallet, RefreshCw, 
  Shield, Zap, ChevronDown, ExternalLink, Copy, Share2,
  CheckCircle2, Loader2
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

type OutputToken = 'ETH' | 'USDC';

interface ConsolidatePageProps {
  selectedAssets?: Asset[];
  onNavigate?: (path: string) => void;
}

type Phase = 'configure' | 'simulating' | 'executing' | 'complete';

const ROUTES = [
  { id: '1inch', name: '1inch Aggregator', icon: '🔄', recommended: true },
  { id: 'uniswap', name: 'Uniswap V4', icon: '🦄', recommended: false },
  { id: 'curve', name: 'Curve Finance', icon: '📈', recommended: false },
  { id: 'balancer', name: 'Balancer', icon: '⚖️', recommended: false },
];

export function ConsolidatePage({ selectedAssets = [], onNavigate }: ConsolidatePageProps) {
  const router = useRouter();
  
  const totalValue = selectedAssets.reduce((sum, a) => sum + (a.valueUSD || 0), 0);
  const ethPrice = 3500;
  const estimatedEthOutput = (totalValue * 0.995 / ethPrice).toFixed(6);

  // State
  const [outputToken, setOutputToken] = useState<OutputToken>('ETH');
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [phase, setPhase] = useState<Phase>('configure');
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [txHash, setTxHash] = useState<string | null>(null);

  const steps = [
    { label: 'Simulating', description: 'Running transaction simulation' },
    { label: 'Approving', description: 'Setting token approvals' },
    { label: 'Executing', description: 'Swapping tokens' },
    { label: 'Confirming', description: 'Waiting for confirmation' },
  ];

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  const runConsolidation = useCallback(async () => {
    setPhase('simulating');

    for (let i = 0; i < steps.length; i++) {
      setProgressStep(i);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Generate mock tx hash
    setTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    setPhase('complete');
  }, [steps.length]);

  const handleStart = () => {
    runConsolidation();
  };

  // Empty state
  if (selectedAssets.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No assets selected</h2>
          <p className="text-slate-500 mb-6">
            Scan your portfolio and select assets to consolidate.
          </p>
          <Button
            onClick={() => handleNavigate('/scan')}
            className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Scan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {/* Configure Phase */}
        {phase === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => handleNavigate('/scan')}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Consolidate</h1>
                <p className="text-sm text-slate-500">{selectedAssets.length} tokens • ${totalValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Selected Assets Summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Selected Tokens</span>
                <button 
                  onClick={() => handleNavigate('/scan')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.slice(0, 6).map(asset => (
                  <span 
                    key={asset.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700"
                  >
                    {asset.symbol}
                  </span>
                ))}
                {selectedAssets.length > 6 && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-500">
                    +{selectedAssets.length - 6}
                  </span>
                )}
              </div>
            </div>

            {/* Output Token Selection */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4">
              <span className="text-sm font-medium text-slate-700 block mb-3">Output Token</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'ETH' as OutputToken, icon: '⟠', label: 'ETH', sub: 'on Base' },
                  { value: 'USDC' as OutputToken, icon: '🔵', label: 'USDC', sub: 'on Base' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOutputToken(opt.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                      outputToken === opt.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.sub}</div>
                    </div>
                    {outputToken === opt.value && (
                      <Check className="w-4 h-4 text-indigo-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Selection */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4">
              <span className="text-sm font-medium text-slate-700 block mb-3">Swap Route</span>
              <div className="relative">
                <button
                  onClick={() => setShowRouteDropdown(!showRouteDropdown)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{selectedRoute.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-slate-900 text-sm">{selectedRoute.name}</div>
                      <div className="text-xs text-slate-500">Est. {estimatedEthOutput} {outputToken}</div>
                    </div>
                    {selectedRoute.recommended && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        BEST
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    showRouteDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showRouteDropdown && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowRouteDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                      >
                        {ROUTES.map(route => (
                          <button
                            key={route.id}
                            onClick={() => {
                              setSelectedRoute(route);
                              setShowRouteDropdown(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors",
                              selectedRoute.id === route.id && "bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{route.icon}</span>
                              <span className="font-medium text-sm text-slate-900">{route.name}</span>
                            </div>
                            {route.recommended && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                                BEST
                              </span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Features */}
            <div className="flex items-center justify-center gap-4 py-4 mb-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Simulated
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Gasless
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                Non-custodial
              </span>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleStart}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base"
            >
              Start Consolidation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Executing Phase */}
        {(phase === 'simulating' || phase === 'executing') && (
          <motion.div
            key="executing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-8"
          >
            <div className="text-center mb-8">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-1">Processing...</h2>
              <p className="text-sm text-slate-500">Please keep this window open</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    i < progressStep 
                      ? "bg-emerald-50 border-emerald-200" 
                      : i === progressStep 
                        ? "bg-indigo-50 border-indigo-200" 
                        : "bg-white border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    i < progressStep 
                      ? "bg-emerald-500 text-white" 
                      : i === progressStep 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-200 text-slate-500"
                  )}>
                    {i < progressStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-slate-900">{step.label}</div>
                    <div className="text-xs text-slate-500">{step.description}</div>
                  </div>
                  {i === progressStep && (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Success!</h2>
              <p className="text-sm text-slate-500">Your portfolio has been cleaned</p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tokens Consolidated</span>
                <span className="font-semibold text-slate-900">{selectedAssets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Input Value</span>
                <span className="font-semibold text-slate-900">${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Output</span>
                <span className="font-semibold text-emerald-600">{estimatedEthOutput} {outputToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gas Fee</span>
                <span className="font-semibold text-emerald-600">$0.00 (Sponsored)</span>
              </div>
            </div>

            {/* Transaction Link */}
            {txHash && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Transaction Hash</div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-200 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <a 
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-700 truncate mt-1">
                  {txHash}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="text-center mb-6">
              <p className="text-xs text-slate-500 mb-2">Share your clean portfolio</p>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-lg"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share on X
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleNavigate('/dashboard')}
                className="flex-1 h-11 rounded-xl"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => handleNavigate('/scan')}
                className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
              >
                Scan Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ConsolidatePage;
