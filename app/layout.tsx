/**
 * Vortex Protocol - Root Layout
 */

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Vortex Protocol | Premium Portfolio Hygiene Engine',
  description: 'Clean your crypto portfolio gaslessly. Consolidate dust tokens, identify risks, optimize your holdings on Base.',
  keywords: ['crypto', 'portfolio', 'consolidation', 'gasless', 'Base', 'DeFi'],
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

