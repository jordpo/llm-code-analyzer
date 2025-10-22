import crypto from 'crypto';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Simple in-memory cache for API responses
 * Reduces API costs by caching analysis results
 */
export class ResponseCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) { // Default: 1 hour
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from content
   */
  private generateKey(content: string, options?: Record<string, any>): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);

    if (options) {
      hash.update(JSON.stringify(options));
    }

    return hash.digest('hex');
  }

  /**
   * Get value from cache
   */
  get(content: string, options?: Record<string, any>): T | null {
    const key = this.generateKey(content, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(content: string, value: T, options?: Record<string, any>, ttl?: number): void {
    const key = this.generateKey(content, options);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(content: string, options?: Record<string, any>): boolean {
    return this.get(content, options) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    };
  }

  /**
   * Start automatic cleanup interval
   */
  startAutoCleanup(interval: number = 300000): NodeJS.Timeout { // Default: 5 minutes
    return setInterval(() => {
      this.cleanup();
    }, interval);
  }
}
