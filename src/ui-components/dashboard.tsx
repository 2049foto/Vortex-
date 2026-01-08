/**
 * Dashboard Component for VORTEX PROTOCOL
 * User stats, XP progress, activity history - Light Mode
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, Clock, Flame, Award, ArrowRight, ExternalLink,
  CheckCircle, RefreshCw, Gift, ChevronRight, BarChart3, Scan, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Default stats when no history
const DEFAULT_STATS = {
  xp: 0,
  level: 1,
  dustFoundUSD: 0,
  baseTVLAdded: 0,
  portfoliosCleaned: 0,
  streak: 0,
};

interface DashboardProps {
  address?: string;
  history?: any;
  isLoading?: boolean;
  error?: string | null;
  onNavigate?: (path: string) => void;
}

// Helper function to format time distance
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function Dashboard({ address, history, isLoading, error, onNavigate }: DashboardProps) {
  const stats = history?.stats || DEFAULT_STATS;
  const activities = history?.activities || [];

  // XP progress calculation
  const xpForNextLevel = stats.level * 250;
  const xpProgress = (stats.xp % xpForNextLevel) / xpForNextLevel * 100;
  const xpNeeded = xpForNextLevel - (stats.xp % xpForNextLevel);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600"></div>
          <span className="text-sm text-slate-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back{address ? `, ${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </p>
        </div>
        <Button
          onClick={() => onNavigate?.('/scan')}
          className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium"
        >
          <Scan className="w-4 h-4 mr-2" />
          New Scan
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard 
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
          label="Dust Found"
          value={`$${(stats.dustFoundUSD || 0).toFixed(2)}`}
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
          label="TVL Added"
          value={`$${(stats.baseTVLAdded || 0).toFixed(2)}`}
        />
        <StatCard 
          icon={<RefreshCw className="w-5 h-5" />}
          iconBg="bg-indigo-100 text-indigo-600"
          label="Portfolios Cleaned"
          value={(stats.portfoliosCleaned || 0).toString()}
        />
        <StatCard 
          icon={<Flame className="w-5 h-5" />}
          iconBg="bg-orange-100 text-orange-600"
          label="Streak"
          value={`${stats.streak || 0} days`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Level & XP Progress */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Level</p>
                  <p className="text-2xl font-bold text-slate-900">Level {stats.level || 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total XP</p>
                <p className="text-xl font-semibold text-slate-900">{(stats.xp || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Progress to Level {(stats.level || 1) + 1}</span>
                <span className="text-slate-700 font-medium">{xpNeeded} XP needed</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl bg-white border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your latest portfolio actions</p>
            </div>
            
            <div className="p-2">
              {activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.slice(0, 5).map((activity: any, index: number) => (
                    <ActivityItem key={activity.id || index} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">No activity yet</h3>
                  <p className="text-sm text-slate-500 mb-4">Start your first scan to see activity here</p>
                  <Button 
                    onClick={() => onNavigate?.('/scan')}
                    className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm"
                  >
                    Start Scanning
                  </Button>
                </div>
              )}
            </div>

            {activities.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100">
                <button 
                  onClick={() => onNavigate?.('/history')}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All Activity
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction 
                icon={<Scan className="w-4 h-4" />}
                label="Scan Portfolio"
                onClick={() => onNavigate?.('/scan')}
              />
              <QuickAction 
                icon={<RefreshCw className="w-4 h-4" />}
                label="Consolidate"
                onClick={() => onNavigate?.('/consolidate')}
              />
              <QuickAction 
                icon={<BarChart3 className="w-4 h-4" />}
                label="Grant Metrics"
                onClick={() => onNavigate?.('/grant-metrics')}
              />
              <QuickAction 
                icon={<Clock className="w-4 h-4" />}
                label="View History"
                onClick={() => onNavigate?.('/history')}
              />
            </div>
          </div>

          {/* Streak Card */}
          {stats.streak > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{stats.streak} Day Streak! 🔥</p>
                  <p className="text-xs text-slate-500">Keep up the momentum</p>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Teaser */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Achievements</h3>
            <p className="text-xs text-slate-500 mb-3">Coming Soon</p>
            <div className="flex justify-center gap-2">
              {['🏆', '⭐', '🎯', '🔥'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-sm opacity-50">
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, iconBg, label, value }: { 
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", iconBg)}>
        {icon}
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: any }) {
  const activityDate = activity.date instanceof Date ? activity.date : new Date(activity.date);
  
  const getIcon = () => {
    switch (activity.type) {
      case 'consolidate': return <RefreshCw className="w-4 h-4" />;
      case 'scan': return <Scan className="w-4 h-4" />;
      case 'claim': return <Gift className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getIconStyle = () => {
    switch (activity.type) {
      case 'consolidate': return 'bg-emerald-100 text-emerald-600';
      case 'scan': return 'bg-indigo-100 text-indigo-600';
      case 'claim': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", getIconStyle())}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-900 capitalize">{activity.type}</span>
          {activity.status === 'complete' && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
        <span className="text-xs text-slate-400">{formatTimeAgo(activityDate)}</span>
      </div>
      {activity.amountUSD > 0 && (
        <span className="font-semibold text-sm text-slate-900">
          ${activity.amountUSD.toFixed(2)}
        </span>
      )}
      {activity.txHash && (
        <a
          href={`https://basescan.org/tx/${activity.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// Quick Action Button Component
function QuickAction({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
        <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">{icon}</span>
        {label}
      </span>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
    </button>
  );
}

export default Dashboard;
