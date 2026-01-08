/**
 * Vortex Protocol - App Layout
 * Shared layout for authenticated/app pages with Navbar, WalletModal, and Bottom Nav
 */

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/layout/navbar';
import { WalletModal } from '@/components/wallet/wallet-modal';
import { BottomNav } from '@/components/layout/bottom-nav';

// Force dynamic rendering to prevent pre-rendering issues with Wagmi
// Note: revalidate cannot be exported from client components
export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
