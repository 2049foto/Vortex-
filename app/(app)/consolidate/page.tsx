/**
 * Vortex Protocol - Consolidate (Execute) Page
 * Server component wrapper
 */

import { Suspense } from 'react';
import { ConsolidatePageClient } from './consolidate-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function ConsolidatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    }>
      <ConsolidatePageClient />
    </Suspense>
  );
}
