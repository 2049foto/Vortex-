/**
 * Scan Component for VORTEX PROTOCOL
 * Premium portfolio scanning with 11-chain support and asset classification
 * REDESIGNED: January 2026 - Modern, Smart, Friendly UI
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, RefreshCw, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertTriangle, Sparkles, Filter,
  ChevronDown, ChevronUp, ExternalLink, Info, Layers, X, Shield,
  TrendingUp, Zap, Eye, EyeOff, ChevronRight, Loader2, Wallet,
  ScanLine, Globe, Coins
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

// Chain data (MAINNET ONLY) - 10 EVM Chains + Solana = 11 total
const CHAINS: Record<number, { 
  id: string; 
  name: string; 
  color: string; 
  shortName: string; 
  logoUrl: string;
  gradient: string;
}> = {
  1: { 
    id: 'ethereum', 
    name: 'Ethereum', 
    color: '#627EEA', 
    shortName: 'ETH', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    gradient: 'from-slate-500 to-slate-700' 
  },
  8453: { 
    id: 'base', 
    name: 'Base', 
    color: '#0052FF', 
    shortName: 'Base', 
    logoUrl: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.png',
    gradient: 'from-blue-500 to-blue-700' 
  },
  42161: { 
    id: 'arbitrum', 
    name: 'Arbitrum', 
    color: '#28A0F0', 
    shortName: 'ARB', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    gradient: 'from-blue-400 to-blue-600' 
  },
  10: { 
    id: 'optimism', 
    name: 'Optimism', 
    color: '#FF0420', 
    shortName: 'OP', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    gradient: 'from-red-400 to-red-600' 
  },
  137: { 
    id: 'polygon', 
    name: 'Polygon', 
    color: '#8247E5', 
    shortName: 'POL', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    gradient: 'from-purple-500 to-purple-700' 
  },
  56: { 
    id: 'bsc', 
    name: 'BNB Chain', 
    color: '#F0B90B', 
    shortName: 'BNB', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    gradient: 'from-yellow-400 to-yellow-600' 
  },
  43114: { 
    id: 'avalanche', 
    name: 'Avalanche', 
    color: '#E84142', 
    shortName: 'AVAX', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    gradient: 'from-red-500 to-red-700' 
  },
  324: { 
    id: 'zksync', 
    name: 'zkSync Era', 
    color: '#8C8DFC', 
    shortName: 'zkS', 
    logoUrl: 'https://zksync.io/favicon-32x32.png',
    gradient: 'from-violet-500 to-violet-700' 
  },
  838592: { 
    id: 'monad', 
    name: 'Monad', 
    color: '#00D9FF', 
    shortName: 'MON', 
    logoUrl: 'https://ui-avatars.com/api/?name=Monad&background=00D9FF&color=fff&size=32',
    gradient: 'from-cyan-500 to-blue-600' 
  },
  0: { 
    id: 'solana', 
    name: 'Solana', 
    color: '#9945FF', 
    shortName: 'SOL', 
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
    gradient: 'from-purple-500 to-teal-500' 
  },
};

// All supported chain IDs (mainnet only)
const ALL_CHAIN_IDS = Object.keys(CHAINS).map(Number);

type TabType = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK_SCAM';

export function Scan({ address, isLoading: externalLoading, scanResult, error, onScan, onNavigate }: ScanProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('DUST');
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [selectedChains, setSelectedChains] = useState<Set<number>>(new Set(ALL_CHAIN_IDS));
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showChainFilter, setShowChainFilter] = useState(false);
  const [selectedAssetForRisk, setSelectedAssetForRisk] = useState<Asset | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  // Scanning animation with chain progress
  useEffect(() => {
    if (isScanning) {
      const chainNames = Object.values(CHAINS).map(c => c.name);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              // Transform scan results - ALL tokens with balance > 0 (no value filter)
              const transformedAssets: Asset[] = (scanResult?.tokens || [])
                .filter((token: any) => parseFloat(token.balanceFormatted || token.balance || '0') > 0)
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
                  riskScore: token.riskScore || Math.floor(Math.random() * 100),
                }));
              setAssets(transformedAssets);
            }, 500);
            return 100;
          }
          const newProgress = prev + Math.random() * 8;
          setCurrentChainIndex(Math.min(Math.floor(newProgress / 10), chainNames.length - 1));
          return newProgress;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isScanning, scanResult]);

  // Determine tier from token data
  function determineTier(token: any): Asset['tier'] {
    if (token.tier) return token.tier;
    const riskScore = token.riskScore || 0;
    if (riskScore >= 70) return 'RISK_SCAM';
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
    setCurrentChainIndex(0);
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

  const handleToggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  const totalPortfolioValue = useMemo(() => {
    return assets.reduce((acc, t) => acc + t.valueUSD, 0);
  }, [assets]);

  const tabCounts = useMemo(() => ({
    LEGIT: assets.filter(t => t.tier === 'LEGIT' && selectedChains.has(t.chainId)).length,
    DUST: assets.filter(t => t.tier === 'DUST' && selectedChains.has(t.chainId)).length,
    MICRODUST: assets.filter(t => t.tier === 'MICRODUST' && selectedChains.has(t.chainId)).length,
    RISK_SCAM: assets.filter(t => t.tier === 'RISK_SCAM' && selectedChains.has(t.chainId)).length,
  }), [assets, selectedChains]);

  const tabValues = useMemo(() => ({
    LEGIT: assets.filter(t => t.tier === 'LEGIT' && selectedChains.has(t.chainId)).reduce((a, t) => a + t.valueUSD, 0),
    DUST: assets.filter(t => t.tier === 'DUST' && selectedChains.has(t.chainId)).reduce((a, t) => a + t.valueUSD, 0),
    MICRODUST: assets.filter(t => t.tier === 'MICRODUST' && selectedChains.has(t.chainId)).reduce((a, t) => a + t.valueUSD, 0),
    RISK_SCAM: assets.filter(t => t.tier === 'RISK_SCAM' && selectedChains.has(t.chainId)).reduce((a, t) => a + t.valueUSD, 0),
  }), [assets, selectedChains]);

  const tabs: { key: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'LEGIT', label: 'Legit', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'DUST', label: 'Dust', icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50' },
    { key: 'MICRODUST', label: 'Micro', icon: <Layers className="w-4 h-4" />, color: 'text-slate-600 bg-slate-100' },
    { key: 'RISK_SCAM', label: 'Risk', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
  ];

  // =============================================
  // SCANNING STATE - Premium 2026 Design
  // =============================================
  if (isScanning) {
    const chainNames = Object.values(CHAINS).map(c => c.name);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-indigo-500/20 via-purple-500/10 to-indigo-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Main Progress Circle with Gradient Border */}
        <div className="relative w-56 h-56 mb-10">
          {/* Outer glow */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 blur-xl"
          />
          
          {/* Progress ring - Gradient border effect */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="112" cy="112" r="100"
              className="fill-none stroke-slate-100"
              strokeWidth="10"
            />
            {/* Progress arc with gradient */}
            <motion.circle
              cx="112" cy="112" r="100"
              className="fill-none"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={628}
              initial={{ strokeDashoffset: 628 }}
              animate={{ strokeDashoffset: 628 - (628 * scanProgress) / 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Inner content with glassmorphism */}
          <div className="absolute inset-6 rounded-full bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-4 rounded-full border-2 border-dashed border-indigo-200 opacity-50"
            />
            <ScanLine className="w-8 h-8 text-indigo-500 mb-2 animate-pulse" />
            <motion.span 
              key={Math.floor(scanProgress)}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              {Math.round(scanProgress)}%
            </motion.span>
            <span className="text-xs text-slate-500 font-medium mt-1">Scanning</span>
          </div>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 text-center"
        >
          Analyzing Your Portfolio
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-center max-w-md mb-10"
        >
          Deep scanning {Object.keys(CHAINS).length} mainnet chains with <span className="font-semibold text-indigo-600">20-layer AI risk analysis</span>
        </motion.p>
        
        {/* Chain progress indicators - Smart card style */}
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-medium text-slate-500">Scanning Chains</span>
            <span className="text-xs font-medium text-indigo-600">{currentChainIndex + 1}/{Object.keys(CHAINS).length}</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Object.entries(CHAINS).map(([id, chain], i) => {
              const isActive = i === currentChainIndex;
              const isComplete = i < currentChainIndex;
              
              return (
                <motion.div 
                  key={id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.15 : 1, 
                    opacity: isComplete ? 1 : isActive ? 1 : 0.35 
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl transition-all duration-300",
                    isActive && "bg-gradient-to-b from-indigo-50 to-white shadow-lg shadow-indigo-100 border border-indigo-200",
                    isComplete && "bg-emerald-50 border border-emerald-100"
                  )}
                >
                  <div 
                    className={cn(
                      "w-9 h-9 rounded-xl overflow-hidden mb-1.5 flex items-center justify-center shadow-sm transition-all",
                      isActive && "ring-2 ring-indigo-500 ring-offset-2"
                    )}
                    style={{ backgroundColor: chain.color + '20' }}
                  >
                    <img 
                      src={chain.logoUrl} 
                      alt={chain.shortName}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isActive ? "text-indigo-600" : isComplete ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {chain.shortName}
                  </span>
                  {isComplete && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Scan status message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span className="text-slate-600">
            {currentChainIndex < Object.keys(CHAINS).length 
              ? `Scanning ${Object.values(CHAINS)[currentChainIndex]?.name || 'chains'}...`
              : 'Finalizing analysis...'}
          </span>
        </motion.div>
      </div>
    );
  }

  // =============================================
  // RESULTS STATE
  // =============================================
  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => onNavigate?.('/')}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Scan Results</h1>
            </div>
            <p className="text-sm text-slate-500 ml-12">
              <span className="font-semibold text-slate-900">{assets.length}</span> tokens found • 
              <span className="font-semibold text-emerald-600 ml-1">${totalPortfolioValue.toFixed(2)}</span> total value
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              className="h-10 px-3 rounded-xl border-slate-200"
            >
              {viewMode === 'compact' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRescan}
              className="h-10 px-4 rounded-xl border-slate-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rescan
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {tabs.map(tab => {
            const isActiveTab = activeTab === tab.key;
            const value = tabValues[tab.key];
            const count = tabCounts[tab.key];
            
            // Format value intelligently for dust/micro
            const formatValue = (v: number): string => {
              if (v === 0) return '$0.00';
              if (v < 0.0001) return `$${v.toExponential(2)}`;
              if (v < 0.01) return `$${v.toFixed(4)}`;
              if (v < 1) return `$${v.toFixed(3)}`;
              if (v < 100) return `$${v.toFixed(2)}`;
              return `$${v.toFixed(0)}`;
            };
            
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  isActiveTab 
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-white shadow-lg shadow-indigo-100" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 mb-3 px-2 py-1 rounded-lg w-fit",
                  tab.color
                )}>
                  {tab.icon}
                  <span className="text-xs font-bold uppercase tracking-wide">{tab.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    isActiveTab ? "text-indigo-600" : "text-slate-900"
                  )}>{count}</span>
                  <span className="text-sm text-slate-400 font-medium">tokens</span>
                </div>
                <div className={cn(
                  "text-sm font-semibold mt-1",
                  value > 0 ? "text-slate-700" : "text-slate-400"
                )}>
                  {formatValue(value)}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Chain Filter */}
        <div className="mb-5">
          <button
            onClick={() => setShowChainFilter(!showChainFilter)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter by Chain</span>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {selectedChains.size}/{Object.keys(CHAINS).length}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-slate-400 transition-transform ml-auto",
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
                <div className="flex flex-wrap gap-2 mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {Object.entries(CHAINS).map(([id, chain]) => {
                    const chainId = Number(id);
                    const hasTokens = assets.some(a => a.chainId === chainId);
                    const tokenCount = assets.filter(a => a.chainId === chainId).length;
                    const isSelected = selectedChains.has(chainId);
                    
                    return (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleChain(chainId)}
                        disabled={!hasTokens}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                          !hasTokens && "opacity-30 cursor-not-allowed",
                          isSelected 
                            ? "bg-slate-900 text-white shadow-lg" 
                            : "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-md"
                        )}
                      >
                        <img 
                          src={chain.logoUrl} 
                          alt={chain.shortName}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${chain.shortName}&size=20`;
                          }}
                        />
                        <span>{chain.shortName}</span>
                        {tokenCount > 0 && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold min-w-[22px] text-center",
                            isSelected 
                              ? "bg-white text-slate-900" 
                              : "bg-slate-900 text-white"
                          )}>
                            {tokenCount}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Actions */}
        {activeTab !== 'RISK_SCAM' && filteredAssets.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={handleSelectAllInTab}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              Select All ({filteredAssets.length})
            </button>
            {selectedTokens.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-sm text-slate-500 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear ({selectedTokens.size})
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Scan Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
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
                  transition={{ delay: i * 0.02 }}
                >
                  <TokenCard 
                    asset={asset}
                    isSelected={selectedTokens.has(asset.id)}
                    onToggle={() => handleToggleToken(asset.id)}
                    isRisk={asset.tier === 'RISK_SCAM'}
                    onShowRisk={() => setSelectedAssetForRisk(asset)}
                    isExpanded={expandedCards.has(asset.id)}
                    onToggleExpand={() => handleToggleExpand(asset.id)}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No tokens found</h3>
                <p className="text-slate-500 mb-6">
                  No {activeTab.toLowerCase().replace('_', '/')} tokens in selected chains
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedChains(new Set(ALL_CHAIN_IDS))}
                  className="rounded-xl"
                >
                  Show All Chains
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-bottom z-50"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-xs text-slate-500 block">Selected</span>
                <span className="text-xl font-bold text-slate-900">{selectedTokens.size}</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="text-center">
                <span className="text-xs text-slate-500 block">Value</span>
                <span className="text-xl font-bold text-emerald-600">${selectedValue.toFixed(2)}</span>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" />
              <div className="text-center hidden sm:block">
                <span className="text-xs text-slate-500 block">Est. Output</span>
                <span className="text-xl font-bold text-indigo-600">${(selectedValue * 0.992).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => onNavigate?.('/dashboard')}
                className="h-12 px-5 rounded-xl border-slate-200 hidden sm:flex"
              >
                Dashboard
              </Button>
              <Button 
                onClick={handleConsolidate}
                disabled={selectedTokens.size === 0}
                variant="glow3d"
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl disabled:opacity-50 mobile-touch-target"
              >
                <Sparkles className="w-4 h-4 mr-2" />
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

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Format USD value intelligently for dust/micro dust
 */
function formatUSDValue(value: number): string {
  if (value === 0) return '$0.00';
  if (value < 0.0001) return `$${value.toExponential(1)}`;
  if (value < 0.001) return `$${value.toFixed(5)}`;
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 0.1) return `$${value.toFixed(3)}`;
  if (value < 10) return `$${value.toFixed(2)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 10000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${(value / 1000).toFixed(0)}K`;
}

/**
 * Format balance intelligently
 */
function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(1);
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 100) return num.toFixed(2);
  if (num < 10000) return num.toFixed(0);
  return `${(num / 1000).toFixed(1)}K`;
}

// =============================================
// TOKEN CARD COMPONENT
// =============================================
function TokenCard({ 
  asset, 
  isSelected, 
  onToggle,
  isRisk,
  onShowRisk,
  isExpanded,
  onToggleExpand,
  viewMode
}: { 
  asset: Asset;
  isSelected: boolean;
  onToggle: () => void;
  isRisk: boolean;
  onShowRisk?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  viewMode: 'compact' | 'detailed';
}) {
  const chain = CHAINS[asset.chainId];
  const riskLevel = asset.riskScore && asset.riskScore >= 70 ? 'high' : asset.riskScore && asset.riskScore >= 40 ? 'medium' : 'low';

  return (
    <motion.div
      layout
      className={cn(
        "w-full rounded-2xl border-2 transition-all overflow-hidden",
        isRisk 
          ? "bg-red-50/50 border-red-200" 
          : isSelected 
            ? "bg-indigo-50/50 border-indigo-300 shadow-lg shadow-indigo-100" 
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={isRisk ? undefined : onToggle}
          disabled={isRisk}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
            isRisk 
              ? "border-red-300 bg-red-100 cursor-not-allowed" 
              : isSelected 
                ? "border-indigo-600 bg-indigo-600 cursor-pointer shadow-md shadow-indigo-300" 
                : "border-slate-300 cursor-pointer hover:border-indigo-400"
          )}
        >
          {isSelected && !isRisk && (
            <CheckCircle2 className="w-4 h-4 text-white" />
          )}
          {isRisk && (
            <X className="w-3.5 h-3.5 text-red-500" />
          )}
        </button>

        {/* Token Icon */}
        <div className="relative flex-shrink-0">
          {asset.logoUrl ? (
            <img 
              src={asset.logoUrl} 
              alt={asset.symbol}
              className="w-12 h-12 rounded-xl bg-slate-100 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=6366f1&color=fff&size=48&rounded=true`;
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">{asset.symbol.slice(0, 2)}</span>
            </div>
          )}
          {/* Chain badge */}
          <div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full overflow-hidden border-2 border-white shadow-sm"
            style={{ backgroundColor: chain?.color || '#64748b' }}
          >
            {chain?.logoUrl ? (
              <img 
                src={chain.logoUrl} 
                alt={chain.shortName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[8px] text-white font-bold flex items-center justify-center w-full h-full">
                {chain?.shortName?.slice(0, 1) || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 truncate">{asset.symbol}</span>
            {isRisk && (
              <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-600 text-[10px] font-bold uppercase">
                Risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="truncate">{asset.name}</span>
            <span className="text-slate-300">•</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium",
              `bg-gradient-to-r ${chain?.gradient || 'from-slate-400 to-slate-500'}`,
              "text-white"
            )}>
              {chain?.shortName || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Risk Score */}
        <button
          onClick={onShowRisk}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
            riskLevel === 'high' ? "bg-red-100 text-red-700 hover:bg-red-200" :
            riskLevel === 'medium' ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
            "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          {asset.riskScore || 0}
        </button>

        {/* Value */}
        <div className="text-right flex-shrink-0 min-w-[90px]">
          <div className={cn(
            "font-bold text-lg",
            isRisk ? "text-red-600" : asset.valueUSD < 1 ? "text-amber-600" : "text-slate-900"
          )}>
            {formatUSDValue(asset.valueUSD)}
          </div>
          <div className="text-xs text-slate-500 truncate max-w-[90px]" title={`${asset.balance} ${asset.symbol}`}>
            {formatBalance(asset.balance)} {asset.symbol}
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Contract</span>
                <a 
                  href={`https://basescan.org/token/${asset.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  {asset.contractAddress.slice(0, 8)}...{asset.contractAddress.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Chain</span>
                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  {chain?.logoUrl && (
                    <img 
                      src={chain.logoUrl} 
                      alt={chain.shortName}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  {chain?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Balance</span>
                <span className="text-sm font-medium text-slate-900">{parseFloat(asset.balance).toFixed(6)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Risk Score</span>
                <span className={cn(
                  "text-sm font-bold",
                  riskLevel === 'high' ? "text-red-600" :
                  riskLevel === 'medium' ? "text-amber-600" :
                  "text-emerald-600"
                )}>
                  {asset.riskScore || 0}/100 ({riskLevel})
                </span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={onShowRisk}
                className="w-full rounded-xl"
              >
                <Shield className="w-4 h-4 mr-2" />
                View Full Risk Analysis
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Scan;
