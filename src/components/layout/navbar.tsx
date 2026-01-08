'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Wallet, Menu, X, LayoutDashboard, ScanLine, 
  Layers, History, ChevronRight, Sparkles, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  isConnected: boolean;
  onConnect?: () => void;
  address?: string;
}

export function Navbar({ isConnected, onConnect, address }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Your overview' },
    { name: 'Scan', path: '/scan', icon: ScanLine, description: 'Scan portfolio' },
    { name: 'Consolidate', path: '/consolidate', icon: Layers, description: 'Swap tokens' },
    { name: 'History', path: '/history', icon: History, description: 'Past activity' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/30 px-4 sm:px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight hidden sm:block">Vortex</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {isConnected && navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white shadow-sm rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className={cn(
                    "relative z-10 flex items-center gap-2 transition-colors",
                    active ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-700"
                  )}>
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Grant Metrics - Always visible */}
            <Link href="/grant-metrics" className="hidden sm:flex">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 h-9 px-3 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">Metrics</span>
              </Button>
            </Link>

            {/* Connect Button */}
            <Button 
              onClick={onConnect}
              size="sm"
              className={cn(
                "h-9 rounded-xl font-semibold transition-all shadow-sm",
                isConnected 
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-0" 
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20"
              )}
            >
              {isConnected ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {address ? `${address.slice(0, 4)}...${address.slice(-3)}` : 'Connected'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect
                </span>
              )}
            </Button>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-3 right-3 z-50 md:hidden"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
                {/* Nav Links */}
                <div className="p-2">
                  {isConnected && navLinks.map((link) => {
                    const active = isActive(link.path);
                    return (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-all",
                          active 
                            ? "bg-indigo-50 text-indigo-600" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            active ? "bg-indigo-100" : "bg-slate-100"
                          )}>
                            <link.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{link.name}</div>
                            <div className="text-xs text-slate-400">{link.description}</div>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          active ? "text-indigo-400" : "text-slate-300"
                        )} />
                      </Link>
                    );
                  })}

                  {/* Grant Metrics Link */}
                  <Link
                    href="/grant-metrics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Grant Metrics</div>
                        <div className="text-xs text-slate-400">Public dashboard</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </div>

                {/* Connect Button */}
                {!isConnected && (
                  <div className="p-3 pt-0">
                    <Button 
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold"
                      onClick={() => {
                        onConnect?.();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
