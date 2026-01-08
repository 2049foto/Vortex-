'use client';

/**
 * Vortex Protocol - Wallet Connection Modal
 * Premium UI with smart wallet detection and better UX
 */

import { useState, useEffect } from 'react';
import { useConnect, useDisconnect, useAccount, Connector } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Wallet, ChevronRight, Check, AlertCircle, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Wallet info for display with better categorization
const WALLET_INFO: Record<string, { 
  name: string; 
  icon: string; 
  description: string;
  category: 'browser' | 'mobile' | 'smart';
  recommended?: boolean;
}> = {
  injected: {
    name: 'Browser Wallet',
    icon: '🦊',
    description: 'MetaMask, Backpack, or other browser extension',
    category: 'browser',
  },
  coinbaseWalletSDK: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Best for Base chain with Smart Wallet',
    category: 'smart',
    recommended: true,
  },
  walletConnect: {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect mobile wallets via QR code',
    category: 'mobile',
  },
};

// Detect available wallets
function detectAvailableWallets() {
  if (typeof window === 'undefined') return { hasMetaMask: false, hasBackpack: false, hasCoinbase: false };
  
  const ethereum = (window as any).ethereum;
  return {
    hasMetaMask: !!ethereum?.isMetaMask,
    hasBackpack: !!ethereum?.isBackpack,
    hasCoinbase: !!ethereum?.isCoinbaseWallet,
  };
}

export function WalletModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evm' | 'solana'>('evm');
  const [availableWallets, setAvailableWallets] = useState(detectAvailableWallets());

  // Update wallet detection on mount
  useEffect(() => {
    if (isOpen) {
      setAvailableWallets(detectAvailableWallets());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (connector: Connector) => {
    setSelectedConnector(connector.id);
    try {
      await connect({ connector });
      onSuccess?.();
      setTimeout(() => onClose(), 500); // Small delay for smooth transition
    } catch (err) {
      console.error('Connection error:', err);
      setSelectedConnector(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSelectedConnector(null);
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Filter connectors by category
  const browserConnectors = connectors.filter(c => 
    c.id === 'injected' || c.type === 'injected'
  );
  const mobileConnectors = connectors.filter(c => 
    c.id === 'walletConnect'
  );
  const smartConnectors = connectors.filter(c => 
    c.id === 'coinbaseWalletSDK'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
                      <p className="text-sm text-gray-600">Choose your preferred wallet</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Connected State */}
                {isConnected && address && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">Connected</p>
                        <p className="text-sm text-emerald-700 font-mono">{formatAddress(address)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Recommended: Coinbase Wallet */}
                {smartConnectors.length > 0 && !isConnected && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Recommended</span>
                    </div>
                    {smartConnectors.map((connector) => {
                      const info = WALLET_INFO[connector.id] || {
                        name: connector.name,
                        icon: '🔵',
                        description: 'Smart wallet for Base',
                        category: 'smart' as const,
                      };
                      const isLoading = isPending && selectedConnector === connector.id;
                      
                      return (
                        <button
                          key={connector.id}
                          onClick={() => handleConnect(connector)}
                          disabled={isPending}
                          className={cn(
                            "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group mb-2",
                            isLoading
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-400 hover:shadow-lg'
                          )}
                        >
                          <div className="text-3xl">{info.icon}</div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900">{info.name}</p>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                                BEST FOR BASE
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{info.description}</p>
                          </div>
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Browser Wallets */}
                {browserConnectors.length > 0 && !isConnected && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Browser Extension</h3>
                    <div className="space-y-2">
                      {browserConnectors.map((connector) => {
                        const info = WALLET_INFO[connector.id] || {
                          name: connector.name,
                          icon: '👛',
                          description: 'Connect browser wallet',
                          category: 'browser' as const,
                        };
                        const isLoading = isPending && selectedConnector === connector.id;
                        const isAvailable = connector.id === 'injected' && (
                          availableWallets.hasMetaMask || 
                          availableWallets.hasBackpack || 
                          availableWallets.hasCoinbase
                        );
                        
                        return (
                          <button
                            key={connector.id}
                            onClick={() => handleConnect(connector)}
                            disabled={isPending || !isAvailable}
                            className={cn(
                              "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                              isLoading
                                ? 'border-indigo-500 bg-indigo-50'
                                : !isAvailable
                                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                            )}
                          >
                            <div className="text-3xl">{info.icon}</div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-900">{info.name}</p>
                              <p className="text-sm text-gray-500">
                                {!isAvailable ? 'Install extension first' : info.description}
                              </p>
                            </div>
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mobile Wallets */}
                {mobileConnectors.length > 0 && !isConnected && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Mobile Wallet</h3>
                    {mobileConnectors.map((connector) => {
                      const info = WALLET_INFO[connector.id] || {
                        name: connector.name,
                        icon: '🔗',
                        description: 'Scan QR code to connect',
                        category: 'mobile' as const,
                      };
                      const isLoading = isPending && selectedConnector === connector.id;
                      
                      return (
                        <button
                          key={connector.id}
                          onClick={() => handleConnect(connector)}
                          disabled={isPending}
                          className={cn(
                            "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                            isLoading
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          )}
                        >
                          <div className="text-3xl">{info.icon}</div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">{info.name}</p>
                            <p className="text-sm text-gray-500">{info.description}</p>
                          </div>
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Supported Chains Info */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Supported EVM Chains:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Base', 'Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BNB', 'Avalanche', 'zkSync', 'Monad'].map((chain) => (
                      <span 
                        key={chain} 
                        className="px-2.5 py-1 text-xs bg-white rounded-full text-gray-700 border border-gray-200 font-medium shadow-sm"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Connection Failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{error.message}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-center text-gray-500">
                  By connecting, you agree to our{' '}
                  <a href="#" className="text-indigo-600 hover:underline font-medium">Terms of Service</a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default WalletModal;
