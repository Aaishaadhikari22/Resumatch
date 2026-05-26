/**
 * API Response Cache Utility
 * Caches API responses to reduce redundant network requests
 */

class APICache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
    this.timers = new Map();
  }

  /**
   * Get cached response
   * @param {string} key - Cache key (usually the URL)
   * @returns {any} Cached data or null if expired
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} maxAge - Optional custom max age in ms
   */
  set(key, data, maxAge = null) {
    const age = maxAge || this.maxAge;

    // Clear old timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Auto-cleanup after maxAge
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, age);

    this.timers.set(key, timer);
  }

  /**
   * Clear specific cache entry
   */
  clear(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Check if key is cached
   */
  has(key) {
    return this.get(key) !== null;
  }
}

// Cache instances for different types of data
export const dashboardCache = new APICache(5 * 60 * 1000); // 5 min
export const jobsCache = new APICache(10 * 60 * 1000); // 10 min
export const userProfileCache = new APICache(15 * 60 * 1000); // 15 min
export const recommendationsCache = new APICache(5 * 60 * 1000); // 5 min

export default APICache;
