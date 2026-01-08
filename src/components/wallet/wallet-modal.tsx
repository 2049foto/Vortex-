'use client';

/**
 * Vortex Protocol - Premium Wallet Connection Modal
 * Clean, minimal, Apple-like design
 */

import { useState, useEffect } from 'react';
import { useConnect, useDisconnect, useAccount, Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ExternalLink, Wallet, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Wallet configurations with proper icons and info
const WALLET_CONFIG: Record<string, {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  badge?: string;
}> = {
  'injected': {
    name: 'Browser Wallet',
    icon: '🦊',
    gradient: 'from-orange-500 to-amber-500',
    description: 'MetaMask or other browser extension',
  },
  'coinbaseWalletSDK': {
    name: 'Coinbase Wallet',
    icon: '💎',
    gradient: 'from-blue-600 to-indigo-600',
    description: 'Best for Base chain',
    badge: 'RECOMMENDED',
  },
  'walletConnect': {
    name: 'WalletConnect',
    icon: '🔗',
    gradient: 'from-violet-600 to-purple-600',
    description: 'Connect mobile wallet via QR',
  },
};

export function WalletModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConnectingId(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (connector: Connector) => {
    setConnectingId(connector.id);
    setError(null);
    
    try {
      await connect({ connector });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
      setConnectingId(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectingId(null);
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Filter to only show main connectors
  const mainConnectors = connectors.filter(c => 
    ['injected', 'coinbaseWalletSDK', 'walletConnect'].includes(c.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative px-6 pt-6 pb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Connect Wallet</h2>
                    <p className="text-xs text-slate-500">Secure connection to Vortex</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Connected State */}
              {isConnected && address ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">Connected</p>
                      <p className="text-sm text-emerald-600 font-mono truncate">{formatAddress(address)}</p>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {mainConnectors.map((connector, index) => {
                    const config = WALLET_CONFIG[connector.id] || {
                      name: connector.name,
                      icon: '👛',
                      gradient: 'from-slate-600 to-slate-700',
                      description: 'Connect wallet',
                    };
                    const isConnecting = connectingId === connector.id;
                    const isRecommended = config.badge === 'RECOMMENDED';
                    
                    return (
                      <motion.button
                        key={connector.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleConnect(connector)}
                        disabled={isPending}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group text-left",
                          isConnecting
                            ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                            : isRecommended
                              ? 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 hover:border-indigo-300 hover:shadow-lg'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                          isPending && !isConnecting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                          `bg-gradient-to-br ${config.gradient}`,
                          "shadow-md"
                        )}>
                          <span className="filter drop-shadow-sm">{config.icon}</span>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{config.name}</span>
                            {isRecommended && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded">
                                BEST
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">{config.description}</p>
                        </div>
                        
                        {/* Arrow/Loading */}
                        <div className="flex-shrink-0">
                          {isConnecting ? (
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Features */}
              {!isConnected && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Non-custodial</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gasless</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔗</span>
                      <span>10 Chains</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-[11px] text-center text-slate-400">
                By connecting, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default WalletModal;
