/**
 * Vortex Protocol - App Layout
 * Server component wrapper to prevent pre-rendering
 */

import { AppLayoutClient } from './layout-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
