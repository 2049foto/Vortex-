/**
 * Vortex Protocol - Grant Metrics Dashboard (Public)
 * For Base Grant application screenshots
 */

'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsDashboard } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function GrantMetricsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const result = await getAnalyticsDashboard();
      setData(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // Default data if API returns empty
  const overview = data?.overview || {
    totalPortfoliosClean: 0,
    dustValueCleaned: '0',
    baseTvlAdded: '0',
    gasSaved: '0',
    totalConsolidations: 0,
    uniqueUsers: 0,
  };

  const metrics = [
    {
      label: 'Portfolios Cleaned',
      value: overview.totalPortfoliosClean?.toLocaleString() || '0',
      icon: BarChart3,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Total successful consolidations',
    },
    {
      label: 'Dust Value Cleaned',
      value: `$${parseFloat(overview.dustValueCleaned || '0').toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Total value consolidated',
    },
    {
      label: 'Base TVL Added',
      value: `$${parseFloat(overview.baseTvlAdded || '0').toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Value moved to Base chain',
    },
    {
      label: 'Gas Saved',
      value: `$${parseFloat(overview.gasSaved || '0').toLocaleString()}`,
      icon: Zap,
      gradient: 'from-amber-500 to-amber-600',
      description: 'Via gasless transactions',
    },
    {
      label: 'Total Consolidations',
      value: overview.totalConsolidations?.toLocaleString() || '0',
      icon: RefreshCw,
      gradient: 'from-pink-500 to-pink-600',
      description: 'Including pending',
    },
    {
      label: 'Unique Users',
      value: overview.uniqueUsers?.toLocaleString() || '0',
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-600',
      description: 'Total users served',
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-2 text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Grant Metrics Dashboard
          </h1>
          <p className="text-lg text-slate-600">Real-time impact metrics for Base ecosystem</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            <span className="text-slate-300">•</span>
            <span>Auto-refreshes every 30s</span>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="py-4 text-center">
              <p className="text-amber-600 text-sm">
                {error} - Showing placeholder data
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-gradient-to-br ${metric.gradient} text-white shadow-xl overflow-hidden relative`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="py-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-sm font-medium opacity-90">{metric.label}</div>
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold mb-2">{metric.value}</div>
                    <div className="text-sm opacity-80">{metric.description}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Impact Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <CardContent className="py-10 relative">
              <h3 className="text-2xl font-bold mb-6 text-center">Impact on Base Ecosystem</h3>
              <div className="grid gap-8 md:grid-cols-3 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">{overview.totalPortfoliosClean || 0}</div>
                  <div className="text-sm opacity-90">Portfolios optimized</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">${parseFloat(overview.baseTvlAdded || '0').toLocaleString()}</div>
                  <div className="text-sm opacity-90">TVL migrated to Base</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">{overview.uniqueUsers || 0}</div>
                  <div className="text-sm opacity-90">Users onboarded</div>
                </div>
              </div>
              <div className="border-t border-white/20 pt-6 text-center">
                <p className="text-sm opacity-90 max-w-2xl mx-auto">
                  Vortex Protocol is driving portfolio hygiene and TVL growth on Base through gasless consolidation,
                  multi-router optimization, and premium 20-layer risk scoring.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-sm text-slate-500"
        >
          <p>Data updated in real-time • Powered by Vortex Protocol</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a 
              href="/" 
              className="flex items-center gap-1 text-indigo-600 hover:underline"
            >
              vortex.build
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">|</span>
            <a 
              href="https://base.org" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 hover:underline"
            >
              Built on Base
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

