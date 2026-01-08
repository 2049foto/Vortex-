/**
 * Vortex Protocol - App Layout Client Component
 * Contains all client-side logic with Wagmi hooks
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/layout/navbar';
import { WalletModal } from '@/components/wallet/wallet-modal';
import { BottomNav } from '@/components/layout/bottom-nav';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const handleConnect = () => {
    setIsWalletModalOpen(true);
  };

  const handleWalletSuccess = () => {
    setIsWalletModalOpen(false);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Check if we're on a page that needs bottom nav
  const showBottomNav = ['/dashboard', '/scan', '/consolidate', '/history'].includes(pathname);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar 
        isConnected={isConnected} 
        onConnect={handleConnect} 
        address={address} 
      />
      
      {/* Main content with padding for fixed navbar */}
      <main className="pt-20 pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <BottomNav 
          currentPath={pathname} 
          onNavigate={handleNavigate}
        />
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </div>
  );
}

export function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for WagmiProvider to be ready
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <LayoutContent>{children}</LayoutContent>;
}
