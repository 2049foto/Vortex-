/**
 * Vortex Protocol - Landing Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { Landing } from '../src/ui-components/landing';

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    if (isConnected) {
      router.push('/dashboard');
    } else {
      // Try Coinbase Wallet first, then WalletConnect
      const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
      const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');
      
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      } else if (walletConnectConnector) {
        connect({ connector: walletConnectConnector });
      } else if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
    }
  };

  return (
    <Landing
      onNavigate={(path) => router.push(path)}
      onConnect={handleConnect}
      isConnected={isConnected}
      address={address}
    />
  );
}

