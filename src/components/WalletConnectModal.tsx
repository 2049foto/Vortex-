'use client';

import { useEffect, useState } from 'react';
import { useConnect, useAccount, type Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Wallet, ExternalLink } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Wallet config with icons
const WALLET_CONFIG: Record<string, { 
  name: string;
  icon: string;
  description: string;
  recommended?: boolean;
}> = {
  'injected': {
    name: 'Browser Wallet',
    icon: '🦊',
    description: 'MetaMask, Rainbow, etc.',
  },
  'metaMask': {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Popular browser wallet',
  },
  'coinbaseWalletSDK': {
    name: 'Coinbase',
    icon: '🔵',
    description: 'Coinbase Smart Wallet',
    recommended: true,
  },
  'walletConnect': {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Scan with mobile wallet',
  },
};

export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const { isConnected, address } = useAccount();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address && isOpen) {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    }
  }, [isConnected, address, isOpen, onSuccess, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedConnector(null);
      setConnectionError(null);
    }
  }, [isOpen]);

  // Handle connect error
  useEffect(() => {
    if (error) {
      setConnectionError(error.message);
      setSelectedConnector(null);
    }
  }, [error]);

  const handleConnect = async (connector: Connector) => {
    setSelectedConnector(connector.uid);
    setConnectionError(null);
    
    try {
      await connect({ connector });
    } catch (err: any) {
      setConnectionError(err?.message || 'Connection failed');
      setSelectedConnector(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="modal"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h3 className="text-lg font-semibold">Connect Wallet</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-icon"
              style={{ width: 32, height: 32, minHeight: 32 }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Success State */}
            {isConnected && address ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--success-light))' }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--success))' }} />
                </div>
                <h4 className="text-lg font-semibold mb-2">Connected!</h4>
                <p className="text-sm font-mono" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </motion.div>
            ) : (
              <>
                {/* Error State */}
                {connectionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl flex items-start gap-3"
                    style={{ background: 'hsl(var(--danger-light))' }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--danger))' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--danger))' }}>
                        Connection failed
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
                        {connectionError.includes('User rejected') 
                          ? 'Request was rejected'
                          : 'Please try again'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Wallet Options */}
                <div className="space-y-2">
                  {connectors.map((connector) => {
                    const config = WALLET_CONFIG[connector.id] || {
                      name: connector.name,
                      icon: '👛',
                      description: 'Connect wallet',
                    };
                    const isLoading = isPending && selectedConnector === connector.uid;
                    
                    return (
                      <motion.button
                        key={connector.uid}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleConnect(connector)}
                        disabled={isPending}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all"
                        style={{
                          background: 'hsl(var(--bg-primary))',
                          borderColor: isLoading 
                            ? 'hsl(var(--accent))' 
                            : 'hsl(var(--border))',
                          opacity: isPending && !isLoading ? 0.5 : 1,
                        }}
                      >
                        {/* Icon */}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: 'hsl(var(--bg-tertiary))' }}
                        >
                          {isLoading ? (
                            <Loader2 
                              className="w-6 h-6 animate-spin" 
                              style={{ color: 'hsl(var(--accent))' }} 
                            />
                          ) : (
                            config.icon
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{config.name}</span>
                            {config.recommended && (
                              <span 
                                className="badge badge-primary"
                                style={{ height: 20, fontSize: 10 }}
                              >
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
                            {isLoading ? 'Connecting...' : config.description}
                          </p>
                        </div>
                        
                        {/* Arrow */}
                        {!isLoading && (
                          <ExternalLink 
                            className="w-5 h-5" 
                            style={{ color: 'hsl(var(--text-tertiary))' }} 
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    By connecting, you agree to our Terms of Service
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
