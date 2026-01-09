/**
 * Vortex Protocol - Scan Page
 */

import { Suspense } from 'react';
import ScanClient from './scan-client';

export const metadata = {
  title: 'Scan Wallet | Vortex Protocol',
  description: 'Scan your wallet for dust tokens across 11 chains with AI-powered risk scoring.',
};

function ScanLoading() {
  return (
    <div className="page safe-top">
      <div className="container py-8">
        <div className="card p-8 max-w-xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="vortex-spinner w-16 h-16 mb-4" />
            <div className="text-foreground-muted">Loading scanner...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanLoading />}>
      <ScanClient />
    </Suspense>
  );
}
