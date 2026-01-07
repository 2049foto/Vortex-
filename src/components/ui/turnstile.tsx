'use client';

/**
 * Vortex Protocol - Cloudflare Turnstile Component
 * Bot protection for public endpoints
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

  const loadScript = useCallback(() => {
    if (document.querySelector('script[src*="turnstile"]')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

    // Clean up existing widget
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    // Render new widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
      theme,
      size,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [isLoaded, siteKey, onVerify, onError, onExpire, theme, size]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const getResponse = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return undefined;
  }, []);

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

