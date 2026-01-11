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
// MEMORY CACHE - LRU with max size limit
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_MEMORY_CACHE_SIZE = 1000; // Maximum entries to prevent unbounded growth
const LRU_EVICTION_COUNT = 100;      // Number of entries to evict when full

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
  lastAccessed: number; // For LRU tracking
}

const memoryCache = new Map<string, MemoryCacheEntry>();

// Clean expired entries and enforce size limit
let cleanupInterval: NodeJS.Timeout | null = null;

function evictLRU() {
  if (memoryCache.size <= MAX_MEMORY_CACHE_SIZE) return;
  
  // Convert to array and sort by lastAccessed (oldest first)
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // Evict oldest entries
  const toEvict = Math.min(LRU_EVICTION_COUNT, entries.length - MAX_MEMORY_CACHE_SIZE);
  for (let i = 0; i < toEvict; i++) {
    memoryCache.delete(entries[i][0]);
  }
  
  logger.debug({ evicted: toEvict, remaining: memoryCache.size }, 'LRU eviction');
}

function startCleanupInterval() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean expired entries
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) {
        memoryCache.delete(key);
        cleaned++;
      }
    }
    
    // Enforce size limit
    evictLRU();
    
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
    // Update LRU timestamp
    memEntry.lastAccessed = Date.now();
    return memEntry.value as T;
  } else if (memEntry) {
    // Expired - remove it
    memoryCache.delete(prefixedKey);
  }
  
  // Try Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      const value = await redis.get(prefixedKey);
      if (value !== null && value !== undefined) {
        // Sync to memory cache with LRU tracking
        const ttl = await redis.ttl(prefixedKey);
        if (ttl > 0) {
          const now = Date.now();
          memoryCache.set(prefixedKey, {
            value,
            expiresAt: now + (ttl * 1000),
            lastAccessed: now,
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
  const now = Date.now();
  
  // Enforce size limit before adding
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE && !memoryCache.has(prefixedKey)) {
    evictLRU();
  }
  
  // Always set in memory cache with LRU tracking
  memoryCache.set(prefixedKey, {
    value,
    expiresAt: now + (ttlSeconds * 1000),
    lastAccessed: now,
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
