/**
 * Vortex Protocol - Landing Page Client Component
 * Contains all client-side logic with Wagmi hooks
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Landing } from '@/ui-components/landing';
import { WalletModal } from '@/components/wallet/wallet-modal';

export function LandingPageClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    if (isConnected) {
      router.push('/dashboard');
    } else {
      setIsWalletModalOpen(true);
    }
  };

  const handleWalletSuccess = () => {
    // After successful connection, redirect to dashboard
    router.push('/dashboard');
  };

  // Prevent hydration mismatch by not rendering until mounted
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

  return (
    <>
      <Landing
        onNavigate={(path) => router.push(path)}
        onConnect={handleConnect}
        isConnected={isConnected || false}
        address={address || undefined}
      />
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
}
