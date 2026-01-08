/**
 * Layout component for VORTEX PROTOCOL
 * Wraps pages with Header and Footer, provides consistent structure
 */

'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/Toast';
import { Toast } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  wallet: {
    isConnected: boolean;
    address?: string;
    ensName?: string;
  };
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  toasts: Toast[];
  onDismissToast: (id: string) => void;
  hideFooter?: boolean;
}

export function Layout({
  children,
  wallet,
  onConnect,
  onDisconnect,
  isConnecting,
  theme,
  onToggleTheme,
  toasts,
  onDismissToast,
  hideFooter = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        wallet={wallet}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        isConnecting={isConnecting}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}

export default Layout;

