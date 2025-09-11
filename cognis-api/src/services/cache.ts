import { CACHE_CONFIG } from '../config/env.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Simple in-memory cache implementation
 * In production, you would use Redis or a similar distributed cache
 */
interface CacheEntry<T> {
  value: T;
  expires: number; // Expiry timestamp
}

/**
 * Cache service for improving API performance
 */
export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTtl: number; // Time to live in seconds
  
  constructor() {
    this.cache = new Map<string, CacheEntry<any>>();
    this.defaultTtl = CACHE_CONFIG.ttl;
    
    // Set up cache cleanup interval
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Clean up every minute
  }
  
  /**
   * Generate a cache key from arbitrary input
   */
  createKey(input: any): string {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('md5').update(inputStr).digest('hex');
  }
  
  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresIn = ttl || this.defaultTtl; // Default TTL if not specified
    const expires = Date.now() + expiresIn * 1000;
    
    this.cache.set(key, { value, expires });
    logger.debug({ key, ttl: expiresIn }, 'Item added to cache');
  }
  
  /**
   * Get a value from the cache
   * Returns null if the key doesn't exist or is expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    // Return null if entry doesn't exist
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      logger.debug({ key }, 'Expired cache item removed');
      return null;
    }
    
    logger.debug({ key }, 'Cache hit');
    return entry.value as T;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove a key from the cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug({ key }, 'Item removed from cache');
    }
    return result;
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }
  
  /**
   * Get the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Get a value from the cache, or compute it if not present
   */
  async getOrSet<T>(key: string, producer: () => Promise<T>, ttl?: number): Promise<T> {
    // Try to get from cache first
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Not in cache, compute the value
    logger.debug({ key }, 'Cache miss, computing value');
    const value = await producer();
    this.set(key, value, ttl);
    
    return value;
  }
  
  /**
   * Remove expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug({ expiredCount }, 'Expired cache entries removed');
    }
  }
  
  /**
   * Get cache stats
   */
  getStats(): { size: number, memoryUsage: number } {
    // Estimate memory usage (very rough approximation)
    let memoryUsage = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // Key size in bytes (rough UTF-16 estimate)
      
      // Rough size estimate of value
      const valueStr = JSON.stringify(entry.value);
      memoryUsage += valueStr.length * 2; // Value size in bytes (rough UTF-16 estimate)
      memoryUsage += 8; // For the expires timestamp (64-bit number)
    }
    
    return {
      size: this.cache.size,
      memoryUsage
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
