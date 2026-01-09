'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - App Layout 2026
 * Mobile-first navigation with smart UX
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useWalletModal } from '../providers';
import {
  Home,
  Search,
  Clock,
  Wallet,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Settings,
  Layers,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/scan', label: 'Scan', icon: Search },
  { href: '/history', label: 'History', icon: Clock },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }, [timeout]);

  return { copied, copy };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-105 transition-transform">
        <Layers className="w-5 h-5 text-white" />
      </div>
      <span className="font-bold text-lg hidden sm:block">Vortex</span>
    </Link>
  );
}

function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open: openWalletModal } = useWalletModal();
  const { data: balance } = useBalance({ address });
  const [showDropdown, setShowDropdown] = useState(false);
  const { copied, copy } = useClipboard();

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  const formattedBalance = balance 
    ? `${(Number(balance.value) / 10**balance.decimals).toFixed(4)} ${balance.symbol}`
    : '0.0000 ETH';

  if (!isConnected) {
    return (
      <button 
        onClick={openWalletModal}
        className="btn btn-primary btn-sm group"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect</span>
        <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
          {address?.slice(2, 4).toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium font-mono">{shortAddress}</div>
          <div className="text-xs text-foreground-muted">{formattedBalance}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="p-4 bg-card-hover border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                    {address?.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{shortAddress}</div>
                    <div className="text-xs text-foreground-muted">
                      {chain?.name || 'Unknown Network'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                  <code className="text-xs flex-1 truncate text-foreground-muted">{address}</code>
                  <button 
                    onClick={() => copy(address!)}
                    className="p-1.5 rounded-md hover:bg-card-hover transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-foreground-muted" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="p-4 border-b border-border">
                <div className="text-xs text-foreground-muted mb-1">Balance</div>
                <div className="text-lg font-semibold">{formattedBalance}</div>
              </div>

              {/* Links */}
              <div className="p-2">
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-hover transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm">View on Explorer</span>
                </a>

                <Link
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-hover transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm">Settings</span>
                </Link>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    disconnect();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
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

function TopNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-muted text-primary' 
                      : 'text-foreground-secondary hover:text-foreground hover:bg-card-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <WalletButton />
        </div>
      </div>
    </header>
  );
}

function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="container">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors min-w-[64px] ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-foreground-muted'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary-muted' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}
