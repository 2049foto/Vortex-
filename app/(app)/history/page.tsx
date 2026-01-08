/**
 * Vortex Protocol - History Page
 * Server component wrapper
 */

import { HistoryPageClient } from './history-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  return <HistoryPageClient />;
}
