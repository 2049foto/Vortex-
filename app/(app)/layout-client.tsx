'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Search, 
  LayoutDashboard, 
  History,
  Wallet,
  ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/scan', icon: Search, label: 'Scan' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
];

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { open } = useAppKit();

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  if (!isConnected) {
    return (
      <button 
        onClick={() => open({ view: 'Connect' })}
        className="btn btn-primary btn-sm"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => open({ view: 'Account' })}
      className="btn btn-secondary btn-sm"
      style={{ paddingRight: '10px' }}
    >
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
        style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}
      >
        {address?.slice(2, 4)}
      </div>
      <span className="text-sm font-medium">
        {balance ? `${(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} ${balance.symbol}` : shortAddress}
      </span>
      <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
    </button>
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
