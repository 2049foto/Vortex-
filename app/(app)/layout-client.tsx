'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  LayoutDashboard, 
  Settings, 
  History,
  Wallet,
  LogOut,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const NAV_ITEMS = [
  { href: '/scan', icon: Search, label: 'Scan' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
];

function useClipboard() {
  const [copied, setCopied] = useState(false);
  
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return { copied, copy };
}

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { copied, copy } = useClipboard();

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  if (!isConnected) {
    return (
      <>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect</span>
        </button>
        <WalletConnectModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => setShowModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-secondary btn-sm"
        style={{ paddingRight: '10px' }}
      >
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
          style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}
        >
          {address?.slice(2, 4)}
        </div>
        <span className="text-sm font-medium">{shortAddress}</span>
        <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
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
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 z-50"
            >
              <div 
                className="card"
                style={{ 
                  padding: 0,
                  boxShadow: '0 10px 40px hsl(var(--shadow-color) / 0.12)'
                }}
              >
                {/* Balance */}
                <div style={{ padding: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div className="text-xs mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    Balance
                  </div>
                  <div className="text-lg font-semibold">
                    {balance ? `${(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}
                  </div>
                </div>
                
                {/* Address */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <button
                    onClick={() => address && copy(address)}
                    className="flex items-center gap-2 w-full text-left"
                    style={{ color: 'hsl(var(--text-secondary))' }}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm font-mono">{shortAddress}</span>
                    <span className="text-xs ml-auto">
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
                
                {/* Actions */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => {
                      disconnect();
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left hover:bg-[hsl(var(--bg-tertiary))] transition-colors"
                    style={{ color: 'hsl(var(--danger))' }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh" style={{ background: 'hsl(var(--bg-secondary))' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
              style={{ background: 'hsl(var(--accent))', color: 'white' }}
            >
              V
            </div>
            <span className="font-semibold text-lg hidden sm:block">Vortex</span>
          </Link>
          
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ background: 'hsl(var(--bg-primary))' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
