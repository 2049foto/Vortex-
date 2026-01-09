'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - History Page 2026
 * Consolidation history with detailed transaction tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Download,
  TrendingUp,
  ArrowRight,
  Wallet,
  Calendar,
  Layers,
  DollarSign,
  Zap
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

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_HISTORY: ConsolidationRecord[] = [
  {
    id: '1',
    date: new Date('2026-01-09T10:30:00'),
    walletAddress: '0x1234...abcd',
    tokensConsolidated: 15,
    inputValue: 78.45,
    outputValue: 76.23,
    outputToken: 'ETH',
    gasSaved: 18.50,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    status: 'success',
    chainId: 8453,
  },
  {
    id: '2',
    date: new Date('2026-01-08T15:20:00'),
    walletAddress: '0x1234...abcd',
    tokensConsolidated: 8,
    inputValue: 34.20,
    outputValue: 33.15,
    outputToken: 'ETH',
    gasSaved: 9.20,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    status: 'success',
    chainId: 8453,
  },
  {
    id: '3',
    date: new Date('2026-01-05T09:15:00'),
    walletAddress: '0x1234...abcd',
    tokensConsolidated: 22,
    inputValue: 125.80,
    outputValue: 122.50,
    outputToken: 'USDC',
    gasSaved: 28.90,
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    status: 'success',
    chainId: 8453,
  },
];

const CHAINS: Record<number, { name: string; icon: string; color: string }> = {
  8453: { name: 'Base', icon: '🔵', color: '#0052FF' },
  1: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  42161: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatsOverview({ history }: { history: ConsolidationRecord[] }) {
  const stats = useMemo(() => {
    const successful = history.filter(h => h.status === 'success');
    return {
      totalConsolidations: successful.length,
      totalTokens: successful.reduce((sum, h) => sum + h.tokensConsolidated, 0),
      totalValue: successful.reduce((sum, h) => sum + h.outputValue, 0),
      totalGasSaved: successful.reduce((sum, h) => sum + h.gasSaved, 0),
    };
  }, [history]);

  const statItems = [
    { label: 'Consolidations', value: stats.totalConsolidations, icon: Layers },
    { label: 'Tokens Cleaned', value: stats.totalTokens, icon: TrendingUp },
    { label: 'Value Recovered', value: `$${stats.totalValue.toFixed(2)}`, icon: DollarSign },
    { label: 'Gas Saved', value: `$${stats.totalGasSaved.toFixed(2)}`, icon: Zap },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-foreground-muted">{stat.label}</div>
              </div>
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-4 hover:bg-card-hover transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          record.status === 'success' ? 'bg-success-bg' :
          record.status === 'pending' ? 'bg-warning-bg' : 'bg-danger-bg'
        }`}>
          {record.status === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : record.status === 'pending' ? (
            <Clock className="w-6 h-6 text-warning" />
          ) : (
            <XCircle className="w-6 h-6 text-danger" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">
              {record.tokensConsolidated} tokens → {record.outputToken}
            </span>
            <span 
              className="badge badge-chain"
              style={{ backgroundColor: `${chain.color}20`, color: chain.color }}
            >
              {chain.icon} {chain.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-foreground-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(record.date)}
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="text-right">
          <div className="font-semibold text-success">+${record.outputValue.toFixed(2)}</div>
          <div className="text-xs text-foreground-muted">
            ${record.gasSaved.toFixed(2)} gas saved
          </div>
        </div>

        {/* Action */}
        <a
          href={`https://basescan.org/tx/${record.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-icon"
          style={{ minHeight: 40, width: 40 }}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

function EmptyHistory() {
  return (
    <div className="card p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-card-hover flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-foreground-muted" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
      <p className="text-foreground-secondary mb-6 max-w-sm mx-auto">
        Start consolidating your dust tokens to see your history here
      </p>
      <Link href="/scan" className="btn btn-primary">
        <Search className="w-4 h-4" />
        Scan Wallet
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function WalletNotConnected() {
  return (
    <div className="card p-8 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-6">
        <Wallet className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
      <p className="text-foreground-secondary mb-6">
        Connect your wallet to view your consolidation history
      </p>
      <button className="btn btn-primary">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
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
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setHistory(MOCK_HISTORY);
      setIsLoading(false);
    };

    if (isConnected) {
      loadHistory();
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(h => h.status === filter);
  }, [history, filter]);

  // Not connected
  if (!isConnected) {
    return (
      <div className="page safe-top">
        <div className="container py-12">
          <WalletNotConnected />
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="page safe-top">
        <div className="container py-8">
          <div className="flex items-center justify-center py-20">
            <div className="vortex-spinner w-16 h-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page safe-top">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">History</h1>
            <p className="text-foreground-secondary">
              Your consolidation activity
            </p>
          </div>
          {history.length > 0 && (
            <button className="btn btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyHistory />
        ) : (
          <>
            {/* Stats */}
            <StatsOverview history={history} />

            {/* Filters */}
            <div className="tabs w-fit">
              {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`tab ${filter === f ? 'active' : ''}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* History List */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredHistory.map((record, i) => (
                  <HistoryCard key={record.id} record={record} index={i} />
                ))}
              </AnimatePresence>

              {filteredHistory.length === 0 && (
                <div className="text-center py-12 text-foreground-muted">
                  No transactions match this filter
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
