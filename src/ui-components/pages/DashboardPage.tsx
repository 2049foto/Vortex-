/**
 * Dashboard Page for VORTEX PROTOCOL
 * User stats, XP progress, activity history, and settings
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles, TrendingUp, Clock, Flame, Award, ArrowRight, ExternalLink,
  CheckCircle, RefreshCw, Gift, Settings, ChevronRight, BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MOCK_USER_STATS, MOCK_ACTIVITY } from '../constants/mockData';
import { CHAINS } from '../constants/chains';
import { cn } from '../utils/cn';

interface DashboardPageProps {
  walletAddress?: string;
}

// Helper function to format time distance
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

export function DashboardPage({ walletAddress }: DashboardPageProps) {
  const router = useRouter();
  const stats = MOCK_USER_STATS;
  const activities = MOCK_ACTIVITY;

  // XP progress calculation
  const xpForNextLevel = stats.level * 250;
  const xpProgress = (stats.xp % xpForNextLevel) / xpForNextLevel * 100;
  const xpNeeded = xpForNextLevel - (stats.xp % xpForNextLevel);

  const statCards = [
    {
      icon: Sparkles,
      label: 'Dust Found',
      value: `$${stats.dustFoundUSD.toFixed(2)}`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Base TVL Added',
      value: `$${stats.baseTVLAdded.toFixed(2)}`,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Clock,
      label: 'Portfolios Cleaned',
      value: stats.portfoliosCleaned.toString(),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${stats.streak} days`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consolidate': return RefreshCw;
      case 'scan': return BarChart3;
      case 'claim': return Gift;
      default: return CheckCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'consolidate': return 'text-accent bg-accent/10';
      case 'scan': return 'text-primary bg-primary/10';
      case 'claim': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back{walletAddress ? `, ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/scan')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          New Scan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* XP & Level Card */}
          <Card variant="elevated">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className="text-2xl font-bold text-foreground">Level {stats.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-xl font-semibold text-foreground">{stats.xp.toLocaleString()}</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Level {stats.level + 1}</span>
                  <span className="text-foreground font-medium">{xpNeeded} XP needed</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="py-4 text-center">
                      <div className={cn('w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center', stat.bgColor)}>
                        <Icon className={cn('w-5 h-5', stat.color)} />
                      </div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest portfolio actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const chain = CHAINS[activity.chainId];
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getActivityColor(activity.type))}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground capitalize">{activity.type}</p>
                          <Badge variant="muted" size="sm">{chain?.name || 'Unknown'}</Badge>
                          {activity.status === 'complete' && (
                            <CheckCircle className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(activity.date)}
                        </p>
                      </div>
                      {activity.amountUSD > 0 && (
                        <span className="font-semibold text-foreground">
                          ${activity.amountUSD.toFixed(2)}
                        </span>
                      )}
                      {activity.txHash && (
                        <a
                          href={`https://basescan.org/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="View transaction"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No activity yet. Start your first scan!</p>
                </div>
              )}
            </CardContent>
            {activities.length > 0 && (
              <CardFooter className="justify-center">
                <Button variant="ghost" size="sm">
                  View All Activity
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push('/scan')}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Scan Portfolio
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push('/settings')}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Achievements Teaser */}
          <Card variant="glass">
            <CardContent className="py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Achievements</h3>
              <p className="text-sm text-muted-foreground mb-4">Coming Soon</p>
              <div className="flex justify-center gap-2">
                {['🏆', '⭐', '🎯', '🔥'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-lg opacity-50"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Streak Reminder */}
          {stats.streak > 0 && (
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{stats.streak} Day Streak!</p>
                    <p className="text-sm text-muted-foreground">Keep it going!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

