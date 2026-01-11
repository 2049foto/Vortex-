/**
 * Vortex Protocol - Root Layout
 * Optimized for Farcaster Mini Apps & Mobile
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0052FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export const metadata: Metadata = {
  title: 'Vortex Protocol | Multi-Chain Dust Consolidator',
  description: 'Turn worthless dust tokens into valuable ETH or USDC on Base. Scan 10+ chains, 20-layer risk analysis, gasless consolidation.',
  keywords: ['crypto', 'portfolio', 'consolidation', 'gasless', 'Base', 'DeFi', 'dust cleaner', 'token', 'swap', 'Farcaster'],
  authors: [{ name: 'Vortex Protocol' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vortex',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Vortex Protocol - Dust Token Consolidator',
    description: 'Turn worthless dust tokens into valuable ETH or USDC on Base. Scan 10+ chains in seconds.',
    url: APP_URL,
    siteName: 'Vortex Protocol',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Vortex Protocol - Multi-Chain Dust Consolidator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vortex Protocol - Turn Dust to Value',
    description: 'Consolidate worthless tokens into ETH on Base. Scan 10+ chains, gasless swaps.',
    images: [`${APP_URL}/og-image.png`],
    creator: '@VortexProtocol',
  },
  // Farcaster Frame v2 / Mini App metadata
  other: {
    // Frame v2 embed
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/og-image.png`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': '🌀 Scan Wallet',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': APP_URL,
    'fc:frame:button:2': '📊 Dashboard',
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': `${APP_URL}/dashboard`,
    // Mini App manifest reference
    'farcaster:manifest': `${APP_URL}/.well-known/farcaster.json`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Farcaster SDK for Mini Apps */}
        <script 
          src="https://cdn.farcaster.xyz/sdk/v0.0.25/farcaster.js" 
          defer
        />
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
