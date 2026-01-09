/**
 * Vortex Protocol - Landing Page
 * Premium Portfolio Hygiene Engine
 */

import LandingClient from './landing-client';

export const metadata = {
  title: 'Vortex Protocol | Clean Your Crypto Dust Across 11 Chains',
  description: 'Premium Portfolio Hygiene Engine. Scan your wallet, identify dust & risky tokens with AI-powered risk scoring, and consolidate everything into usable ETH — gasless on Base.',
  openGraph: {
    title: 'Vortex Protocol | Clean Your Crypto Dust',
    description: 'Scan 11 chains, AI risk scoring, gasless consolidation on Base.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vortex Protocol | Portfolio Hygiene',
    description: 'Clean your crypto dust across 11 chains, gasless on Base.',
  },
};

export default function HomePage() {
  return <LandingClient />;
}
