'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - History Page 2026
 * Real consolidation history with live API data
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Download,
  TrendingUp,
  ArrowRight,
  Wallet,
  Calendar,
  Layers,
  DollarSign,
  Zap,
  Loader2,
  RefreshCw,
  ChevronDown,
  Filter
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ConsolidationRecord {
  id: string;
  date: Date;
  walletAddress: string;
  tokensConsolidated: number;
  inputValue: number;
  outputValue: number;
  outputToken: 'ETH' | 'USDC';
  gasSaved: number;
  txHash: string;
  status: 'success' | 'pending' | 'failed';
  chainId: number;
}

interface HistoryStats {
  totalConsolidations: number;
  totalTokens: number;
  totalValue: number;
  totalGasSaved: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAINS: Record<number, { name: string; icon: string; color: string }> = {
  8453: { name: 'Base', icon: '🔵', color: '#0052FF' },
  1: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  42161: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
  10: { name: 'Optimism', icon: '🔴', color: '#FF0420' },
  137: { name: 'Polygon', icon: '💜', color: '#8247E5' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchHistory(address: string): Promise<ConsolidationRecord[]> {
  try {
    const response = await fetch('/api/v1/user/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });

    if (!response.ok) {
      console.error('[History] API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.history) {
      return [];
    }

    return data.data.history.map((h: any) => ({
      id: h.id,
      date: new Date(h.timestamp || h.date),
      walletAddress: h.walletAddress || address,
      tokensConsolidated: h.tokensConsolidated || 0,
      inputValue: h.inputValue || 0,
      outputValue: h.outputValue || 0,
      outputToken: h.outputToken || 'ETH',
      gasSaved: h.gasSaved || 0,
      txHash: h.txHash || '',
      status: h.status || 'success',
      chainId: h.chainId || 8453,
    }));
  } catch (error) {
    console.error('[History] Fetch error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatsOverview({ history }: { history: ConsolidationRecord[] }) {
  const stats = useMemo<HistoryStats>(() => {
    const successful = history.filter(h => h.status === 'success');
    return {
      totalConsolidations: successful.length,
      totalTokens: successful.reduce((sum, h) => sum + h.tokensConsolidated, 0),
      totalValue: successful.reduce((sum, h) => sum + h.outputValue, 0),
      totalGasSaved: successful.reduce((sum, h) => sum + h.gasSaved, 0),
    };
  }, [history]);

  const statItems = [
    { label: 'Consolidations', value: stats.totalConsolidations, icon: Layers, color: 'accent' },
    { label: 'Tokens', value: stats.totalTokens, icon: TrendingUp, color: 'success' },
    { label: 'Recovered', value: `$${stats.totalValue.toFixed(0)}`, icon: DollarSign, color: 'warning' },
    { label: 'Gas Saved', value: `$${stats.totalGasSaved.toFixed(0)}`, icon: Zap, color: 'accent' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {statItems.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-3 text-center"
          >
            <div 
              className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
              style={{ background: `hsl(var(--${stat.color}-light))` }}
            >
              <Icon className="w-4 h-4" style={{ color: `hsl(var(--${stat.color}))` }} />
            </div>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HistoryCard({ record, index }: { record: ConsolidationRecord; index: number }) {
  const chain = CHAINS[record.chainId] || { name: 'Unknown', icon: '?', color: '#888' };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getExplorerUrl = (chainId: number, txHash: string) => {
    const explorers: Record<number, string> = {
      8453: 'https://basescan.org/tx/',
      1: 'https://etherscan.io/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
    };
    return `${explorers[chainId] || 'https://basescan.org/tx/'}${txHash}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="card p-4"
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ 
            background: record.status === 'success' 
              ? 'hsl(var(--success-light))' 
              : record.status === 'pending'
              ? 'hsl(var(--warning-light))'
              : 'hsl(var(--danger-light))'
          }}
        >
          {record.status === 'success' ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
          ) : record.status === 'pending' ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--warning))' }} />
          ) : (
            <XCircle className="w-5 h-5" style={{ color: 'hsl(var(--danger))' }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {record.tokensConsolidated} tokens → {record.outputToken}
            </span>
            <span 
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${chain.color}15`, 
                color: chain.color 
              }}
            >
              {chain.icon} {chain.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(record.date)}</span>
          </div>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <div className="font-semibold text-sm" style={{ color: 'hsl(var(--success))' }}>
            +${record.outputValue.toFixed(2)}
          </div>
          {record.gasSaved > 0 && (
            <div className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              ${record.gasSaved.toFixed(2)} saved
            </div>
          )}
        </div>

        {/* Explorer Link */}
        {record.txHash && (
          <a
            href={getExplorerUrl(record.chainId, record.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-colors shrink-0"
            style={{ background: 'hsl(var(--bg-tertiary))' }}
          >
            <ExternalLink className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function EmptyHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-8 text-center"
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'hsl(var(--bg-tertiary))' }}
      >
        <Clock className="w-8 h-8" style={{ color: 'hsl(var(--text-tertiary))' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
      <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-secondary))' }}>
        Start consolidating dust tokens to see your history here
      </p>
      <Link href="/scan" className="btn btn-primary">
        <Search className="w-4 h-4" />
        Scan Wallet
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

function WalletNotConnected() {
  return (
    <div className="page safe-top">
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center max-w-sm mx-auto"
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'hsl(var(--accent-light))' }}
          >
            <Wallet className="w-8 h-8" style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
            Connect your wallet to view your consolidation history
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HistoryClient() {
  const { address, isConnected } = useAccount();
  const [history, setHistory] = useState<ConsolidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const loadHistory = useCallback(async (showLoading = true) => {
    if (!address) return;
    
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await fetchHistory(address);
      setHistory(data);
    } catch (error) {
      console.error('[History] Load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadHistory();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address, loadHistory]);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(h => h.status === filter);
  }, [history, filter]);

  if (!isConnected) {
    return <WalletNotConnected />;
  }

  if (isLoading) {
    return (
      <div className="page safe-top">
        <div className="container py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--accent))' }} />
            <p style={{ color: 'hsl(var(--text-tertiary))' }}>Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page safe-top">
      <div className="container py-6 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold mb-0.5">History</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Your consolidation activity
            </p>
          </div>
          <button 
            className="btn btn-ghost btn-icon"
            onClick={() => loadHistory(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {history.length === 0 ? (
          <EmptyHistory />
        ) : (
          <>
            {/* Stats */}
            <StatsOverview history={history} />

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    filter === f 
                      ? 'bg-[hsl(var(--accent))] text-white' 
                      : 'bg-[hsl(var(--bg-tertiary))]'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </motion.div>

            {/* History List */}
            <div className="space-y-2 pb-20">
              <AnimatePresence>
                {filteredHistory.map((record, i) => (
                  <HistoryCard key={record.id} record={record} index={i} />
                ))}
              </AnimatePresence>

              {filteredHistory.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                  style={{ color: 'hsl(var(--text-tertiary))' }}
                >
                  No {filter} transactions found
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
