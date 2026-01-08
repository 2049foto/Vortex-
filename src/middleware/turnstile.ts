/**
 * Vortex Protocol - Cloudflare Turnstile Middleware
 * Bot protection for public endpoints
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('turnstile');

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: 'Turnstile token is required' };
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    logger.warn('TURNSTILE_SECRET_KEY is not configured, skipping verification');
    // Fail open if Turnstile is not configured
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = (await response.json()) as TurnstileResponse;

    if (!data.success) {
      logger.warn(
        { errorCodes: data['error-codes'] },
        'Turnstile verification failed'
      );
      return {
        success: false,
        error: 'Bot verification failed. Please try again.',
      };
    }

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Turnstile verification error');
    // Fail open in case of Turnstile service issues
    return { success: true };
  }
}

/**
 * Turnstile middleware for protected endpoints
 * Fail-open if Turnstile is not configured (development mode)
 */
export async function requireTurnstile(
  token: string,
  remoteIp?: string
): Promise<void> {
  // If Turnstile is not configured, allow request (fail-open for development)
  if (!env.TURNSTILE_SECRET_KEY) {
    logger.warn('TURNSTILE_SECRET_KEY not configured, allowing request (fail-open)');
    return;
  }

  // If no token provided but Turnstile is configured, fail
  if (!token || token.trim() === '') {
    // In production, this should fail. In development, we can be lenient
    if (env.NODE_ENV === 'production') {
      throw new Error('Turnstile token is required');
    }
    logger.warn('No Turnstile token provided, allowing request (development mode)');
    return;
  }

  const result = await verifyTurnstileToken(token, remoteIp);
  
  if (!result.success) {
    throw new Error(result.error || 'Bot verification failed');
  }
}

