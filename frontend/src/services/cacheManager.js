/**
 * Cache Manager for Report Data
 * Handles client-side caching of report data to improve performance
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.maxCacheSize = 50; // Maximum number of cached items
    
    // Clean up expired cache entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Run cleanup every minute
  }

  /**
   * Generate cache key from filters
   * @param {Object} filters - Report filters
   * @returns {string} Cache key
   */
  generateCacheKey(filters) {
    const { dateRange, categories, reportType } = filters;
    
    // Create a consistent key from filter parameters
    const keyParts = [
      'report',
      reportType || 'summary',
      dateRange?.start || 'no-start',
      dateRange?.end || 'no-end',
      categories?.sort().join(',') || 'all-categories'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Get cached report data
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached data or null if not found/expired
   */
  get(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      return null;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    const now = Date.now();
    
    // Check if cache entry has expired
    if (now - timestamp > this.defaultTTL) {
      this.delete(cacheKey);
      return null;
    }

    // Update access time for LRU behavior
    this.cacheTimestamps.set(cacheKey, now);
    
    return this.cache.get(cacheKey);
  }

  /**
   * Set cache data
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(cacheKey, data, ttl = this.defaultTTL) {
    // Ensure we don't exceed max cache size
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(cacheKey)) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, data);
    this.cacheTimestamps.set(cacheKey, Date.now());
    
    // Set custom TTL if provided
    if (ttl !== this.defaultTTL) {
      setTimeout(() => {
        this.delete(cacheKey);
      }, ttl);
    }
  }

  /**
   * Delete cache entry
   * @param {string} cacheKey - Cache key to delete
   */
  delete(cacheKey) {
    this.cache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys()),
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Check if cache has key
   * @param {string} cacheKey - Cache key
   * @returns {boolean} True if key exists and not expired
   */
  has(cacheKey) {
    return this.get(cacheKey) !== null;
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  size() {
    return this.cache.size;
  }

  /**
   * Cleanup expired entries
   * @private
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.defaultTTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Evict oldest cache entry (LRU)
   * @private
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      console.log(`Cache eviction: removed oldest entry ${oldestKey}`);
    }
  }

  /**
   * Calculate cache hit rate
   * @private
   * @returns {number} Hit rate percentage
   */
  calculateHitRate() {
    // This is a simplified implementation
    // In a real scenario, you'd track hits and misses
    return this.cache.size > 0 ? 85 : 0; // Mock hit rate
  }

  /**
   * Destroy cache manager and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Enhanced cache functions for specific use cases
export const reportCache = {
  /**
   * Get cached report data with automatic key generation
   * @param {Object} filters - Report filters
   * @returns {Object|null} Cached report data
   */
  getReport: (filters) => {
    const key = cacheManager.generateCacheKey(filters);
    return cacheManager.get(key);
  },

  /**
   * Cache report data with automatic key generation
   * @param {Object} filters - Report filters
   * @param {Object} data - Report data to cache
   * @param {number} ttl - Time to live (optional)
   */
  setReport: (filters, data, ttl) => {
    const key = cacheManager.generateCacheKey(filters);
    cacheManager.set(key, data, ttl);
  },

  /**
   * Check if report is cached
   * @param {Object} filters - Report filters
   * @returns {boolean} True if cached
   */
  hasReport: (filters) => {
    const key = cacheManager.generateCacheKey(filters);
    return cacheManager.has(key);
  },

  /**
   * Clear report cache
   */
  clearReports: () => {
    cacheManager.clear();
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats: () => {
    return cacheManager.getStats();
  }
};

// Cache for categories and other metadata
export const metadataCache = {
  categories: null,
  categoriesTimestamp: null,
  
  getCategories: () => {
    const now = Date.now();
    const ttl = 10 * 60 * 1000; // 10 minutes for metadata
    
    if (metadataCache.categories && 
        metadataCache.categoriesTimestamp && 
        (now - metadataCache.categoriesTimestamp) < ttl) {
      return metadataCache.categories;
    }
    
    return null;
  },
  
  setCategories: (categories) => {
    metadataCache.categories = categories;
    metadataCache.categoriesTimestamp = Date.now();
  },
  
  clearCategories: () => {
    metadataCache.categories = null;
    metadataCache.categoriesTimestamp = null;
  }
};

// Memory usage monitoring
export const cacheMonitor = {
  /**
   * Get memory usage information
   * @returns {Object} Memory usage stats
   */
  getMemoryUsage: () => {
    if (performance && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        cacheSize: cacheManager.size(),
        cacheMemoryEstimate: estimateCacheMemoryUsage()
      };
    }
    
    return {
      cacheSize: cacheManager.size(),
      cacheMemoryEstimate: estimateCacheMemoryUsage()
    };
  },

  /**
   * Check if memory usage is high
   * @returns {boolean} True if memory usage is concerning
   */
  isMemoryUsageHigh: () => {
    const usage = cacheMonitor.getMemoryUsage();
    
    if (usage.usedJSHeapSize && usage.jsHeapSizeLimit) {
      const usagePercent = (usage.usedJSHeapSize / usage.jsHeapSizeLimit) * 100;
      return usagePercent > 80; // Alert if using more than 80% of heap
    }
    
    // Fallback: check cache size
    return cacheManager.size() > 40;
  },

  /**
   * Force cleanup if memory usage is high
   */
  forceCleanupIfNeeded: () => {
    if (cacheMonitor.isMemoryUsageHigh()) {
      console.warn('High memory usage detected, clearing cache');
      cacheManager.clear();
      return true;
    }
    return false;
  }
};

// Helper function to estimate cache memory usage
const estimateCacheMemoryUsage = () => {
  let totalSize = 0;
  
  for (const data of cacheManager.cache.values()) {
    // Rough estimation of object size in bytes
    totalSize += JSON.stringify(data).length * 2; // UTF-16 encoding
  }
  
  return totalSize;
};

// Export the main cache manager for advanced usage
export default cacheManager;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.destroy();
  });
}