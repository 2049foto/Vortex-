'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  History
} from 'lucide-react';
import { WalletConnectButton } from '@/components/WalletConnectButton';

const NAV_ITEMS = [
  { href: '/scan', icon: Search, label: 'Scan' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'History' },
];

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
          
          <WalletConnectButton />
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
