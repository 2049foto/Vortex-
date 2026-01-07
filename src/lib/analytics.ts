/**
 * Vortex Protocol - Analytics (PostHog)
 * Product analytics and user tracking
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

/**
 * Initialize PostHog analytics
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (!POSTHOG_KEY) {
    console.warn('PostHog key not configured');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    autocapture: true,
    disable_session_recording: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Disable in development
        posthog.opt_out_capturing();
      }
    },
  });

  isInitialized = true;
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (!isInitialized) return;
  posthog.capture(eventName, properties);
}

/**
 * Identify user
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, any>
) {
  if (!isInitialized) return;
  posthog.identify(userId, properties);
}

/**
 * Reset user identity
 */
export function resetUser() {
  if (!isInitialized) return;
  posthog.reset();
}

// ============================================
// VORTEX-SPECIFIC EVENTS
// ============================================

/**
 * Track wallet connection
 */
export function trackWalletConnected(address: string, walletType?: string) {
  trackEvent('wallet_connected', {
    address: address.slice(0, 10) + '...',
    wallet_type: walletType,
  });
}

/**
 * Track wallet scan
 */
export function trackScanStarted(address: string, chains: number[]) {
  trackEvent('scan_started', {
    chains_count: chains.length,
    chains,
  });
}

/**
 * Track scan completed
 */
export function trackScanCompleted(
  tokensFound: number,
  dustValue: number,
  riskTokens: number
) {
  trackEvent('scan_completed', {
    tokens_found: tokensFound,
    dust_value_usd: dustValue,
    risk_tokens: riskTokens,
  });
}

/**
 * Track consolidation started
 */
export function trackConsolidationStarted(
  tokensCount: number,
  estimatedValue: number,
  outputToken: string
) {
  trackEvent('consolidation_started', {
    tokens_count: tokensCount,
    estimated_value_usd: estimatedValue,
    output_token: outputToken,
  });
}

/**
 * Track consolidation completed
 */
export function trackConsolidationCompleted(
  actualValue: number,
  gasSaved: number,
  paymaster: string
) {
  trackEvent('consolidation_completed', {
    actual_value_usd: actualValue,
    gas_saved_usd: gasSaved,
    paymaster,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(feature: string, metadata?: Record<string, any>) {
  trackEvent('feature_used', {
    feature,
    ...metadata,
  });
}

export default {
  init: initAnalytics,
  track: trackEvent,
  identify: identifyUser,
  reset: resetUser,
  trackWalletConnected,
  trackScanStarted,
  trackScanCompleted,
  trackConsolidationStarted,
  trackConsolidationCompleted,
  trackFeatureUsed,
};

