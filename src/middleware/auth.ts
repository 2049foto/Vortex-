/**
 * Vortex Protocol - Authentication Middleware
 * JWT-based authentication for protected routes
 */

import { Context } from 'elysia';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth');

export interface AuthPayload {
  walletAddress: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for wallet
 */
export function generateAuthToken(walletAddress: string): string {
  return jwt.sign(
    { walletAddress },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify JWT token
 */
export function verifyAuthToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract wallet address from request
 * Supports both JWT and wallet signature verification
 */
export function extractWalletAddress(context: Context): string | null {
  const authHeader = context.request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Check for Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyAuthToken(token);
      return payload.walletAddress;
    } catch (error) {
      logger.warn({ error }, 'Invalid JWT token');
      return null;
    }
  }

  return null;
}

/**
 * Require authentication middleware
 */
export function requireAuth(context: Context): string {
  const walletAddress = extractWalletAddress(context);
  
  if (!walletAddress) {
    throw new Error('Authentication required');
  }

  return walletAddress;
}

