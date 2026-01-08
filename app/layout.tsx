/**
 * Vortex Protocol - Root Layout
 */

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Vortex Protocol | Premium Portfolio Hygiene Engine',
  description: 'Clean your crypto portfolio gaslessly. Consolidate dust tokens, identify risks, optimize your holdings on Base.',
  keywords: ['crypto', 'portfolio', 'consolidation', 'gasless', 'Base', 'DeFi', 'dust cleaner', 'token', 'swap'],
  authors: [{ name: 'Vortex Protocol' }],
  openGraph: {
    title: 'Vortex Protocol',
    description: 'Premium Portfolio Hygiene Engine - Gasless Consolidator',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Vortex Protocol',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vortex Protocol',
    description: 'Premium Portfolio Hygiene Engine',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
  },
  // Farcaster Frame v2 metadata
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_APP_URL || 'https://vortex.build'}/og-image.png`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': '🌀 Clean Portfolio',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_APP_URL || 'https://vortex.build'}`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

