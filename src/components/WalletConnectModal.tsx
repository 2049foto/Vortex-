'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Wallet Connect Modal
 * Professional wallet connection with all supported wallets
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnect, useAccount, Connector } from 'wagmi';
import { 
  X, 
  Wallet, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  Loader2,
  QrCode,
  Smartphone,
  Globe
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  installed?: boolean;
  popular?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET ICONS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const WALLET_ICONS: Record<string, React.ReactNode> = {
  'MetaMask': (
    <svg className="w-8 h-8" viewBox="0 0 35 33">
      <path d="M32.96 1L19.32 11.29l2.54-5.93L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
      <path d="M2.04 1l13.5 10.39-2.4-5.93L2.04 1z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M28.17 23.53l-3.63 5.56 7.77 2.14 2.23-7.58-6.37-.12z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M.48 23.65l2.21 7.58 7.77-2.14-3.63-5.56-6.35.12z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M10.08 14.42l-2.17 3.27 7.72.35-.28-8.29-5.27 4.67z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M24.92 14.42l-5.33-4.77-.19 8.39 7.72-.35-2.2-3.27z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M10.46 29.09l4.66-2.27-4.03-3.14-.63 5.41z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M19.88 26.82l4.66 2.27-.63-5.41-4.03 3.14z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
    </svg>
  ),
  'Coinbase Wallet': (
    <svg className="w-8 h-8" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="5.6" fill="#0052FF"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M14 23.8C19.4124 23.8 23.8 19.4124 23.8 14C23.8 8.58761 19.4124 4.2 14 4.2C8.58761 4.2 4.2 8.58761 4.2 14C4.2 19.4124 8.58761 23.8 14 23.8ZM11.55 10.5C11.0253 10.5 10.5 11.0253 10.5 11.55V16.45C10.5 16.9747 11.0253 17.5 11.55 17.5H16.45C16.9747 17.5 17.5 16.9747 17.5 16.45V11.55C17.5 11.0253 16.9747 10.5 16.45 10.5H11.55Z" fill="white"/>
    </svg>
  ),
  'WalletConnect': (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#3B99FC"/>
      <path d="M10.04 12.53c3.28-3.22 8.6-3.22 11.88 0l.4.39c.16.16.16.42 0 .58l-1.36 1.33c-.08.08-.21.08-.3 0l-.54-.53c-2.29-2.24-6-2.24-8.29 0l-.58.57c-.08.08-.21.08-.3 0l-1.36-1.33c-.16-.16-.16-.42 0-.58l.45-.43zm14.68 2.73l1.21 1.19c.16.16.16.42 0 .58l-5.46 5.35c-.16.16-.43.16-.59 0l-3.88-3.8c-.04-.04-.11-.04-.15 0l-3.88 3.8c-.16.16-.43.16-.59 0l-5.46-5.35c-.16-.16-.16-.42 0-.58l1.21-1.19c.16-.16.43-.16.59 0l3.88 3.8c.04.04.11.04.15 0l3.88-3.8c.16-.16.43-.16.59 0l3.88 3.8c.04.04.11.04.15 0l3.88-3.8c.16-.16.43-.16.59 0z" fill="white"/>
    </svg>
  ),
  'Injected': (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
      <Wallet className="w-5 h-5 text-white" />
    </div>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { isConnected, address } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Close modal when connected
  useEffect(() => {
    if (isConnected && address) {
      const timer = setTimeout(() => {
        onClose();
        setConnectingId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, onClose]);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setConnectingId(null);
    }
  }, [isOpen, reset]);

  const handleConnect = useCallback(async (connector: Connector) => {
    try {
      setConnectingId(connector.id);
      reset();
      await connect({ connector });
    } catch (e) {
      console.error('Connect error:', e);
    }
  }, [connect, reset]);

  // Get connector name for display
  const getConnectorName = (connector: Connector): string => {
    if (connector.id === 'injected') {
      // Check if MetaMask
      if (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask) {
        return 'MetaMask';
      }
      return 'Browser Wallet';
    }
    if (connector.id === 'coinbaseWalletSDK') return 'Coinbase Wallet';
    if (connector.id === 'walletConnect') return 'WalletConnect';
    return connector.name;
  };

  // Get connector icon
  const getConnectorIcon = (connector: Connector) => {
    const name = getConnectorName(connector);
    return WALLET_ICONS[name] || WALLET_ICONS['Injected'];
  };

  // Get connector description
  const getConnectorDescription = (connector: Connector): string => {
    const name = getConnectorName(connector);
    if (name === 'MetaMask') return 'Popular browser extension wallet';
    if (name === 'Coinbase Wallet') return 'Smart wallet with gasless support';
    if (name === 'WalletConnect') return 'Connect mobile & desktop wallets';
    return 'Connect using browser wallet';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Connect Wallet</h2>
                <p className="text-sm text-foreground-muted">Choose how to connect</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-card-hover transition-colors"
            >
              <X className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>

          {/* Success State */}
          {isConnected && address && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-bg flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connected!</h3>
              <p className="text-sm text-foreground-muted font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </motion.div>
          )}

          {/* Wallet List */}
          {!isConnected && (
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {connectors.map((connector) => {
                const isConnecting = connectingId === connector.id && isPending;
                const name = getConnectorName(connector);
                
                return (
                  <motion.button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isConnecting
                        ? 'border-primary bg-primary-muted'
                        : 'border-border hover:border-primary/50 hover:bg-card-hover'
                    } ${isPending && !isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {getConnectorIcon(connector)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        {name === 'Coinbase Wallet' && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-muted text-primary rounded-full">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {getConnectorDescription(connector)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-foreground-muted" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-4 p-4 rounded-xl bg-danger-bg border border-danger/20"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-danger">Connection Failed</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {error.message || 'Please try again or use a different wallet'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          {!isConnected && (
            <div className="p-4 border-t border-border bg-card-hover/50">
              <p className="text-xs text-foreground-muted text-center">
                By connecting, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR EASY USAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function useWalletConnectModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}
