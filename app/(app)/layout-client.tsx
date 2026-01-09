'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - App Layout 2026
 * Mobile-first navigation with smart UX
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import {
  Home,
  Search,
  BarChart3,
  Clock,
  Wallet,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Settings,
  User,
  Layers,
  Sun,
  Moon
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

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };

  return { copied, copy };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
        <Layers className="w-5 h-5 text-white" />
      </div>
      <span className="font-bold text-lg hidden sm:block">Vortex</span>
    </Link>
  );
}

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const { copied, copy } = useClipboard();

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  if (!isConnected) {
    return (
      <button 
        onClick={() => connect({ connector: connectors[0] })}
        className="btn btn-primary btn-sm"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-secondary btn-sm"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent" />
        <span className="font-mono">{shortAddress}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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
              className="absolute right-0 top-full mt-2 w-64 card p-2 z-50"
            >
              {/* Address */}
              <div className="p-3 rounded-lg bg-card-hover mb-2">
                <div className="text-xs text-foreground-muted mb-1">Connected Wallet</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm flex-1 truncate">{address}</code>
                  <button 
                    onClick={() => copy(address!)}
                    className="btn btn-ghost btn-icon"
                    style={{ minHeight: 28, width: 28 }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Links */}
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
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-danger-bg text-danger transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Disconnect</span>
              </button>
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
    <nav className="bottom-nav md:hidden">
      <div className="container">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-foreground-muted'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-primary-muted' : ''}`}>
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
      <main className="flex-1">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}
