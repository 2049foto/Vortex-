/**
 * Vortex Protocol - Safe Cache Layer
 * Resilient caching with Redis + Memory fallback
 * NEVER fails - always returns gracefully
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { CACHE_TTL } from '../config/constants';

const logger = createLogger('cache');

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY CACHE - Always available fallback
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

// Clean expired entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug({ cleaned, remaining: memoryCache.size }, 'Memory cache cleanup');
    }
  }, 60_000); // Every minute
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

let redisClient: any = null;
let redisInitialized = false;

async function getRedisClient() {
  if (redisInitialized) return redisClient;
  
  redisInitialized = true;
  
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    logger.info('Redis not configured, using memory cache only');
    return null;
  }
  
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Test connection
    await redisClient.ping();
    logger.info('Redis connected successfully');
    
    return redisClient;
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed, using memory cache');
    return null;
  }
}

/**
 * Safe cache GET - Never throws, returns null on failure
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Start cleanup if not started
  startCleanupInterval();
  
  const prefixedKey = `vortex:${key}`;
  
  // Try memory cache first (faster)
  const memEntry = memoryCache.get(prefixedKey);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return memEntry.value as T;
  }
  
  // Try Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      const value = await redis.get(prefixedKey);
      if (value !== null && value !== undefined) {
        // Sync to memory cache
        const ttl = await redis.ttl(prefixedKey);
        if (ttl > 0) {
          memoryCache.set(prefixedKey, {
            value,
            expiresAt: Date.now() + (ttl * 1000),
          });
        }
        return typeof value === 'string' ? JSON.parse(value) : value;
      }
    }
  } catch (error) {
    logger.debug({ error, key }, 'Redis GET failed, memory cache miss');
  }
  
  return null;
}

/**
 * Safe cache SET - Never throws, silently fails
 */
export async function cacheSet(
  key: string, 
  value: any, 
  ttlSeconds: number = CACHE_TTL.RISK_SCORE
): Promise<void> {
  // Start cleanup if not started
  startCleanupInterval();
  
  const prefixedKey = `vortex:${key}`;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  
  // Always set in memory cache
  memoryCache.set(prefixedKey, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000),
  });
  
  // Try Redis (non-blocking)
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.setex(prefixedKey, ttlSeconds, serialized);
    }
  } catch (error) {
    logger.debug({ error, key }, 'Redis SET failed, using memory only');
  }
}

/**
 * Safe cache DELETE - Never throws
 */
export async function cacheDelete(key: string): Promise<void> {
  const prefixedKey = `vortex:${key}`;
  
  // Delete from memory
  memoryCache.delete(prefixedKey);
  
  // Try Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.del(prefixedKey);
    }
  } catch (error) {
    logger.debug({ error, key }, 'Redis DELETE failed');
  }
}

/**
 * Cache stats for debugging
 */
export function getCacheStats() {
  return {
    memorySize: memoryCache.size,
    redisConnected: !!redisClient,
  };
}

/**
 * Clear all memory cache (for testing)
 */
export function clearMemoryCache() {
  memoryCache.clear();
}

export default {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  stats: getCacheStats,
  clear: clearMemoryCache,
};
