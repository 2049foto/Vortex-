/**
 * Vortex Protocol - Premium Loading States
 * Beautiful loading animations and skeleton components
 */

'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

// Skeleton Pulse Animation
const pulse = {
  initial: { opacity: 0.4 },
  animate: { 
    opacity: [0.4, 0.7, 0.4],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
  }
};

/**
 * Card Skeleton for loading states
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div 
      variants={pulse}
      initial="initial"
      animate="animate"
      className={`rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 ${className}`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-3/4" />
      </div>
    </motion.div>
  );
}

/**
 * Token List Skeleton
 */
export function TokenListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Stats Skeleton
 */
export function StatsSkeleton() {
  return (
    <motion.div 
      variants={pulse}
      initial="initial"
      animate="animate"
      className="grid grid-cols-3 gap-4"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
          <div className="h-3 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </motion.div>
  );
}

/**
 * Full Page Loading Spinner
 */
export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <p className="text-slate-600 font-medium">{message}</p>
      </motion.div>
    </div>
  );
}

/**
 * Inline Loading Spinner
 */
export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
  );
}

/**
 * Scanning Progress Animation
 */
export function ScanningProgress({ 
  progress, 
  currentChain,
  totalChains = 10 
}: { 
  progress: number;
  currentChain: string;
  totalChains?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Progress Circle */}
      <div className="relative w-52 h-52 mb-8">
        {/* Background Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="104" cy="104" r="92"
            className="fill-none stroke-slate-100"
            strokeWidth="10"
          />
          <motion.circle
            cx="104" cy="104" r="92"
            className="fill-none stroke-indigo-600"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={578}
            initial={{ strokeDashoffset: 578 }}
            animate={{ strokeDashoffset: 578 - (578 * progress) / 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Animated Glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1], 
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-2 rounded-full bg-indigo-500/10"
        />
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <span className="text-3xl font-bold text-slate-900">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Status Text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2">Scanning Portfolio</h2>
        <motion.p 
          key={currentChain}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-500"
        >
          Analyzing <span className="font-semibold text-indigo-600">{currentChain}</span>...
        </motion.p>
        <p className="text-sm text-slate-400 mt-1">
          Chain {Math.min(Math.ceil((progress / 100) * totalChains), totalChains)} of {totalChains}
        </p>
      </motion.div>

      {/* Chain Progress Dots */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: totalChains }).map((_, i) => {
          const isActive = i < Math.ceil((progress / 100) * totalChains);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: isActive ? 1 : 0.8,
                backgroundColor: isActive ? '#6366F1' : '#E2E8F0'
              }}
              className="w-2 h-2 rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

/**
 * Error State Component
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {message && (
        <p className="text-slate-500 max-w-sm mb-6">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}

/**
 * Success Animation
 */
export function SuccessAnimation({ 
  message = 'Success!' 
}: { 
  message?: string 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
      >
        <motion.svg 
          className="w-10 h-10 text-emerald-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-semibold text-slate-900"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

/**
 * Shimmer Effect Component
 */
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
