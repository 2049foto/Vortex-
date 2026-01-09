'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Dashboard 2026
 * Portfolio overview, analytics, and activity tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  DollarSign,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PortfolioSummary {
  totalValue: number;
  totalTokens: number;
  dustValue: number;
  dustTokens: number;
  riskTokens: number;
  change24h: number;
  chainsUsed: number;
}

interface ConsolidationHistory {
  id: string;
  date: Date;
  tokensConsolidated: number;
  inputValue: number;
  outputValue: number;
  gasSaved: number;
  txHash: string;
  status: 'success' | 'pending' | 'failed';
}

interface ChainBreakdown {
  chainId: number;
  name: string;
  icon: string;
  color: string;
  tokenCount: number;
  value: number;
  percent: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_SUMMARY: PortfolioSummary = {
  totalValue: 2847.32,
  totalTokens: 47,
  dustValue: 124.56,
  dustTokens: 31,
  riskTokens: 3,
  change24h: 2.4,
  chainsUsed: 6,
};

const MOCK_HISTORY: ConsolidationHistory[] = [
  {
    id: '1',
    date: new Date('2026-01-08'),
    tokensConsolidated: 12,
    inputValue: 45.67,
    outputValue: 44.12,
    gasSaved: 12.34,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    status: 'success',
  },
  {
    id: '2',
    date: new Date('2026-01-05'),
    tokensConsolidated: 8,
    inputValue: 23.45,
    outputValue: 22.89,
    gasSaved: 8.90,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    status: 'success',
  },
];

const CHAIN_BREAKDOWN: ChainBreakdown[] = [
  { chainId: 1, name: 'Ethereum', icon: '⟠', color: '#627EEA', tokenCount: 15, value: 1234.56, percent: 43 },
  { chainId: 8453, name: 'Base', icon: '🔵', color: '#0052FF', tokenCount: 12, value: 856.23, percent: 30 },
  { chainId: 42161, name: 'Arbitrum', icon: '🔷', color: '#28A0F0', tokenCount: 8, value: 456.12, percent: 16 },
  { chainId: 137, name: 'Polygon', icon: '💜', color: '#8247E5', tokenCount: 7, value: 189.45, percent: 7 },
  { chainId: 10, name: 'Optimism', icon: '🔴', color: '#FF0420', tokenCount: 5, value: 110.96, percent: 4 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary'
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary-muted text-primary',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
    accent: 'bg-accent-muted text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-foreground-muted">{title}</div>
      {subtitle && (
        <div className="text-xs text-foreground-muted mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
}

function ChainDistribution({ breakdown }: { breakdown: ChainBreakdown[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Chain Distribution
        </h3>
      </div>

      <div className="space-y-3">
        {breakdown.map((chain, i) => (
          <motion.div
            key={chain.chainId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: `${chain.color}20` }}
            >
              {chain.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{chain.name}</span>
                <span className="text-sm text-foreground-muted">{chain.tokenCount} tokens</span>
              </div>
              <div className="h-2 bg-card-hover rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${chain.percent}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: chain.color }}
                />
              </div>
            </div>
            <div className="text-sm font-medium w-20 text-right">
              ${chain.value.toFixed(0)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { 
      title: 'Scan Wallet', 
      desc: 'Find dust tokens', 
      icon: Search, 
      href: '/scan',
      color: 'primary' 
    },
    { 
      title: 'View History', 
      desc: 'Past consolidations', 
      icon: Clock, 
      href: '/history',
      color: 'accent' 
    },
  ];

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        Quick Actions
      </h3>

      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-card-hover hover:bg-primary-muted transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl bg-${action.color}-muted flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${action.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-foreground-muted">{action.desc}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-muted group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ConsolidationHistoryList({ history }: { history: ConsolidationHistory[] }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <Link href="/history" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <div className="text-foreground-muted">No consolidations yet</div>
          <Link href="/scan" className="btn btn-primary btn-sm mt-4">
            <Search className="w-4 h-4" />
            Start Scanning
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 5).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card-hover"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.status === 'success' ? 'bg-success-bg' :
                item.status === 'pending' ? 'bg-warning-bg' : 'bg-danger-bg'
              }`}>
                {item.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : item.status === 'pending' ? (
                  <Clock className="w-5 h-5 text-warning" />
                ) : (
                  <XCircle className="w-5 h-5 text-danger" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {item.tokensConsolidated} tokens → ETH
                </div>
                <div className="text-sm text-foreground-muted">
                  {formatDate(item.date)}
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium text-success">
                  +${item.outputValue.toFixed(2)}
                </div>
                <div className="text-xs text-foreground-muted">
                  ${item.gasSaved.toFixed(2)} saved
                </div>
              </div>

              <a
                href={`https://basescan.org/tx/${item.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-icon"
                style={{ minHeight: 36, width: 36 }}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function DustOpportunityCard({ summary }: { summary: PortfolioSummary }) {
  if (summary.dustTokens === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card card-glow p-6 bg-gradient-to-br from-primary-muted to-card"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            Consolidation Opportunity
          </h3>
          <p className="text-foreground-secondary mb-4">
            You have <strong className="text-foreground">{summary.dustTokens}</strong> dust tokens worth{' '}
            <strong className="text-foreground">${summary.dustValue.toFixed(2)}</strong>. 
            Consolidate them into ETH, gasless on Base.
          </p>
          <Link href="/scan" className="btn btn-primary btn-shimmer">
            <Search className="w-4 h-4" />
            Scan & Consolidate
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
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
        Connect your wallet to view your portfolio dashboard, or scan any address without connecting.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button className="btn btn-primary">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
        <Link href="/scan" className="btn btn-secondary">
          <Search className="w-4 h-4" />
          Scan Address
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardClient() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<ConsolidationHistory[]>([]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSummary(MOCK_SUMMARY);
      setHistory(MOCK_HISTORY);
      setIsLoading(false);
    };

    if (isConnected && address) {
      loadDashboard();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="page safe-top">
        <div className="container py-12">
          <WalletNotConnected />
        </div>
      </div>
    );
  }

  // Loading state
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
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-foreground-secondary">
              {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          </div>
          <button className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Dust Opportunity */}
        {summary && <DustOpportunityCard summary={summary} />}

        {/* Stats Grid */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Value"
              value={`$${summary.totalValue.toFixed(2)}`}
              icon={DollarSign}
              trend={summary.change24h}
              color="primary"
            />
            <StatCard
              title="Total Tokens"
              value={summary.totalTokens}
              subtitle={`${summary.chainsUsed} chains`}
              icon={Layers}
              color="accent"
            />
            <StatCard
              title="Dust Value"
              value={`$${summary.dustValue.toFixed(2)}`}
              subtitle={`${summary.dustTokens} tokens`}
              icon={Sparkles}
              color="warning"
            />
            <StatCard
              title="Risk Tokens"
              value={summary.riskTokens}
              icon={AlertTriangle}
              color={summary.riskTokens > 0 ? 'danger' : 'success'}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ChainDistribution breakdown={CHAIN_BREAKDOWN} />
            <ConsolidationHistoryList history={history} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Security Status */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                Security Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span>Wallet scanned recently</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span>No high-risk approvals</span>
                </div>
                {summary && summary.riskTokens > 0 && (
                  <div className="flex items-center gap-3 text-sm text-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{summary.riskTokens} risky tokens detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
