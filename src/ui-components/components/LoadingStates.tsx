/**
 * Loading States Components
 * Skeleton loaders and loading animations for Vortex Protocol
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

// Skeleton Component
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200",
        className
      )}
    />
  );
}

// Token Card Skeleton
export function TokenCardSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
      <Skeleton className="w-5 h-5 rounded-md" />
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-1.5" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// Token List Skeleton
export function TokenListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <TokenCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-100">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="p-5 rounded-2xl bg-white border border-slate-100">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Scan Loading Animation
export function ScanLoadingAnimation({ progress = 0 }: { progress?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-32 h-32 mb-6">
        {/* Outer ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: '352',
              strokeDashoffset: '0',
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{progress}%</span>
        </div>
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-slate-500"
      >
        Scanning across 11 chains...
      </motion.p>
      
      {/* Chain indicators */}
      <div className="flex gap-1.5 mt-4">
        {['Base', 'ETH', 'Arb', 'OP', 'POL'].map((chain, i) => (
          <motion.div
            key={chain}
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{ 
              scale: progress > i * 20 ? 1 : 0.8,
              opacity: progress > i * 20 ? 1 : 0.3,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
              i === 0 ? 'bg-blue-600' :
              i === 1 ? 'bg-slate-600' :
              i === 2 ? 'bg-blue-500' :
              i === 3 ? 'bg-red-500' :
              'bg-purple-600'
            )}
          >
            {chain.slice(0, 1)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Consolidation Progress Animation
export function ConsolidationProgress({ 
  currentStep, 
  totalSteps,
  stepLabels = ['Simulating', 'Approving', 'Executing', 'Confirming']
}: { 
  currentStep: number; 
  totalSteps: number;
  stepLabels?: string[];
}) {
  return (
    <div className="flex flex-col items-center py-8">
      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />
        </div>
      </div>
      
      {/* Steps */}
      <div className="flex justify-between w-full max-w-xs">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: i <= currentStep ? 1 : 0.8,
                backgroundColor: i < currentStep ? '#10b981' : i === currentStep ? '#6366f1' : '#e2e8f0',
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mb-1"
            >
              {i < currentStep ? '✓' : i + 1}
            </motion.div>
            <span className={cn(
              "text-[10px] font-medium",
              i <= currentStep ? 'text-slate-700' : 'text-slate-400'
            )}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty State Component
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// Error State Component
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again or contact support if the problem persists.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export default { 
  Skeleton, 
  TokenCardSkeleton, 
  TokenListSkeleton, 
  StatsCardSkeleton, 
  DashboardSkeleton,
  ScanLoadingAnimation,
  ConsolidationProgress,
  EmptyState,
  ErrorState,
};
