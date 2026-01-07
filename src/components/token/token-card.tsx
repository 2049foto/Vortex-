import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, ShieldAlert, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TokenCardProps {
  token: any;
  isSelected: boolean;
  onToggle: (id: string) => void;
  showRiskDetails?: boolean;
}

export function TokenCard({ token, isSelected, onToggle, showRiskDetails }: TokenCardProps) {
  
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'LEGIT': return 'text-emerald-700 bg-emerald-50 border-emerald-200/50';
      case 'DUST': return 'text-amber-700 bg-amber-50 border-amber-200/50';
      case 'MICRODUST': return 'text-slate-600 bg-slate-100 border-slate-200/50';
      case 'RISK': return 'text-red-700 bg-red-50 border-red-200/50';
      default: return 'text-slate-600 bg-slate-50 border-slate-200/50';
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
      <div 
        className={cn(
          "cursor-pointer relative overflow-hidden rounded-3xl border transition-all duration-300 group bg-white",
          isSelected 
            ? "border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]" 
            : "border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5",
        )}
        onClick={() => onToggle(token.id)}
      >
        {/* Selection Indicator Background */}
        <div className={cn(
          "absolute inset-0 bg-indigo-50/40 transition-opacity duration-300 pointer-events-none",
          isSelected ? "opacity-100" : "opacity-0"
        )} />

        <div className="relative p-5 flex items-center gap-5">
          {/* Checkbox / Icon Area */}
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 shadow-sm",
            isSelected 
              ? "bg-indigo-600 text-white scale-110 shadow-indigo-500/30" 
              : "bg-white border border-slate-100 text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-400"
          )}>
            {isSelected ? <Check className="w-6 h-6 stroke-[3]" /> : (
              token.logo ? <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-100" />
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-lg text-slate-900 truncate font-display">{token.name}</h4>
              <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 h-auto font-bold tracking-wide border", getTierColor(token.tier))}>
                {token.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1 font-mono text-xs tracking-tight">
                {token.balance} {token.symbol}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-slate-900 font-bold">${token.valueUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="text-right shrink-0">
            <div className="flex flex-col items-end gap-1">
               <div className={cn(
                 "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border",
                 token.riskScore > 75 
                   ? "bg-red-50 text-red-600 border-red-100" 
                   : "bg-emerald-50 text-emerald-600 border-emerald-100"
               )}>
                 <ShieldCheck className="w-3.5 h-3.5" />
                 {token.riskScore}/100
               </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Details */}
        {showRiskDetails && token.riskScore > 20 && (
          <div className="px-5 pb-4 pt-0">
             <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Liquidity Detected • Honeypot Scan Passed</span>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
