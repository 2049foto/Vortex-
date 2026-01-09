/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - App Providers 2026
 * Web3, Query Client, and global state management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { wagmiConfig } from '@/lib/web3';

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within Providers');
  return context;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`card p-4 animate-slide-right ${
            toast.type === 'success' ? 'border-success bg-success-bg' :
            toast.type === 'error' ? 'border-danger bg-danger-bg' :
            toast.type === 'warning' ? 'border-warning bg-warning-bg' :
            'border-info bg-info-bg'
          }`}
          onClick={() => onRemove(toast.id)}
        >
          <div className="font-medium text-sm">{toast.title}</div>
          {toast.message && (
            <div className="text-xs text-foreground-secondary mt-1">{toast.message}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        {/* Vortex Logo Animation */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="vortex-spinner w-20 h-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Vortex Protocol</h2>
          <p className="text-sm text-foreground-muted">Initializing...</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-48 mx-auto mt-6">
          <div className="h-1 bg-card-hover rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse-glow rounded-full" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay for smoother transition
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {mounted ? children : <LoadingScreen />}
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
