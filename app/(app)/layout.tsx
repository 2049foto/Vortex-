/**
 * Vortex Protocol - App Layout
 * Server component wrapper for authenticated app routes
 */

import LayoutClient from './layout-client';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutClient>{children}</LayoutClient>;
}
