/**
 * Vortex Protocol - Dashboard Page
 * Server component wrapper
 */

import { DashboardPageClient } from './dashboard-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardPageClient />;
}
