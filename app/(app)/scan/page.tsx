/**
 * Vortex Protocol - Scan Page
 * Server component wrapper
 */

import { ScanPageClient } from './scan-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function ScanPage() {
  return <ScanPageClient />;
}
