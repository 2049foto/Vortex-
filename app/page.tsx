/**
 * Vortex Protocol - Landing Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Landing } from '@/ui-components/landing';
import { WalletModal } from '@/components/wallet/wallet-modal';

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

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

  return (
    <>
      <Landing
        onNavigate={(path) => router.push(path)}
        onConnect={handleConnect}
        isConnected={isConnected}
        address={address}
      />
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
}

