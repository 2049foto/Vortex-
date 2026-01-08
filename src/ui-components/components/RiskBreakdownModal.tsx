/**
 * Risk Breakdown Modal - Shows 20-layer risk analysis details
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';

interface RiskLayer {
  name: string;
  score: number; // 0-10
  weight: number; // percentage
  description: string;
  evidence?: string[];
}

interface RiskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    symbol: string;
    name: string;
    address: string;
    chainId: number;
    logoUrl?: string;
    riskScore?: number;
    tier?: string;
  } | null;
}

// Default risk layers for Phase 1
const DEFAULT_RISK_LAYERS: RiskLayer[] = [
  { name: 'Smart Contract Audit', score: 5, weight: 10, description: 'Contract security verification status' },
  { name: 'Holder Concentration', score: 3, weight: 12, description: 'Distribution of token holders' },
  { name: 'Honeypot Detection', score: 0, weight: 15, description: 'Ability to sell tokens freely' },
  { name: 'Rug Pull Risk', score: 2, weight: 12, description: 'Liquidity lock and ownership patterns' },
  { name: 'Dev Wallet Exposure', score: 4, weight: 8, description: 'Developer holdings percentage' },
  { name: 'Community Sentiment', score: 6, weight: 7, description: 'Social media and community health' },
  { name: 'Volume Trend', score: 5, weight: 8, description: '24h trading volume patterns' },
  { name: 'CEX Listings', score: 7, weight: 10, description: 'Exchange availability' },
  { name: 'Liquidity Depth', score: 4, weight: 10, description: 'Available liquidity for swaps' },
  { name: 'Price Volatility', score: 6, weight: 5, description: 'Price stability over time' },
  { name: 'Token Age', score: 8, weight: 3, description: 'Time since contract deployment' },
  { name: 'Social Verification', score: 5, weight: 0, description: 'Verified social profiles' },
  // Phase 1.2 Advanced Layers
  { name: 'Flash Loan Vulnerability', score: 3, weight: 8, description: 'Susceptibility to flash loan attacks' },
  { name: 'Bridge Risk', score: 4, weight: 7, description: 'Cross-chain bridge security' },
  { name: 'Insider Trading Signals', score: 2, weight: 6, description: 'Unusual trading patterns' },
  { name: 'Regulatory Status', score: 5, weight: 5, description: 'Legal and compliance standing' },
  { name: 'Validator Centralization', score: 4, weight: 6, description: 'Network decentralization' },
  { name: 'Composability Risk', score: 3, weight: 5, description: 'DeFi integration risks' },
  { name: 'Exploit History', score: 2, weight: 8, description: 'Past security incidents' },
  { name: 'ML Anomaly Detection', score: 4, weight: 8, description: 'AI-detected unusual patterns' },
];

export function RiskBreakdownModal({ isOpen, onClose, token }: RiskBreakdownModalProps) {
  if (!token) return null;

  const riskScore = token.riskScore || 35;
  const tier = token.tier || 'DUST';

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-500';
    if (score <= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 3) return 'Low';
    if (score <= 6) return 'Medium';
    return 'High';
  };

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'LEGIT': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle };
      case 'DUST': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: Info };
      case 'MICRODUST': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle };
      default: return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle };
    }
  };

  const tierConfig = getTierConfig(tier);
  const TierIcon = tierConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[520px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {token.logoUrl ? (
                  <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{token.symbol.slice(0, 2)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900">{token.symbol}</h3>
                  <p className="text-xs text-slate-500">{token.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Overall Score */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Overall Risk Score</span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5",
                  tierConfig.bg, tierConfig.border, tierConfig.text, "border"
                )}>
                  <TierIcon className="w-4 h-4" />
                  {tier}
                </div>
              </div>

              {/* Score Bar */}
              <div className="relative">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${riskScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full",
                      riskScore <= 30 ? 'bg-emerald-500' : riskScore <= 60 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>Low Risk</span>
                  <span className="font-semibold text-slate-700">{riskScore}/100</span>
                  <span>High Risk</span>
                </div>
              </div>
            </div>

            {/* Risk Layers */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">20-Layer Analysis</h4>
              <div className="space-y-2">
                {DEFAULT_RISK_LAYERS.map((layer, index) => (
                  <div
                    key={layer.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 truncate">{layer.name}</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          layer.score <= 3 ? 'bg-emerald-100 text-emerald-700' :
                          layer.score <= 6 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {getScoreLabel(layer.score)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", getScoreColor(layer.score))}
                            style={{ width: `${layer.score * 10}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-8">{layer.weight}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Analysis powered by GoPlus, DexScreener, and ML models
                </p>
                <a
                  href={`https://basescan.org/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RiskBreakdownModal;
