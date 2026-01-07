import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TokenCard } from '@/components/token/token-card';
import { MOCK_TOKENS } from '@/lib/utils';
import { Search, Loader2, Filter, AlertCircle, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ScanProps {
  address?: string;
  isLoading?: boolean;
  scanResult?: any;
  error?: string | null;
  onScan?: (address?: string) => void;
  onNavigate?: (path: string) => void;
}

export function Scan({ address, isLoading, scanResult, error, onScan, onNavigate }: ScanProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK'>('DUST');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  // Simulate scanning
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 800);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Pre-select dust tokens once scan finishes
  useEffect(() => {
    if (!isScanning) {
      const dustIds = MOCK_TOKENS.filter(t => t.tier === 'DUST').map(t => t.id);
      setSelectedTokens(dustIds);
    }
  }, [isScanning]);

  const handleToggleToken = (id: string) => {
    setSelectedTokens(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const filteredTokens = MOCK_TOKENS.filter(t => 
    activeTab === 'RISK' ? t.tier === 'RISK' : t.tier === activeTab
  );

  const selectedValue = MOCK_TOKENS
    .filter(t => selectedTokens.includes(t.id))
    .reduce((acc, t) => acc + t.valueUsd, 0);

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px]"
           />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
            {/* Spinning Rings - Premium Feel */}
            <motion.div 
              className="absolute inset-0 border-[3px] border-indigo-100 rounded-full"
            />
            <motion.div 
              className="absolute inset-0 border-[3px] border-transparent border-t-indigo-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
             <motion.div 
              className="absolute inset-4 border-[3px] border-transparent border-t-purple-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="flex flex-col items-center justify-center bg-white w-32 h-32 rounded-full shadow-2xl shadow-indigo-500/20">
              <span className="text-3xl font-bold font-display text-slate-900">{Math.round(scanProgress)}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Scanning</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-display font-bold mb-3 text-slate-900">
            Analyzing Portfolio
          </h2>
          <p className="text-slate-500 mb-8 max-w-md text-center font-light leading-relaxed">
            We are checking liquidity, approvals, and calculating risk scores across <span className="font-semibold text-slate-700">12 chains</span>.
          </p>
          
          <div className="mt-8 flex gap-8 text-sm font-medium">
             {['Base', 'Optimism', 'Arbitrum', 'Mainnet'].map((chain, i) => (
               <motion.div 
                 key={chain}
                 animate={{ opacity: scanProgress > (i + 1) * 20 ? 1 : 0.3, y: scanProgress > (i + 1) * 20 ? 0 : 5 }}
                 className="flex items-center gap-2 text-indigo-600 font-semibold"
               >
                 <div className={`w-2 h-2 rounded-full ${scanProgress > (i + 1) * 20 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                 {chain}
               </motion.div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-32 max-w-6xl min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900">Scan Results</h1>
          <p className="text-slate-500 mt-2 text-lg font-light">Found <span className="font-semibold text-slate-900">{MOCK_TOKENS.length} assets</span> worthy of attention.</p>
        </div>
        <div className="p-1.5 bg-white rounded-full border border-slate-200 shadow-sm flex gap-1">
           {/* Tier Tabs */}
           {(['LEGIT', 'DUST', 'MICRODUST', 'RISK'] as const).map(tier => (
             <button
               key={tier}
               onClick={() => setActiveTab(tier)}
               className={`
                 relative px-5 py-2.5 rounded-full text-xs font-bold transition-all tracking-wide
                 ${activeTab === tier ? 'text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
               `}
             >
               {activeTab === tier && (
                 <motion.div 
                   layoutId="tab-pill"
                   className="absolute inset-0 bg-slate-900 rounded-full shadow-md"
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
               <span className="relative z-10 flex items-center gap-2">
                 {tier}
                 <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tier ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                   {MOCK_TOKENS.filter(t => t.tier === tier).length}
                 </span>
               </span>
             </button>
           ))}
        </div>
      </div>

      {/* Token Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTokens.length > 0 ? (
             filteredTokens.map(token => (
               <TokenCard 
                 key={token.id} 
                 token={token} 
                 isSelected={selectedTokens.includes(token.id)}
                 onToggle={handleToggleToken}
                 showRiskDetails={true}
               />
             ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-2 py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-xl font-display font-bold text-slate-900 mb-2">No tokens found</p>
              <p className="text-slate-500 font-light">There are no assets in the {activeTab} category.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Bar */}
      <motion.div 
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40"
      >
        <Card variant="premium" className="p-2 pr-3 flex items-center justify-between shadow-2xl shadow-slate-900/10 bg-white/95 backdrop-blur-2xl border-white/50 ring-1 ring-slate-900/5">
          <div className="flex items-center gap-6 pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected</span>
              <span className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
                {selectedTokens.length} <span className="text-sm font-normal text-slate-400 font-sans">assets</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Value</span>
              <span className="text-xl font-bold text-indigo-600 font-display">${selectedValue.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
             {selectedTokens.length > 0 && (
               <Button variant="ghost" className="text-slate-500 hover:text-red-500 hover:bg-red-50" onClick={() => setSelectedTokens([])}>
                 Clear
               </Button>
             )}
             <Button 
               variant="premium"
               size="lg"
               onClick={() => onNavigate && onNavigate('/consolidate')} 
               disabled={selectedTokens.length === 0}
               className="rounded-xl shadow-lg shadow-slate-900/20"
             >
               Consolidate
               <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
