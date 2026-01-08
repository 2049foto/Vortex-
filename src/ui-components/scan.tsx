/**
 * Scan Component for VORTEX PROTOCOL
 * Portfolio scanning with 11-chain support and asset classification
 * ONLY scans MAINNET tokens - testnet tokens are excluded
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, RefreshCw, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertTriangle, Sparkles, Filter,
  ChevronDown, ExternalLink, Info, Layers, X, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RiskBreakdownModal } from './components/RiskBreakdownModal';

// Types
interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
  chainId: number;
  contractAddress: string;
  tier: 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK_SCAM';
  logoUrl?: string;
  riskScore?: number;
}

interface ScanProps {
  address?: string;
  isLoading?: boolean;
  scanResult?: { tokens?: any[] };
  error?: string | null;
  onScan?: (address?: string) => void;
  onNavigate?: (path: string) => void;
}

// Chain data (MAINNET ONLY)
const CHAINS: Record<number, { id: string; name: string; color: string; shortName: string }> = {
  1: { id: 'ethereum', name: 'Ethereum', color: 'bg-slate-700', shortName: 'ETH' },
  8453: { id: 'base', name: 'Base', color: 'bg-blue-600', shortName: 'Base' },
  42161: { id: 'arbitrum', name: 'Arbitrum', color: 'bg-blue-500', shortName: 'Arb' },
  10: { id: 'optimism', name: 'Optimism', color: 'bg-red-500', shortName: 'OP' },
  137: { id: 'polygon', name: 'Polygon', color: 'bg-purple-600', shortName: 'POL' },
  56: { id: 'bsc', name: 'BNB Chain', color: 'bg-yellow-500', shortName: 'BNB' },
  43114: { id: 'avalanche', name: 'Avalanche', color: 'bg-red-600', shortName: 'AVAX' },
  324: { id: 'zksync', name: 'zkSync', color: 'bg-violet-600', shortName: 'zkS' },
  0: { id: 'solana', name: 'Solana', color: 'bg-gradient-to-r from-purple-500 to-green-400', shortName: 'SOL' },
};

type TabType = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK_SCAM';

export function Scan({ address, isLoading: externalLoading, scanResult, error, onScan, onNavigate }: ScanProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('DUST');
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [selectedChains, setSelectedChains] = useState<Set<number>>(new Set([8453, 1, 42161, 10, 137]));
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showChainFilter, setShowChainFilter] = useState(false);
  const [selectedAssetForRisk, setSelectedAssetForRisk] = useState<Asset | null>(null);

  // Scanning animation
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              // Transform scan results - ONLY mainnet tokens with value > 0
              const transformedAssets: Asset[] = (scanResult?.tokens || [])
                .filter((token: any) => token.valueUsd > 0) // Only tokens with value > 0
                .map((token: any, idx: number) => ({
                  id: `${token.chainId}-${token.address}-${idx}`,
                  name: token.name || 'Unknown Token',
                  symbol: token.symbol || 'UNKNOWN',
                  balance: token.balanceFormatted || '0',
                  valueUSD: token.valueUsd || 0,
                  chainId: token.chainId || 8453,
                  contractAddress: token.address,
                  tier: determineTier(token),
                  logoUrl: token.logoUrl,
                  riskScore: token.riskScore?.totalScore || 0,
                }));
              setAssets(transformedAssets);
            }, 500);
            return 100;
          }
          return prev + Math.random() * 12;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [isScanning, scanResult]);

  // Determine tier from token data
  function determineTier(token: any): Asset['tier'] {
    if (token.riskScore?.tier) return token.riskScore.tier;
    if (token.riskScore?.totalScore >= 70) return 'RISK_SCAM';
    if (token.valueUsd < 0.1) return 'MICRODUST';
    if (token.valueUsd < 10) return 'DUST';
    return 'LEGIT';
  }

  // Auto-select dust tokens
  useEffect(() => {
    if (!isScanning && assets.length > 0) {
      const dustIds = assets.filter(t => t.tier === 'DUST').map(t => t.id);
      setSelectedTokens(new Set(dustIds));
    }
  }, [isScanning, assets]);

  const handleToggleToken = (id: string) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleChain = (chainId: number) => {
    setSelectedChains(prev => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  };

  const handleSelectAllInTab = () => {
    const inTab = filteredAssets.filter(a => a.tier !== 'RISK_SCAM').map(a => a.id);
    setSelectedTokens(new Set([...selectedTokens, ...inTab]));
  };

  const handleClearSelection = () => {
    setSelectedTokens(new Set());
  };

  const handleRescan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setAssets([]);
    setSelectedTokens(new Set());
    if (onScan) onScan(address);
  };

  const handleConsolidate = () => {
    const selected = assets.filter(a => selectedTokens.has(a.id));
    const params = encodeURIComponent(JSON.stringify(selected));
    if (onNavigate) {
      onNavigate(`/consolidate?tokens=${params}`);
    }
  };

  // Filter assets by tab and chains
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesTab = asset.tier === activeTab;
      const matchesChain = selectedChains.has(asset.chainId);
      return matchesTab && matchesChain;
    });
  }, [assets, activeTab, selectedChains]);

  // Calculate stats
  const selectedValue = useMemo(() => {
    return assets
      .filter(t => selectedTokens.has(t.id))
      .reduce((acc, t) => acc + t.valueUSD, 0);
  }, [assets, selectedTokens]);

  const tabCounts = useMemo(() => ({
    LEGIT: assets.filter(t => t.tier === 'LEGIT' && selectedChains.has(t.chainId)).length,
    DUST: assets.filter(t => t.tier === 'DUST' && selectedChains.has(t.chainId)).length,
    MICRODUST: assets.filter(t => t.tier === 'MICRODUST' && selectedChains.has(t.chainId)).length,
    RISK_SCAM: assets.filter(t => t.tier === 'RISK_SCAM' && selectedChains.has(t.chainId)).length,
  }), [assets, selectedChains]);

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'LEGIT', label: 'Legit', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'DUST', label: 'Dust', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'MICRODUST', label: 'Micro', icon: <Layers className="w-4 h-4" /> },
    { key: 'RISK_SCAM', label: 'Risk', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  // Scanning State
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative w-40 h-40 mb-8">
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="80" cy="80" r="70"
              className="fill-none stroke-slate-200"
              strokeWidth="8"
            />
            <circle
              cx="80" cy="80" r="70"
              className="fill-none stroke-indigo-600"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * scanProgress) / 100}
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{Math.round(scanProgress)}%</span>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Scanning Portfolio
        </h2>
        <p className="text-slate-500 text-center max-w-sm mb-6">
          Analyzing tokens across 11 mainnet chains
        </p>
        
        {/* Chain progress indicators */}
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {['Base', 'Ethereum', 'Arbitrum', 'Solana'].map((chain, i) => (
            <motion.div 
              key={chain}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: scanProgress > (i + 1) * 20 ? 1 : 0.3 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium",
                scanProgress > (i + 1) * 20 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {chain}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Results State
  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => onNavigate?.('/')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Scan Results</h1>
            </div>
            <p className="text-sm text-slate-500 ml-9">
              {assets.length} tokens found • {Object.keys(CHAINS).filter(k => 
                assets.some(a => a.chainId === Number(k))
              ).length} chains
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRescan}
            className="h-9 px-3 rounded-lg border-slate-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Rescan
          </Button>
        </div>

        {/* Chain Filter */}
        <div className="mb-5">
          <button
            onClick={() => setShowChainFilter(!showChainFilter)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            Filter Chains
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">
              {selectedChains.size}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-slate-400 transition-transform",
              showChainFilter && "rotate-180"
            )} />
          </button>
          
          <AnimatePresence>
            {showChainFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 rounded-xl">
                  {Object.entries(CHAINS).map(([id, chain]) => {
                    const chainId = Number(id);
                    const hasTokens = assets.some(a => a.chainId === chainId);
                    const isSelected = selectedChains.has(chainId);
                    
                    return (
                      <button
                        key={id}
                        onClick={() => handleToggleChain(chainId)}
                        disabled={!hasTokens}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          !hasTokens && "opacity-40 cursor-not-allowed",
                          isSelected 
                            ? "bg-slate-900 text-white" 
                            : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {chain.shortName}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tier Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-5 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key 
                  ? "text-slate-900" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-xs",
                  activeTab === tab.key ? "bg-slate-100" : "bg-slate-200/60"
                )}>
                  {tabCounts[tab.key]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab Actions */}
        {activeTab !== 'RISK_SCAM' && filteredAssets.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleSelectAllInTab}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Select All ({filteredAssets.length})
            </button>
            {selectedTokens.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-sm text-slate-500 hover:text-slate-600"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Asset List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset, i) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <TokenCard 
                    asset={asset}
                    isSelected={selectedTokens.has(asset.id)}
                    onToggle={() => handleToggleToken(asset.id)}
                    isRisk={asset.tier === 'RISK_SCAM'}
                    onShowRisk={() => setSelectedAssetForRisk(asset)}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No tokens found</h3>
                <p className="text-sm text-slate-500">
                  No {activeTab.toLowerCase().replace('_', '/')} tokens in selected chains
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 safe-bottom"
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Selected</span>
                <span className="text-lg font-bold text-slate-900">{selectedTokens.size}</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <span className="text-xs text-slate-500 block">Value</span>
                <span className="text-lg font-bold text-emerald-600">${selectedValue.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => onNavigate?.('/dashboard')}
                className="h-11 px-4 rounded-xl border-slate-200"
              >
                Dashboard
              </Button>
              <Button 
                onClick={handleConsolidate}
                disabled={selectedTokens.size === 0}
                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold disabled:opacity-50"
              >
                Consolidate
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Breakdown Modal */}
      <RiskBreakdownModal
        isOpen={!!selectedAssetForRisk}
        onClose={() => setSelectedAssetForRisk(null)}
        token={selectedAssetForRisk ? {
          symbol: selectedAssetForRisk.symbol,
          name: selectedAssetForRisk.name,
          address: selectedAssetForRisk.contractAddress,
          chainId: selectedAssetForRisk.chainId,
          logoUrl: selectedAssetForRisk.logoUrl,
          riskScore: selectedAssetForRisk.riskScore,
          tier: selectedAssetForRisk.tier,
        } : null}
      />
    </div>
  );
}

// Token Card Component
function TokenCard({ 
  asset, 
  isSelected, 
  onToggle,
  isRisk,
  onShowRisk
}: { 
  asset: Asset;
  isSelected: boolean;
  onToggle: () => void;
  isRisk: boolean;
  onShowRisk?: () => void;
}) {
  const chain = CHAINS[asset.chainId];

  return (
    <div
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
        isRisk 
          ? "bg-red-50/50 border-red-100" 
          : isSelected 
            ? "bg-indigo-50 border-indigo-200" 
            : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={isRisk ? undefined : onToggle}
        disabled={isRisk}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          isRisk 
            ? "border-red-300 bg-red-100 cursor-not-allowed" 
            : isSelected 
              ? "border-indigo-600 bg-indigo-600 cursor-pointer" 
              : "border-slate-300 cursor-pointer hover:border-slate-400"
        )}
      >
        {isSelected && !isRisk && (
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        )}
        {isRisk && (
          <X className="w-3 h-3 text-red-500" />
        )}
      </button>

      {/* Token Icon */}
      <div className="relative flex-shrink-0">
        {asset.logoUrl ? (
          <img 
            src={asset.logoUrl} 
            alt={asset.symbol}
            className="w-10 h-10 rounded-full bg-slate-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=6366f1&color=fff&size=40`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
          </div>
        )}
        {/* Chain badge */}
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white",
          chain?.color || 'bg-slate-500'
        )}>
          {chain?.shortName?.slice(0, 1) || '?'}
        </div>
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 truncate">{asset.symbol}</span>
          {isRisk && (
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-medium">
              RISK
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 truncate block">{asset.name}</span>
      </div>

      {/* Risk Score Button */}
      <button
        onClick={onShowRisk}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-medium text-slate-600"
      >
        <Shield className="w-3 h-3" />
        {asset.riskScore || 35}
      </button>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        <div className={cn(
          "font-semibold",
          isRisk ? "text-red-600" : "text-slate-900"
        )}>
          ${asset.valueUSD.toFixed(2)}
        </div>
        <div className="text-xs text-slate-500">{parseFloat(asset.balance).toFixed(4)}</div>
      </div>
    </div>
  );
}

export default Scan;
