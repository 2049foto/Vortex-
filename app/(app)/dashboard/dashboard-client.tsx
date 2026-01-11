'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Dashboard 2026
 * Real-time portfolio analytics with live API data
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Zap, 
  History,
  Search,
  Shield,
  Clock,
  RefreshCw,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardStats {
  totalValue: number;
  dustValue: number;
  tokensHeld: number;
  dustRecovered: number;
  consolidations: number;
  gasSaved: number;
}

interface RecentActivity {
  id: string;
  type: 'scan' | 'consolidate';
  description: string;
  timestamp: Date;
  chain: string;
  status: 'success' | 'pending' | 'failed';
  txHash?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchDashboardData(address: string): Promise<{
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}> {
  try {
    // Fetch user stats from API
    const [analyticsRes, historyRes] = await Promise.all([
      fetch('/api/v1/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      }),
      fetch('/api/v1/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, limit: 5 }),
      }),
    ]);

    let stats: DashboardStats = {
      totalValue: 0,
      dustValue: 0,
      tokensHeld: 0,
      dustRecovered: 0,
      consolidations: 0,
      gasSaved: 0,
    };

    let recentActivity: RecentActivity[] = [];

    if (analyticsRes.ok) {
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success && analyticsData.data) {
        stats = {
          totalValue: analyticsData.data.totalValue || 0,
          dustValue: analyticsData.data.dustValue || 0,
          tokensHeld: analyticsData.data.tokensHeld || 0,
          dustRecovered: analyticsData.data.dustRecovered || 0,
          consolidations: analyticsData.data.consolidations || 0,
          gasSaved: analyticsData.data.gasSaved || 0,
        };
      }
    }

    if (historyRes.ok) {
      const historyData = await historyRes.json();
      if (historyData.success && historyData.data?.history) {
        recentActivity = historyData.data.history.slice(0, 5).map((h: any) => ({
          id: h.id,
          type: h.type || 'consolidate',
          description: h.description || `${h.tokensConsolidated} tokens consolidated`,
          timestamp: new Date(h.timestamp || h.date),
          chain: h.chain || 'Base',
          status: h.status || 'success',
          txHash: h.txHash,
        }));
      }
    }

    return { stats, recentActivity };
  } catch (error) {
    console.error('[Dashboard] Failed to fetch data:', error);
    return {
      stats: {
        totalValue: 0,
        dustValue: 0,
        tokensHeld: 0,
        dustRecovered: 0,
        consolidations: 0,
        gasSaved: 0,
      },
      recentActivity: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color = 'accent',
  delay = 0 
}: { 
  icon: any; 
  value: string | number; 
  label: string; 
  color?: 'accent' | 'success' | 'warning';
  delay?: number;
}) {
  const colorMap = {
    accent: { bg: 'hsl(var(--accent-light))', text: 'hsl(var(--accent))' },
    success: { bg: 'hsl(var(--success-light))', text: 'hsl(var(--success))' },
    warning: { bg: 'hsl(var(--warning-light))', text: 'hsl(var(--warning))' },
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-4"
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: colorMap[color].bg }}
      >
        <Icon className="w-5 h-5" style={{ color: colorMap[color].text }} />
      </div>
      <div className="text-xl font-bold mb-0.5" style={{ color: colorMap[color].text }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
        {label}
      </div>
    </motion.div>
  );
}

function ActivityCard({ activity, index }: { activity: RecentActivity; index: number }) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: 'hsl(var(--bg-secondary))' }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ 
          background: activity.type === 'consolidate' 
            ? 'hsl(var(--success-light))' 
            : 'hsl(var(--accent-light))' 
        }}
      >
        {activity.type === 'consolidate' ? (
          <TrendingUp className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
        ) : (
          <Search className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {activity.type === 'consolidate' ? 'Consolidation' : 'Wallet Scan'}
        </div>
        <div className="text-xs truncate" style={{ color: 'hsl(var(--text-tertiary))' }}>
          {activity.description} · {activity.chain}
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {activity.status === 'success' && (
          <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
        )}
        {activity.status === 'pending' && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--warning))' }} />
        )}
        {activity.status === 'failed' && (
          <AlertCircle className="w-4 h-4" style={{ color: 'hsl(var(--danger))' }} />
        )}
        <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
          {formatTime(activity.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  color = 'accent',
  delay = 0 
}: { 
  href: string; 
  icon: any; 
  title: string; 
  description: string;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link 
        href={href} 
        className="card p-4 flex items-center gap-3 hover:shadow-md transition-all"
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--accent-light))' }}
        >
          <Icon className="w-6 h-6" style={{ color: 'hsl(var(--accent))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {description}
          </div>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'hsl(var(--text-tertiary))' }} />
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
          <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-secondary))' }}>
            Connect your wallet to view your portfolio analytics and consolidation history.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardClient() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (!address) return;
    
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const { stats: newStats, recentActivity: newActivity } = await fetchDashboardData(address);
      setStats(newStats);
      setRecentActivity(newActivity);
    } catch (error) {
      console.error('[Dashboard] Load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address, loadData]);

  if (!isConnected) {
    return <WalletNotConnected />;
  }

  if (isLoading) {
    return (
      <div className="page safe-top">
        <div className="container py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--accent))' }} />
            <p style={{ color: 'hsl(var(--text-tertiary))' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page safe-top">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Dashboard</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button 
            className="btn btn-ghost btn-icon"
            onClick={() => loadData(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={Wallet} 
            value={`$${stats?.totalValue.toLocaleString() || '0'}`}
            label="Total Portfolio"
            color="accent"
            delay={0.05}
          />
          <StatCard 
            icon={TrendingUp} 
            value={`$${stats?.dustRecovered.toFixed(2) || '0'}`}
            label="Dust Recovered"
            color="success"
            delay={0.1}
          />
          <StatCard 
            icon={Zap} 
            value={`$${stats?.gasSaved.toFixed(2) || '0'}`}
            label="Gas Saved"
            color="warning"
            delay={0.15}
          />
          <StatCard 
            icon={History} 
            value={stats?.consolidations || 0}
            label="Consolidations"
            color="accent"
            delay={0.2}
          />
        </div>

        {/* Dust Alert */}
        {stats && stats.dustValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-4"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--accent-light)) 0%, hsl(var(--bg-elevated)) 100%)',
              border: '1px solid hsl(var(--accent) / 0.2)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold mb-0.5">
                  ${stats.dustValue.toFixed(2)} in dust detected
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
                  Clean up {stats.tokensHeld} small tokens
                </div>
              </div>
              <Link href="/scan" className="btn btn-primary btn-sm">
                Scan Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <QuickActionCard
              href="/scan"
              icon={Search}
              title="New Scan"
              description="Find dust tokens across chains"
              delay={0.35}
            />
            <QuickActionCard
              href="/history"
              icon={History}
              title="History"
              description="View past consolidations"
              delay={0.4}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            {recentActivity.length > 0 && (
              <Link 
                href="/history" 
                className="text-xs font-medium"
                style={{ color: 'hsl(var(--accent))' }}
              >
                View all
              </Link>
            )}
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, i) => (
                <ActivityCard key={activity.id} activity={activity} index={i} />
              ))}
            </div>
          ) : (
            <div 
              className="card p-8 text-center"
              style={{ background: 'hsl(var(--bg-secondary))' }}
            >
              <Clock 
                className="w-10 h-10 mx-auto mb-3" 
                style={{ color: 'hsl(var(--text-tertiary))' }} 
              />
              <p className="text-sm font-medium mb-1">No activity yet</p>
              <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                Start by scanning your wallet to find dust tokens
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
