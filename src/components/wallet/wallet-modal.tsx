'use client';

/**
 * Vortex Protocol - Wallet Connection Modal
 * Support for EVM wallets (10 chains) + Solana
 */

import { useState } from 'react';
import { useConnect, useDisconnect, useAccount, Connector } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Wallet, ChevronRight, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Wallet info for display
const WALLET_INFO: Record<string, { name: string; icon: string; description: string }> = {
  injected: {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask or browser wallet',
  },
  coinbaseWalletSDK: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Best for Base chain with Smart Wallet',
  },
  walletConnect: {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect mobile wallets via QR code',
  },
};

export function WalletModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evm' | 'solana'>('evm');

  if (!isOpen) return null;

  const handleConnect = async (connector: Connector) => {
    setSelectedConnector(connector.id);
    try {
      await connect({ connector });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSelectedConnector(null);
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-white shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connect Wallet</h2>
              <p className="text-sm text-gray-500">Choose your preferred wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('evm')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'evm'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            EVM Chains (10)
          </button>
          <button
            onClick={() => setActiveTab('solana')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'solana'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Solana
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Connected State */}
          {isConnected && address && activeTab === 'evm' && (
            <div className="mb-4 p-4 rounded-2xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  <p className="text-sm text-green-600 font-mono">{formatAddress(address)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* EVM Wallets */}
          {activeTab === 'evm' && (
            <div className="space-y-3">
              {connectors.map((connector) => {
                const info = WALLET_INFO[connector.id] || {
                  name: connector.name,
                  icon: '👛',
                  description: 'Connect wallet',
                };
                const isLoading = isPending && selectedConnector === connector.id;
                
                return (
                  <button
                    key={connector.id}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group
                      ${isLoading 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-3xl">{info.icon}</div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{info.name}</p>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </button>
                );
              })}

              {/* Supported Chains Info */}
              <div className="mt-4 p-4 rounded-xl bg-gray-50">
                <p className="text-xs font-medium text-gray-600 mb-2">Supported EVM Chains:</p>
                <div className="flex flex-wrap gap-1">
                  {['Base', 'Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BNB', 'Avalanche', 'zkSync', 'Monad'].map((chain) => (
                    <span key={chain} className="px-2 py-0.5 text-xs bg-white rounded-full text-gray-600 border border-gray-200">
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Solana */}
          {activeTab === 'solana' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 text-center">
                <div className="text-4xl mb-3">☀️</div>
                <h3 className="font-bold text-gray-900 mb-2">Solana Wallet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Solana wallet to scan SPL tokens across Solana network.
                </p>
                
                {/* Phantom Wallet Button */}
                <Button
                  variant="primary"
                  className="w-full mb-3"
                  onClick={() => {
                    // Check if Phantom is installed
                    if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
                      (window as any).phantom.solana.connect();
                    } else {
                      window.open('https://phantom.app/', '_blank');
                    }
                  }}
                >
                  <span className="mr-2">👻</span>
                  Connect Phantom
                </Button>
                
                {/* Solflare Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).solflare) {
                      (window as any).solflare.connect();
                    } else {
                      window.open('https://solflare.com/', '_blank');
                    }
                  }}
                >
                  <span className="mr-2">🔥</span>
                  Connect Solflare
                </Button>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Solana wallet connection works independently from EVM. Connect both to scan all 11 chains.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500">
            By connecting, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default WalletModal;

