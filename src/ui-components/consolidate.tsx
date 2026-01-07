import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, ArrowRight, Loader2, Zap, ShieldCheck, Fuel, Wallet } from 'lucide-react';
import { MOCK_TOKENS } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STEPS = ['Review', 'Quote', 'Sponsor', 'Success'];

export default function ConsolidatePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Simulation states
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'routing' | 'sponsoring' | 'signing'>('idle');

  // Hardcoded selection for demo
  const selectedTokens = MOCK_TOKENS.filter(t => t.tier === 'DUST');
  const totalValue = selectedTokens.reduce((acc, t) => acc + t.valueUsd, 0);

  const handleExecute = async () => {
    setIsProcessing(true);
    
    // Step 1: Routing
    setSimulationStatus('routing');
    await new Promise(r => setTimeout(r, 1500));
    setCurrentStep(1);
    
    // Step 2: Sponsoring
    setSimulationStatus('sponsoring');
    await new Promise(r => setTimeout(r, 1500));
    setCurrentStep(2);
    
    // Step 3: Signing (Simulated)
    setSimulationStatus('signing');
    await new Promise(r => setTimeout(r, 2000));
    setCurrentStep(3);
    
    setIsProcessing(false);
    setSimulationStatus('idle');
  };

  return (
    <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl min-h-screen">
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">Consolidate Assets</h1>
        <p className="text-lg text-slate-500 font-light">Combine your dust into a single, usable asset.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-16 relative px-4 max-w-2xl mx-auto">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-10" />
        <div className="absolute top-5 left-0 h-0.5 bg-indigo-500 -z-10 transition-all duration-700 ease-in-out" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
        
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-[3px] z-10 ${
              i <= currentStep 
                ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                : 'bg-white border-slate-200 text-slate-300'
            }`}>
              {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i <= currentStep ? 'text-indigo-600' : 'text-slate-300'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        {/* Decorative Background Glow */}
        <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] -z-10 rounded-full" />

        {currentStep === 0 && (
          <Card variant="premium" className="overflow-hidden border-white/60 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 p-8">
              <CardTitle className="font-display">Review Batch</CardTitle>
              <CardDescription>You are sweeping <span className="font-semibold text-slate-900">{selectedTokens.length} tokens</span> to Base ETH.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedTokens.map(token => (
                  <div key={token.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={token.logo || 'https://via.placeholder.com/24'} className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 font-display">{token.symbol}</div>
                        <div className="text-xs text-slate-500 font-mono">{token.balance} units</div>
                      </div>
                    </div>
                    <span className="font-mono font-medium text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">${token.valueUsd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-white rounded-2xl border border-indigo-100/50 shadow-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Estimated Output</span>
                  <span className="text-indigo-900 font-medium">Base ETH</span>
                </div>
                <span className="text-3xl font-bold font-display text-indigo-600">~${(totalValue * 0.98).toFixed(2)}</span>
              </div>
              
              <Button size="xl" variant="iridescent" className="w-full shadow-xl shadow-indigo-500/20 text-lg" onClick={handleExecute} disabled={isProcessing} glow>
                {isProcessing ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding Optimal Route...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Confirm & Consolidate <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card variant="mesh" className="border-indigo-200/50 shadow-2xl relative overflow-hidden bg-white">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 pointer-events-none" />
             <CardHeader className="relative z-10">
               <CardTitle className="flex items-center gap-4 !bg-none text-indigo-900 font-display text-2xl">
                 <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-sm">
                    <Zap className="w-6 h-6 fill-current" />
                 </div>
                 Optimizing Route
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-8 pt-8 relative z-10">
                <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg ring-1 ring-black/5">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Route Found</span>
                     <span className="font-bold text-xl flex items-center gap-3 text-slate-900 font-display">
                       1inch Aggregator 
                       <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none">Best Rate</Badge>
                     </span>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Gas Cost</div>
                     <div className="font-bold text-sm text-emerald-700 bg-emerald-100/50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3" />
                       Sponsored
                     </div>
                   </div>
                </div>
                
                <div className="flex justify-center py-12">
                   <div className="relative">
                     <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse rounded-full" />
                     <div className="relative z-10 bg-white p-4 rounded-full shadow-xl border border-indigo-50">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                     </div>
                   </div>
                </div>
                <p className="text-center text-sm text-slate-500 font-medium animate-pulse">
                   Simulating transaction execution...
                </p>
             </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card variant="glass" className="border-indigo-100 bg-indigo-50/30 backdrop-blur-xl">
             <CardHeader>
               <CardTitle className="flex items-center gap-4 text-indigo-900 font-display text-2xl">
                 <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
                   <Fuel className="w-6 h-6 fill-current" />
                 </div>
                 Sponsoring Gas
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-10 pt-10 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 rotate-3"
                >
                   <ShieldCheck className="w-14 h-14 text-white" />
                </motion.div>
                
                <div>
                   <h3 className="text-3xl font-bold font-display text-slate-900 mb-3">Fees Covered!</h3>
                   <p className="text-slate-500 max-w-sm mx-auto text-lg font-light leading-relaxed">
                     <span className="font-semibold text-slate-700">Pimlico Paymaster</span> has successfully verified and sponsored this transaction.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-white/60 p-5 rounded-2xl border border-white/50 shadow-sm">
                   <div className="text-left">
                     <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Sponsor</div>
                     <div className="font-bold text-slate-900 text-lg">Pimlico</div>
                   </div>
                   <div className="text-right">
                     <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Value Saved</div>
                     <div className="font-bold text-emerald-600 text-lg">~$4.50 USD</div>
                   </div>
                </div>
             </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card variant="premium" className="border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white overflow-hidden relative">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent pointer-events-none" />
             <CardContent className="pt-16 pb-12 text-center space-y-10 relative z-10">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1, rotate: [0, 10, 0] }} 
                  className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/10 border-[6px] border-emerald-50 ring-1 ring-emerald-100"
                >
                   <Check className="w-14 h-14 text-emerald-500 stroke-[3]" />
                </motion.div>
                
                <div className="space-y-3">
                   <h2 className="text-4xl font-bold font-display text-emerald-950">Success!</h2>
                   <p className="text-emerald-800/70 text-lg">Your dust has been swept to <span className="font-semibold text-emerald-900">Base ETH</span>.</p>
                </div>
                
                <div className="flex flex-col gap-4 max-w-sm mx-auto pt-4">
                  <Button size="xl" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 rounded-2xl font-bold" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium" onClick={() => window.open('https://basescan.org', '_blank')}>
                    View on Basescan <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
