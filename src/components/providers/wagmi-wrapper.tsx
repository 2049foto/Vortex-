/**
 * Vortex Protocol - Wagmi Wrapper
 * Ensures WagmiProvider is ready before rendering children
 */

'use client';

import { useEffect, useState } from 'react';
import { useConfig } from 'wagmi';

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [wagmiReady, setWagmiReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Try to access Wagmi config to verify provider is ready
  try {
    useConfig();
    if (mounted && !wagmiReady) {
      setWagmiReady(true);
    }
  } catch (error) {
    // WagmiProvider not ready yet
    if (mounted && wagmiReady) {
      setWagmiReady(false);
    }
  }

  if (!mounted || !wagmiReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing wallet...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
