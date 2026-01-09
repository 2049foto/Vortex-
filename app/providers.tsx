'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { WagmiProvider, type State } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, projectId, metadata, supportedChains } from '@/lib/web3';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { base } from 'wagmi/chains';

// Initialize Reown AppKit - cast networks to satisfy AppKit types
const appKitNetworks = [base, ...supportedChains.filter(c => c.id !== base.id)] as const;

if (typeof window !== 'undefined') {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    // @ts-expect-error - AppKit network types are strict, but our chains are compatible
    networks: appKitNetworks,
    defaultNetwork: base,
    metadata,
    features: {
      analytics: true,
      email: false,
      socials: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#0052FF',
      '--w3m-border-radius-master': '12px',
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM - Minimal & Non-intrusive
// ═══════════════════════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_COLORS = {
  success: { bg: 'hsl(var(--success-light))', color: 'hsl(var(--success))' },
  error: { bg: 'hsl(var(--danger-light))', color: 'hsl(var(--danger))' },
  info: { bg: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' },
  warning: { bg: 'hsl(var(--warning-light))', color: 'hsl(var(--warning))' },
};

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    toast: addToast,
    success: (title, desc) => addToast('success', title, desc),
    error: (title, desc) => addToast('error', title, desc),
    info: (title, desc) => addToast('info', title, desc),
    warning: (title, desc) => addToast('warning', title, desc),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div 
        className="fixed top-4 right-4 z-50 space-y-2"
        style={{ maxWidth: '360px' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const Icon = TOAST_ICONS[toast.type];
            const colors = TOAST_COLORS[toast.type];
            
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 8px 24px hsl(var(--shadow-color) / 0.1)',
                }}
              >
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: colors.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: colors.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {toast.description}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-[hsl(var(--bg-tertiary))] transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SCREEN - Clean & Minimal
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev >= 90 ? prev : prev + 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'hsl(var(--bg-primary))' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div 
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-bold text-2xl"
            style={{ background: 'hsl(var(--accent))', color: 'white' }}
          >
            V
          </div>
        </motion.div>
        
        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-1">Vortex Protocol</h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Loading...
          </p>
        </motion.div>
        
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div 
            className="w-32 h-1 mx-auto rounded-full overflow-hidden"
            style={{ background: 'hsl(var(--bg-tertiary))' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

export function Providers({ children, initialState }: { children: React.ReactNode; initialState?: State }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay for smoother transition
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AnimatePresence mode="wait">
            {mounted ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            ) : (
              <LoadingScreen key="loading" />
            )}
          </AnimatePresence>
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
