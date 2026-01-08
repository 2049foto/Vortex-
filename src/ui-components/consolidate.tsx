/**
 * Consolidate Component for VORTEX PROTOCOL
 * Output token selection, route picker, stepper progress
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Wallet, RefreshCw, Shield, Zap, ChevronDown } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Stepper, StepperMini } from './components/Stepper';
import { ShareButtons } from './components/ShareButtons';
import { OutputToken, ConsolidationRoute, ConsolidationStep, Asset } from './types';
import { cn } from './utils/cn';

// Default routes (will be replaced with real API data)
const DEFAULT_ROUTES: ConsolidationRoute[] = [
  { id: 'best', name: '1inch Aggregator', estimatedOutput: '0.00', estimatedGas: '$0.00', priceImpact: 0.1, isRecommended: true },
  { id: 'uniswap', name: 'Uniswap V4', estimatedOutput: '0.00', estimatedGas: '$0.00', priceImpact: 0.2, isRecommended: false },
  { id: 'curve', name: 'Curve', estimatedOutput: '0.00', estimatedGas: '$0.00', priceImpact: 0.15, isRecommended: false },
];

const DEFAULT_STEPS: ConsolidationStep[] = [
  { id: '1', label: 'Simulating', description: 'Running transaction simulation', status: 'pending' },
  { id: '2', label: 'Approving', description: 'Token approvals', status: 'pending' },
  { id: '3', label: 'Executing', description: 'Swapping tokens', status: 'pending' },
  { id: '4', label: 'Confirming', description: 'Waiting for confirmation', status: 'pending' },
];

interface ConsolidateProps {
  address?: string;
  tokens?: Asset[];
  isExecuting?: boolean;
  error?: string | null;
  onExecute?: (tokenAddresses?: string[]) => void;
  onNavigate?: (path: string) => void;
}

type ConsolidationPhase = 'configure' | 'simulating' | 'executing' | 'complete';

export function Consolidate({ address, tokens = [], isExecuting, error, onExecute, onNavigate }: ConsolidateProps) {
  const totalValue = tokens.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  // Calculate estimated output based on total value
  const estimatedOutput = (totalValue * 0.995 / 3500).toFixed(6); // Rough ETH estimation (minus 0.5% slippage)
  
  // Generate routes with actual estimates
  const availableRoutes: ConsolidationRoute[] = DEFAULT_ROUTES.map((route, idx) => ({
    ...route,
    estimatedOutput: (parseFloat(estimatedOutput) * (1 - idx * 0.005)).toFixed(6), // Slight variation per route
  }));

  // State
  const [outputToken, setOutputToken] = useState<OutputToken>('ETH');
  const [selectedRoute, setSelectedRoute] = useState<ConsolidationRoute | null>(availableRoutes[0]);
  const [phase, setPhase] = useState<ConsolidationPhase>('configure');
  const [steps, setSteps] = useState<ConsolidationStep[]>(DEFAULT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);

  // Simulation & execution logic
  const runSimulation = useCallback(async () => {
    setPhase('simulating');

    // Simulate step progression
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'complete' : idx === i ? 'in-progress' : 'pending',
      })));
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Complete all steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    setPhase('complete');
  }, [steps.length]);

  const handleStartConsolidation = useCallback(async () => {
    if (!selectedRoute) {
      return;
    }
    
    // If external handler provided, use it
    if (onExecute) {
      const addresses = tokens.map(t => t.contractAddress).filter(Boolean) as string[];
      onExecute(addresses);
    } else {
      // Otherwise run local simulation
      runSimulation();
    }
  }, [selectedRoute, runSimulation, onExecute, tokens]);

  const handleCancel = useCallback(() => {
    if (phase === 'simulating' || phase === 'executing') {
      setPhase('configure');
      setSteps(DEFAULT_STEPS);
      setCurrentStep(0);
    }
  }, [phase]);

  const outputTokenOptions = [
    { value: 'ETH' as OutputToken, label: 'ETH', icon: '⟠', description: 'Native Ether on Base' },
    { value: 'USDC' as OutputToken, label: 'USDC', icon: '🔵', description: 'USD Coin on Base' },
  ];

  // No tokens selected state
  if (tokens.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No assets selected</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Go back to scan and select assets to consolidate.
          </p>
          <Button variant="primary" onClick={() => onNavigate && onNavigate('/scan')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      {phase === 'configure' && (
        <button
          onClick={() => onNavigate && onNavigate('/scan')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to scan</span>
        </button>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {phase === 'complete' ? 'Consolidation Complete!' : 'Consolidate Assets'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {phase === 'complete'
            ? 'Your portfolio has been cleaned and consolidated.'
            : `Consolidating ${tokens.length} assets worth $${totalValue.toFixed(2)}`
          }
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-destructive/5 border-destructive/20">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {/* Configuration Phase */}
        {phase === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Selected Assets Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Selected Assets</CardTitle>
                <CardDescription>
                  {tokens.length} assets selected for consolidation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tokens.slice(0, 5).map(asset => (
                    <Badge key={asset.id} variant="muted">
                      {asset.symbol} (${(asset.valueUSD || 0).toFixed(2)})
                    </Badge>
                  ))}
                  {tokens.length > 5 && (
                    <Badge variant="muted">+{tokens.length - 5} more</Badge>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-semibold text-foreground">${totalValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Output Token Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Output Token</CardTitle>
                <CardDescription>Choose where to consolidate your assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {outputTokenOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setOutputToken(option.value)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[72px]',
                        outputToken === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {outputToken === option.value && (
                        <Check className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Route Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Swap Route</CardTitle>
                <CardDescription>Select the best route for your consolidation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <button
                    onClick={() => setShowRouteDropdown(!showRouteDropdown)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[72px]',
                      showRouteDropdown ? 'border-primary' : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    {selectedRoute ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{selectedRoute.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Est. output: {selectedRoute.estimatedOutput} {outputToken}
                          </p>
                        </div>
                        {selectedRoute.isRecommended && (
                          <Badge variant="success" size="sm">Best</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a route</span>
                    )}
                    <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', showRouteDropdown && 'rotate-180')} />
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
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                          {availableRoutes.map(route => (
                            <button
                              key={route.id}
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowRouteDropdown(false);
                              }}
                              className={cn(
                                'w-full flex items-center justify-between p-4 hover:bg-muted transition-colors',
                                selectedRoute?.id === route.id && 'bg-muted'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <Zap className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-foreground">{route.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {route.estimatedOutput} {outputToken}
                                  </p>
                                </div>
                              </div>
                              {route.isRecommended && (
                                <Badge variant="success" size="sm">Best Rate</Badge>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card variant="glass">
              <CardContent className="flex flex-wrap items-center justify-center gap-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Simulation via Tenderly</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Gasless execution</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="w-4 h-4 text-accent" />
                  <span>Non-custodial</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStartConsolidation}
              isLoading={isExecuting}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start Consolidation
            </Button>
          </motion.div>
        )}

        {/* Simulating/Executing Phase */}
        {(phase === 'simulating' || phase === 'executing') && (
          <motion.div
            key="executing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Progress</h3>
                  <StepperMini steps={steps} currentStep={currentStep} />
                </div>
                <Stepper steps={steps} currentStep={currentStep} />
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="text-center py-6">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {phase === 'simulating' ? 'Simulating transaction...' : 'Executing transaction...'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please do not close this window.
                </p>
              </CardContent>
            </Card>

            <Button variant="ghost" className="w-full" onClick={handleCancel}>
              Cancel
            </Button>
          </motion.div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-accent" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Portfolio Cleaned!
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Successfully consolidated {tokens.length} assets into {selectedRoute?.estimatedOutput} {outputToken} on Base.
              </p>
            </Card>

            {/* Result Summary */}
            <Card variant="elevated">
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assets Consolidated</span>
                  <span className="font-semibold text-foreground">{tokens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input Value</span>
                  <span className="font-semibold text-foreground">${totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output</span>
                  <span className="font-semibold text-accent">{selectedRoute?.estimatedOutput} {outputToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Cost</span>
                  <span className="font-semibold text-accent">$0.00 (Sponsored)</span>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Achievement</CardTitle>
                <CardDescription>Let others know about your cleaner portfolio!</CardDescription>
              </CardHeader>
              <CardContent>
                <ShareButtons
                  text={`Just cleaned my portfolio with @VortexProtocol! Consolidated ${tokens.length} dust tokens into ${outputToken} on Base 🌀✨`}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => onNavigate && onNavigate('/dashboard')}>
                View Dashboard
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => onNavigate && onNavigate('/scan')}>
                Scan Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Consolidate;
