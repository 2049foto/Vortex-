/**
 * Toast notification component for VORTEX PROTOCOL
 * Animated toast with success/error/warning/info variants
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../../types';
import { cn } from '../../utils/cn';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const variants = {
  success: 'bg-accent/10 border-accent/20 text-accent',
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
};

export function ToastItem({ toast, onDismiss }: ToastProps) {
  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm',
        'bg-card shadow-lg',
        variants[toast.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;

