/**
 * Vortex Protocol - Landing Page
 * Server component wrapper to prevent pre-rendering
 */

import { LandingPageClient } from './landing-client';

// Force dynamic rendering - must be exported from server component
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <LandingPageClient />;
}
