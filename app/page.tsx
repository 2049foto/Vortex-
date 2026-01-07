/**
 * Vortex Protocol - Landing Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { Landing } from '../src/ui-components/landing';

export default function HomePage() {
  const router = useRouter();

  return (
    <Landing
      onNavigate={(path) => router.push(path)}
      onConnect={() => {
        // Web3 connect logic handled by Providers
      }}
      isConnected={false}
    />
  );
}

