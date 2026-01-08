/**
 * WalletConnect component for VORTEX PROTOCOL
 * Handles wallet connection UI and address display
 * Ready to integrate with Reown AppKit / Wagmi v3 / Coinbase Smart Wallet
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Copy, Check, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface WalletConnectProps {
  isConnected: boolean;
  address?: string;
  ensName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

export function WalletConnect({
  isConnected,
  address,
  ensName,
  onConnect,
  onDisconnect,
  isConnecting = false,
}: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Button
        variant="primary"
        onClick={onConnect}
        isLoading={isConnecting}
        leftIcon={<Wallet className="w-4 h-4" />}
        className="min-h-[44px]"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 bg-card min-h-[44px]',
          'font-medium transition-all hover:border-muted-foreground',
          isOpen ? 'border-primary' : 'border-border'
        )}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-xs text-white font-bold">
            {(ensName || address || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-foreground">
          {ensName || (address ? formatAddress(address) : 'Connected')}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Connected as</p>
                <p className="font-medium text-foreground truncate">
                  {ensName && <span className="block">{ensName}</span>}
                  <span className="text-sm text-muted-foreground">
                    {address ? formatAddress(address) : ''}
                  </span>
                </p>
              </div>

              <div className="p-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy address'}</span>
                </button>

                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">View on Explorer</span>
                </a>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onDisconnect();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Disconnect</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletConnect;

