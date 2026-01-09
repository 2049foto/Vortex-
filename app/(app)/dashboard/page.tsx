/**
 * Vortex Protocol - Dashboard Page
 */

import { Suspense } from 'react';
import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Dashboard | Vortex Protocol',
  description: 'View your portfolio overview, analytics, and consolidation history.',
};

function DashboardLoading() {
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}
