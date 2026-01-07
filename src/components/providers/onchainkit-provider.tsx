'use client';

/**
 * Vortex Protocol - OnchainKit Provider
 * Coinbase OnchainKit integration for checkout and wallet
 */

import { ReactNode } from 'react';
// OnchainKit will be available after package install
// import { OnchainKitProvider } from '@coinbase/onchainkit';
// import { base } from 'wagmi/chains';

interface OnchainKitProviderWrapperProps {
  children: ReactNode;
}

export function OnchainKitProviderWrapper({ children }: OnchainKitProviderWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  
  // Temporarily return children directly until OnchainKit is installed
  // Once installed, wrap with OnchainKitProvider
  
  /*
  return (
    <OnchainKitProvider
      apiKey={apiKey}
      chain={base}
      config={{
        appearance: {
          theme: 'light',
          mode: 'auto',
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
  */
  
  return <>{children}</>;
}

export default OnchainKitProviderWrapper;

