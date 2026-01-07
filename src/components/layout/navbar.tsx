'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, Sparkles, LayoutDashboard, History, ScanLine, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  isConnected: boolean;
  onConnect: () => void;
  address?: string;
}

export function Navbar({ isConnected, onConnect, address }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scan', path: '/scan', icon: ScanLine },
    { name: 'Consolidate', path: '/consolidate', icon: Layers },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <>
      <nav 
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl rounded-full border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg shadow-indigo-900/5 transition-all duration-300 animate-in slide-in-from-top"
      >
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">Vortex</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
            {isConnected && navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "relative px-5 py-2 rounded-full text-sm font-medium transition-all",
                    isActive && "bg-white shadow-sm border border-black/5"
                  )}
                >
                  <span className={cn(
                    "relative z-10 flex items-center gap-2 transition-colors",
                    isActive ? "text-indigo-600 font-semibold" : "text-slate-500 hover:text-slate-900"
                  )}>
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant={isConnected ? "outline" : "premium"}
              size="sm"
              onClick={onConnect}
              className={cn("rounded-full font-medium", isConnected ? "bg-white/50 border-slate-200" : "")}
            >
              {isConnected ? (
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-24 left-4 right-4 z-40 p-4 rounded-3xl border border-white/20 bg-white/90 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top duration-200">
          <div className="space-y-2">
            {isConnected && navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium p-4 rounded-2xl hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <link.icon className="w-5 h-5" />
                </div>
                {link.name}
              </Link>
            ))}
            <Button 
              className="w-full h-12 rounded-xl text-lg mt-4" 
              variant={isConnected ? "outline" : "premium"}
              onClick={() => {
                onConnect();
                setIsMobileMenuOpen(false);
              }}
            >
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
