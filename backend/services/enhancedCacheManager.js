const Redis = require('redis');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../utils/logger');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class EnhancedCacheManager {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    this.defaultTTL = 300; // 5 minutes
    this.maxMemoryCacheSize = 1000;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryHits: 0,
      redisHits: 0
    };
    this.compressionThreshold = 1024; // 1KB
    this.cacheStrategies = new Map();
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      this.redisClient = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redisClient.on('error', (err) => {
        this.isRedisConnected = false;
        logger.error('Redis connection error:', err);
      });

      this.redisClient.on('end', () => {
        this.isRedisConnected = false;
        logger.warn('Redis connection ended');
      });

      // Initialize cache strategies
      this.initializeCacheStrategies();

    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isRedisConnected = false;
    }
  }

  /**
   * Set cache value with multiple storage layers
   */
  async set(key, value, options = {}) {
    const {
      ttl = this.defaultTTL,
      strategy = 'default',
      compress = false,
      tags = []
    } = options;

    try {
      let serializedValue = JSON.stringify(value);
      let finalValue = serializedValue;

      // Compress large values
      if (compress || serializedValue.length > this.compressionThreshold) {
        const compressed = await gzip(serializedValue);
        finalValue = compressed.toString('base64');
        key = `compressed:${key}`;
      }

      const cacheEntry = {
        value: finalValue,
        timestamp: Date.now(),
        ttl: ttl * 1000,
        compressed: compress || serializedValue.length > this.compressionThreshold,
        tags,
        strategy
      };

      // Store in memory cache (L1)
      if (this.memoryCache.size >= this.maxMemoryCacheSize) {
        this.evictLRU();
      }
      this.memoryCache.set(key, cacheEntry);

      // Store in Redis (L2) if available
      if (this.isRedisConnected) {
        await this.redisClient.setex(key, ttl, JSON.stringify(cacheEntry));
      }

      // Handle cache tags for invalidation
      if (tags.length > 0) {
        await this.addToTags(key, tags);
      }

      this.cacheStats.sets++;
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s, Strategy: ${strategy})`);

    } catch (error) {
      logger.error(`Cache set failed for key ${key}:`, error);
    }
  }

  /**
   * Get cache value with fallback strategy
   */
  async get(key, options = {}) {
    const { fallbackFn = null, refreshThreshold = 0.8 } = options;

    try {
      let cacheEntry = null;
      let source = null;

      // Try memory cache first (L1)
      if (this.memoryCache.has(key)) {
        cacheEntry = this.memoryCache.get(key);
        source = 'memory';
        this.cacheStats.memoryHits++;
      }
      // Try Redis cache (L2)
      else if (this.isRedisConnected) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          cacheEntry = JSON.parse(redisValue);
          source = 'redis';
          this.cacheStats.redisHits++;
          
          // Promote to memory cache
          this.memoryCache.set(key, cacheEntry);
        }
      }

      if (!cacheEntry) {
        this.cacheStats.misses++;
        
        // Execute fallback function if provided
        if (fallbackFn) {
          const fallbackValue = await fallbackFn();
          await this.set(key, fallbackValue);
          return fallbackValue;
        }
        
        return null;
      }

      // Check if cache entry is expired
      const now = Date.now();
      const age = now - cacheEntry.timestamp;
      
      if (age > cacheEntry.ttl) {
        await this.delete(key);
        this.cacheStats.misses++;
        
        if (fallbackFn) {
          const fallbackValue = await fallbackFn();
          await this.set(key, fallbackValue);
          return fallbackValue;
        }
        
        return null;
      }

      // Check if cache needs refresh (proactive refresh)
      const refreshTime = cacheEntry.ttl * refreshThreshold;
      if (age > refreshTime && fallbackFn) {
        // Refresh in background
        setImmediate(async () => {
          try {
            const refreshedValue = await fallbackFn();
            await this.set(key, refreshedValue);
          } catch (error) {
            logger.warn(`Background cache refresh failed for ${key}:`, error);
          }
        });
      }

      this.cacheStats.hits++;

      // Decompress if needed
      let value = cacheEntry.value;
      if (cacheEntry.compressed) {
        const decompressed = await gunzip(Buffer.from(value, 'base64'));
        value = decompressed.toString();
      }

      logger.debug(`Cache hit: ${key} (Source: ${source}, Age: ${age}ms)`);
      return JSON.parse(value);

    } catch (error) {
      logger.error(`Cache get failed for key ${key}:`, error);
      this.cacheStats.misses++;
      
      if (fallbackFn) {
        try {
          return await fallbackFn();
        } catch (fallbackError) {
          logger.error(`Fallback function failed for ${key}:`, fallbackError);
        }
      }
      
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key) {
    try {
      this.memoryCache.delete(key);
      
      if (this.isRedisConnected) {
        await this.redisClient.del(key);
      }
      
      this.cacheStats.deletes++;
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete failed for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags) {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        
        if (this.isRedisConnected) {
          const keys = await this.redisClient.smembers(tagKey);
          if (keys.length > 0) {
            await Promise.all(keys.map(key => this.delete(key)));
            await this.redisClient.del(tagKey);
          }
        }
      }
      
      logger.info(`Cache invalidated for tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error('Cache invalidation by tags failed:', error);
    }
  }

  /**
   * Warm cache with predefined data
   */
  async warmCache(warmupData) {
    logger.info('Starting cache warmup...');
    
    const promises = warmupData.map(async ({ key, dataFn, options = {} }) => {
      try {
        const data = await dataFn();
        await this.set(key, data, options);
        logger.debug(`Cache warmed: ${key}`);
      } catch (error) {
        logger.warn(`Cache warmup failed for ${key}:`, error);
      }
    });

    await Promise.all(promises);
    logger.info(`Cache warmup completed: ${warmupData.length} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      memoryCacheSize: this.memoryCache.size,
      redisConnected: this.isRedisConnected,
      totalRequests
    };
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      this.memoryCache.clear();
      
      if (this.isRedisConnected) {
        await this.redisClient.flushdb();
      }
      
      // Reset stats
      Object.keys(this.cacheStats).forEach(key => {
        this.cacheStats[key] = 0;
      });
      
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear failed:', error);
    }
  }

  /**
   * Initialize cache strategies for different data types
   */
  initializeCacheStrategies() {
    // Report data - medium TTL, high compression
    this.cacheStrategies.set('reports', {
      ttl: 600, // 10 minutes
      compress: true,
      tags: ['reports']
    });

    // User data - long TTL, no compression
    this.cacheStrategies.set('users', {
      ttl: 1800, // 30 minutes
      compress: false,
      tags: ['users']
    });

    // Financial summaries - short TTL, medium compression
    this.cacheStrategies.set('summaries', {
      ttl: 300, // 5 minutes
      compress: true,
      tags: ['summaries', 'financial']
    });

    // Categories - very long TTL, no compression
    this.cacheStrategies.set('categories', {
      ttl: 3600, // 1 hour
      compress: false,
      tags: ['categories', 'metadata']
    });
  }

  /**
   * Get cache strategy for data type
   */
  getStrategy(type) {
    return this.cacheStrategies.get(type) || {
      ttl: this.defaultTTL,
      compress: false,
      tags: []
    };
  }

  // Private methods
  evictLRU() {
    // Remove oldest entry from memory cache
    const oldestKey = this.memoryCache.keys().next().value;
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  async addToTags(key, tags) {
    if (!this.isRedisConnected) return;

    try {
      const promises = tags.map(tag => 
        this.redisClient.sadd(`tag:${tag}`, key)
      );
      await Promise.all(promises);
    } catch (error) {
      logger.warn('Failed to add cache tags:', error);
    }
  }

  /**
   * Cleanup expired entries from memory cache
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }
}

module.exports = new EnhancedCacheManager();