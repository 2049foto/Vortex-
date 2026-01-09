'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Zap, 
  History,
  ArrowUpRight,
  Search,
  Shield,
  Clock
} from 'lucide-react';

// Stats data (mock - replace with real API)
const MOCK_STATS = {
  totalValue: 2847.52,
  dustRecovered: 156.78,
  scansCompleted: 12,
  gasSaved: 45.20,
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'scan', description: '8 tokens found', time: '2h ago', chain: 'Base' },
  { id: 2, type: 'consolidate', description: '$45.20 recovered', time: '1d ago', chain: 'Ethereum' },
  { id: 3, type: 'scan', description: '3 tokens found', time: '3d ago', chain: 'Arbitrum' },
];

export default function DashboardClient() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState(MOCK_STATS);

  // In production, fetch real stats from API
  useEffect(() => {
    if (isConnected && address) {
      // TODO: Fetch user stats
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '60px' }}>
          <div className="empty-state">
            <Wallet className="empty-state-icon" />
            <h3 className="empty-state-title">Connect Wallet</h3>
            <p className="empty-state-description">
              Connect your wallet to view your dashboard and portfolio analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '24px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="card stat-card">
            <div 
              className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
              style={{ background: 'hsl(var(--accent-light))' }}
            >
              <Wallet className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div className="stat-value">${stats.totalValue.toLocaleString()}</div>
            <div className="stat-label">Total Portfolio</div>
          </div>
          
          <div className="card stat-card">
            <div 
              className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
              style={{ background: 'hsl(var(--success-light))' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
            </div>
            <div className="stat-value" style={{ color: 'hsl(var(--success))' }}>
              ${stats.dustRecovered.toFixed(2)}
            </div>
            <div className="stat-label">Dust Recovered</div>
          </div>
          
          <div className="card stat-card">
            <div 
              className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
              style={{ background: 'hsl(var(--warning-light))' }}
            >
              <Zap className="w-5 h-5" style={{ color: 'hsl(var(--warning))' }} />
            </div>
            <div className="stat-value">${stats.gasSaved.toFixed(2)}</div>
            <div className="stat-label">Gas Saved</div>
          </div>
          
          <div className="card stat-card">
            <div 
              className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
              style={{ background: 'hsl(var(--bg-tertiary))' }}
            >
              <Search className="w-5 h-5" style={{ color: 'hsl(var(--text-secondary))' }} />
            </div>
            <div className="stat-value">{stats.scansCompleted}</div>
            <div className="stat-label">Scans Completed</div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="section-header">
            <h3 className="section-title">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/scan" className="card card-interactive flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--accent-light))' }}
              >
                <Search className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">New Scan</h4>
                <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Find dust tokens
                </p>
              </div>
            </Link>
            
            <Link href="/history" className="card card-interactive flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--bg-tertiary))' }}
              >
                <History className="w-5 h-5" style={{ color: 'hsl(var(--text-secondary))' }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">History</h4>
                <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  View past activity
                </p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="section-header">
            <h3 className="section-title">Recent Activity</h3>
            <Link href="/history" className="section-action">View all</Link>
          </div>
          
          {RECENT_ACTIVITY.length > 0 ? (
            <div className="space-y-2">
              {RECENT_ACTIVITY.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="card flex items-center gap-3"
                  style={{ padding: '12px 16px' }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
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
                  
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">
                      {activity.type === 'consolidate' ? 'Consolidation' : 'Scan'}
                    </h4>
                    <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {activity.description} · {activity.chain}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <History className="empty-state-icon" style={{ width: 48, height: 48 }} />
              <p className="empty-state-title">No recent activity</p>
              <p className="empty-state-description">
                Start by scanning your wallet to find dust tokens.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
