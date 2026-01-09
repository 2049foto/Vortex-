'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * WalletConnectModal - Uses Reown AppKit for wallet connection
 * Supports 300+ wallets including Coinbase Smart Wallet, MetaMask, etc.
 */
export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const { open, close } = useAppKit();
  const { isConnected, address } = useAccount();

  // Open Reown modal when this modal should be open
  useEffect(() => {
    if (isOpen && !isConnected) {
      open({ view: 'Connect' });
    }
  }, [isOpen, isConnected, open]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address && isOpen) {
      setTimeout(() => {
        close();
        onSuccess?.();
        onClose();
      }, 300);
    }
  }, [isConnected, address, isOpen, onSuccess, onClose, close]);

  // This component now just triggers the Reown modal
  // No custom UI needed - Reown provides beautiful UI
  return null;
}

/**
 * Hook to open wallet connect modal using Reown AppKit
 */
export function useWalletConnect() {
  const { open, close } = useAppKit();
  const { isConnected, address } = useAccount();

  const openConnect = () => {
    if (!isConnected) {
      open({ view: 'Connect' });
    }
  };

  const openAccount = () => {
    if (isConnected) {
      open({ view: 'Account' });
    }
  };

  const openNetworks = () => {
    open({ view: 'Networks' });
  };

  return {
    openConnect,
    openAccount,
    openNetworks,
    close,
    isConnected,
    address,
  };
}
