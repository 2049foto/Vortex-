/**
 * Vortex Protocol - History Page
 */

import { Suspense } from 'react';
import HistoryClient from './history-client';

export const metadata = {
  title: 'History | Vortex Protocol',
  description: 'View your consolidation history and transaction records.',
};

function HistoryLoading() {
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

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryClient />
    </Suspense>
  );
}
