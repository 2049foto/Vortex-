/**
 * Vortex Protocol - Rate Limiting Middleware
 * Using Upstash Redis for distributed rate limiting
 */

import { Context } from 'elysia';
import { Redis } from '@upstash/redis';
import { env } from '../config/env';
import { RATE_LIMITS } from '../config/constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('rateLimit');

// Initialize Redis client
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client identifier (IP or wallet)
 */
function getClientId(context: Context): string {
  // Try wallet address first
  const authHeader = context.request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return `wallet:${authHeader.substring(7)}`;
  }

  // Fall back to IP
  const forwardedFor = context.request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || context.request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Check rate limit for endpoint
 */
export async function checkRateLimit(
  context: Context,
  limitType: RateLimitType
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limit = RATE_LIMITS[limitType];
  const clientId = getClientId(context);
  const key = `ratelimit:${limitType}:${clientId}`;
  const now = Date.now();
  const windowStart = now - limit.windowMs;

  try {
    // Use Redis sorted set for sliding window
    const pipe = redis.pipeline();
    
    // Remove old entries
    pipe.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    pipe.zcard(key);
    
    // Add current request
    pipe.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    
    // Set expiry
    pipe.expire(key, Math.ceil(limit.windowMs / 1000));
    
    const results = await pipe.exec();
    const count = (results[1] as number) || 0;
    
    const allowed = count < limit.max;
    const remaining = Math.max(0, limit.max - count - 1);
    const resetAt = now + limit.windowMs;

    if (!allowed) {
      logger.warn({ clientId, limitType, count }, 'Rate limit exceeded');
    }

    return { allowed, remaining, resetAt };
  } catch (error) {
    logger.error({ error, clientId, limitType }, 'Rate limit check failed');
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: limit.max, resetAt: now + limit.windowMs };
  }
}

/**
 * Rate limit middleware
 */
export function rateLimitMiddleware(limitType: RateLimitType) {
  return async (context: Context) => {
    const result = await checkRateLimit(context, limitType);
    
    // Add rate limit headers
    context.set.headers['X-RateLimit-Limit'] = RATE_LIMITS[limitType].max.toString();
    context.set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
    context.set.headers['X-RateLimit-Reset'] = result.resetAt.toString();
    
    if (!result.allowed) {
      context.set.status = 429;
      return {
        error: 'Too many requests',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      };
    }
  };
}

