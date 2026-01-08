/**
 * Header component for VORTEX PROTOCOL
 * Global navigation with logo, links, status pill, and wallet connect
 * Mobile-responsive with hamburger menu
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '../WalletConnect';
import { cn } from '../../utils/cn';

interface HeaderProps {
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
}

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Scan', href: '/scan' },
  { label: 'Docs', href: 'https://docs.vortex.xyz', isExternal: true },
];

export function Header({
  wallet,
  onConnect,
  onDisconnect,
  isConnecting,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">VORTEX</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              link.isExternal ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Status Pill - Desktop */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-xs font-medium text-accent">Operational</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Wallet Connect - Desktop */}
            <div className="hidden sm:block">
              <WalletConnect
                isConnected={wallet.isConnected}
                address={wallet.address}
                ensName={wallet.ensName}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                isConnecting={isConnecting}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Status Pill - Mobile */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 w-fit">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">System Operational</span>
              </div>

              {/* Nav Links */}
              <nav className="space-y-1">
                {navLinks.map(link => (
                  link.isExternal ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-colors min-h-[44px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="font-medium">{link.label}</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-xl hover:bg-muted transition-colors min-h-[44px] font-medium',
                        pathname === link.href && 'bg-muted'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>

              {/* Wallet Connect - Mobile */}
              <div className="pt-2 border-t border-border">
                <WalletConnect
                  isConnected={wallet.isConnected}
                  address={wallet.address}
                  ensName={wallet.ensName}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  isConnecting={isConnecting}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;

