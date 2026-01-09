'use client';

/**
 * Vortex Protocol - Cloudflare Turnstile Component
 * Bot protection with anti-loop mechanism
 * Updated: Jan 9, 2026 - Fixed verification loop issue
 */

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    __TURNSTILE_LOADED__?: boolean;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  tabindex?: number;
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

// Session storage key to prevent loops
const TURNSTILE_VERIFIED_KEY = 'vortex_turnstile_verified';
const TURNSTILE_TIMESTAMP_KEY = 'vortex_turnstile_timestamp';
const VERIFICATION_VALID_DURATION = 5 * 60 * 1000; // 5 minutes

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasRendered = useRef(false);
  const verificationAttempts = useRef(0);
  const maxAttempts = 3;

  // Check if already verified recently (prevent loop)
  const isRecentlyVerified = useCallback(() => {
    try {
      const verified = sessionStorage.getItem(TURNSTILE_VERIFIED_KEY);
      const timestamp = sessionStorage.getItem(TURNSTILE_TIMESTAMP_KEY);
      
      if (verified === 'true' && timestamp) {
        const elapsed = Date.now() - parseInt(timestamp, 10);
        return elapsed < VERIFICATION_VALID_DURATION;
      }
    } catch {
      // sessionStorage not available
    }
    return false;
  }, []);

  // Mark as verified
  const markVerified = useCallback(() => {
    try {
      sessionStorage.setItem(TURNSTILE_VERIFIED_KEY, 'true');
      sessionStorage.setItem(TURNSTILE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // sessionStorage not available
    }
  }, []);

  // Don't render if siteKey is empty or already verified
  if (!siteKey || siteKey.trim() === '') {
    return null;
  }

  // Skip if recently verified (prevents loop)
  useEffect(() => {
    if (isRecentlyVerified()) {
      // Auto-pass if recently verified
      onVerify('session_cached');
    }
  }, [isRecentlyVerified, onVerify]);

  const loadScript = useCallback(() => {
    // Prevent multiple script loads
    if (window.__TURNSTILE_LOADED__ || document.querySelector('script[src*="turnstile"]')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__TURNSTILE_LOADED__ = true;
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Turnstile script - proceeding without verification');
      setIsLoaded(false);
      // Call onVerify anyway to not block the user
      onVerify('script_load_failed');
    };
    document.head.appendChild(script);
  }, [onVerify]);

  useEffect(() => {
    if (!siteKey || siteKey.trim() === '') return;
    if (isRecentlyVerified()) return; // Skip if already verified
    loadScript();
  }, [loadScript, siteKey, isRecentlyVerified]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;
    if (!siteKey || siteKey.trim() === '') return;
    if (hasRendered.current) return; // Prevent re-render
    if (isRecentlyVerified()) return; // Skip if already verified

    // Clean up existing widget
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore cleanup errors
      }
    }

    try {
      hasRendered.current = true;
      
      // Render widget with anti-loop settings
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          markVerified();
          onVerify(token);
        },
        'error-callback': () => {
          verificationAttempts.current++;
          
          // After max attempts, just proceed
          if (verificationAttempts.current >= maxAttempts) {
            console.warn('Turnstile max attempts reached - proceeding without verification');
            markVerified(); // Prevent further loops
            onVerify('max_attempts_reached');
            return;
          }
          
          onError?.();
        },
        'expired-callback': () => {
          // Don't trigger loop on expiry
          onExpire?.();
        },
        theme,
        size,
        retry: 'never', // Disable auto-retry to prevent loops
        'refresh-expired': 'never', // Don't auto-refresh
      });
    } catch (error) {
      console.error('Turnstile render error:', error);
      // Proceed without blocking
      onVerify('render_error');
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [isLoaded, siteKey, onVerify, onError, onExpire, theme, size, markVerified, isRecentlyVerified]);

  // If already verified, don't show widget
  if (isRecentlyVerified()) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}

// Hook for invisible Turnstile
export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    
    // For invisible mode, we need to trigger verification
    // This is a simplified implementation
    return new Promise<string>((resolve, reject) => {
      // In production, you'd use the invisible widget
      setTimeout(() => {
        setIsVerifying(false);
        reject(new Error('Use visible Turnstile component'));
      }, 100);
    });
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  return {
    token,
    error,
    isVerifying,
    verify,
    reset,
    setToken,
  };
}

export default Turnstile;

