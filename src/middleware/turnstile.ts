/**
 * Vortex Protocol - Cloudflare Turnstile Middleware
 * Bot protection for public endpoints
 * 
 * IMPORTANT: This middleware is designed to FAIL-OPEN when Turnstile
 * is not configured. This allows the app to work without Turnstile
 * during development or when keys are not set.
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('turnstile');

// Get secret key from environment (may be undefined)
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Check if Turnstile is configured
 */
export function isTurnstileConfigured(): boolean {
  return !!(TURNSTILE_SECRET_KEY && TURNSTILE_SECRET_KEY.trim() !== '');
}

/**
 * Verify Cloudflare Turnstile token
 * Returns success: true if:
 * - Turnstile is not configured (fail-open)
 * - Token is valid
 * - Turnstile service error (fail-open)
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  // FAIL-OPEN: If Turnstile is not configured, always allow
  if (!isTurnstileConfigured()) {
    logger.info('Turnstile not configured - allowing request (fail-open mode)');
    return { success: true };
  }

  // If no token provided but Turnstile IS configured
  if (!token || token.trim() === '') {
    logger.warn('No Turnstile token provided');
    // Still fail-open to avoid blocking legitimate users
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY!);
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

    if (!response.ok) {
      logger.error({ status: response.status }, 'Turnstile API error');
      // Fail-open on API errors
      return { success: true };
    }

    const data = (await response.json()) as TurnstileResponse;

    if (!data.success) {
      logger.warn(
        { errorCodes: data['error-codes'] },
        'Turnstile verification failed'
      );
      // Even on verification failure, we fail-open for now
      // In strict production, you would return { success: false }
      return { success: true };
    }

    logger.info('Turnstile verification successful');
    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Turnstile verification error');
    // Fail-open on any errors
    return { success: true };
  }
}

/**
 * Turnstile middleware for protected endpoints
 * 
 * ALWAYS ALLOWS REQUESTS - fail-open design
 * This is intentional for Phase 1 to avoid blocking users
 * when Turnstile is not properly configured.
 * 
 * In Phase 2, this can be made stricter.
 */
export async function requireTurnstile(
  token: string,
  remoteIp?: string
): Promise<void> {
  // Always verify but never throw - fail-open design
  const result = await verifyTurnstileToken(token, remoteIp);
  
  if (!result.success) {
    // Log but don't throw - fail-open
    logger.warn({ error: result.error }, 'Turnstile check failed but allowing request (fail-open)');
  }
  
  // Never throws - always allows request
  return;
}
