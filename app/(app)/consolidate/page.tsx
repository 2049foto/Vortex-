/**
 * Vortex Protocol - Consolidate Page
 */

import { Suspense } from 'react';
import ConsolidateClient from './consolidate-client';

export const metadata = {
  title: 'Consolidate | Vortex Protocol',
  description: 'Consolidate your dust tokens into ETH or USDC, gasless on Base.',
};

function ConsolidateLoading() {
  return (
    <div className="page safe-top">
      <div className="container py-8">
        <div className="flex items-center justify-center py-20">
          <div className="vortex-spinner w-16 h-16" />
        </div>
      </div>
    </div>
  );
}

export default function ConsolidatePage() {
  return (
    <Suspense fallback={<ConsolidateLoading />}>
      <ConsolidateClient />
    </Suspense>
  );
}
