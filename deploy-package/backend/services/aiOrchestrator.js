const geminiAIService = require('./geminiAIService');
const categorizationService = require('./categorizationService');
const naturalLanguageService = require('./naturalLanguageService');
const predictiveAnalyticsService = require('./predictiveAnalyticsService');
const logger = require('../utils/logger');

/**
 * AIOrchestrator - Central coordinator for all AI services
 * Manages rate limiting, caching, error handling, and logging for AI operations
 */
class AIOrchestrator {
  constructor() {
    this.geminiService = geminiAIService;
    this.categorizationService = categorizationService;
    this.naturalLanguageService = naturalLanguageService;
    this.predictiveAnalyticsService = predictiveAnalyticsService;
    
    // Cache for AI responses (in-memory for now, can be moved to Redis)
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour in milliseconds
    
    // Rate limiting per user
    this.userRequestCounts = new Map();
    this.maxRequestsPerMinute = 30;
    this.rateLimitWindow = 60000; // 1 minute
    
    // AI feature flags
    this.features = {
      CATEGORIZATION: process.env.AI_CATEGORIZATION_ENABLED !== 'false',
      NATURAL_LANGUAGE: process.env.AI_NL_ENABLED !== 'false',
      PREDICTIONS: process.env.AI_PREDICTIONS_ENABLED !== 'false',
      OCR: process.env.AI_OCR_ENABLED !== 'false',
      VOICE: process.env.AI_VOICE_ENABLED !== 'false',
      ANOMALY: process.env.AI_ANOMALY_ENABLED !== 'false',
      NOTIFICATIONS: process.env.AI_NOTIFICATIONS_ENABLED !== 'false',
      COACH: process.env.AI_COACH_ENABLED !== 'false'
    };
    
    // Initialize cleanup interval for cache and rate limits
    this.startCleanupInterval();
    
    logger.info('AIOrchestrator initialized', { features: this.features });
  }

  /**
   * Check if a specific AI feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.features[featureName] === true;
  }

  /**
   * Check rate limit for a user
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userKey = `user_${userId}`;
    
    if (!this.userRequestCounts.has(userKey)) {
      this.userRequestCounts.set(userKey, {
        count: 0,
        resetTime: now + this.rateLimitWindow
      });
    }
    
    const userLimit = this.userRequestCounts.get(userKey);
    
    // Reset if window expired
    if (now >= userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + this.rateLimitWindow;
    }
    
    // Check if limit exceeded
    if (userLimit.count >= this.maxRequestsPerMinute) {
      const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }
    
    userLimit.count++;
    return true;
  }

  /**
   * Generate cache key from request data
   */
  generateCacheKey(type, data) {
    const dataString = JSON.stringify(data);
    return `${type}_${this.hashCode(dataString)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(cacheKey) {
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        logger.info('Cache hit', { cacheKey });
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    return null;
  }

  /**
   * Store response in cache
   */
  setCachedResponse(cacheKey, data, ttl = this.cacheTimeout) {
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl
    });
    logger.info('Cache set', { cacheKey, ttl });
  }

  /**
   * Process AI request with rate limiting, caching, and error handling
   */
  async processRequest(type, data, userId, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check if feature is enabled
      const featureName = this.getFeatureNameFromType(type);
      if (featureName && !this.isFeatureEnabled(featureName)) {
        throw new Error(`AI feature '${type}' is currently disabled`);
      }
      
      // Check rate limit
      this.checkRateLimit(userId);
      
      // Check cache if enabled
      const cacheKey = options.useCache !== false 
        ? this.generateCacheKey(type, { ...data, userId })
        : null;
      
      if (cacheKey) {
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
            processingTime: Date.now() - startTime
          };
        }
      }
      
      // Route to appropriate service
      let result;
      switch (type) {
        case 'categorize':
          result = await this.categorizationService.categorizeTransaction(
            data.description,
            data.amount,
            userId,
            data.context
          );
          break;
          
        case 'insights':
          result = await this.geminiService.generateFinancialInsights(data.financialData);
          break;
          
        case 'recommendations':
          result = await this.geminiService.getPersonalizedRecommendations(
            data.userProfile,
            data.financialData
          );
          break;
          
        case 'query':
          result = await this.naturalLanguageService.processQuery(
            data.query,
            userId,
            data.userContext
          );
          break;
          
        default:
          throw new Error(`Unknown AI request type: ${type}`);
      }
      
      // Cache successful results
      if (result.success && cacheKey) {
        this.setCachedResponse(cacheKey, result.data, options.cacheTTL);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Log interaction
      await this.logInteraction(userId, type, data, result, processingTime);
      
      return {
        ...result,
        cached: false,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('AI request failed', {
        type,
        userId,
        error: error.message,
        processingTime
      });
      
      // Log failed interaction
      await this.logInteraction(userId, type, data, { success: false, error: error.message }, processingTime);
      
      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  /**
   * Get feature name from request type
   */
  getFeatureNameFromType(type) {
    const typeToFeature = {
      'categorize': 'CATEGORIZATION',
      'query': 'NATURAL_LANGUAGE',
      'predictions': 'PREDICTIONS',
      'trends': 'PREDICTIONS',
      'ocr': 'OCR',
      'voice': 'VOICE',
      'anomaly': 'ANOMALY',
      'notifications': 'NOTIFICATIONS',
      'coach': 'COACH'
    };
    return typeToFeature[type];
  }

  /**
   * Log AI interaction to database
   */
  async logInteraction(userId, type, requestData, responseData, processingTime) {
    try {
      // For now, just log to console
      // TODO: Implement database logging when ai_interactions table is created
      logger.info('AI interaction', {
        userId,
        type,
        success: responseData.success,
        processingTime,
        cached: responseData.cached || false
      });
      
      // Future implementation:
      // await db.query(`
      //   INSERT INTO ai_interactions 
      //   (user_id, interaction_type, request_data, response_data, processing_time_ms, created_at)
      //   VALUES ($1, $2, $3, $4, $5, NOW())
      // `, [userId, type, requestData, responseData, processingTime]);
      
    } catch (error) {
      logger.error('Failed to log AI interaction', { error: error.message });
    }
  }

  /**
   * Clear cache for a specific user or type
   */
  clearCache(filter = {}) {
    if (filter.userId || filter.type) {
      // Clear specific entries
      for (const [key, value] of this.cache.entries()) {
        if (filter.type && key.startsWith(filter.type)) {
          this.cache.delete(key);
        }
      }
      logger.info('Cache cleared', { filter });
    } else {
      // Clear all
      this.cache.clear();
      logger.info('All cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now < value.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate() {
    // This is a simplified version
    // In production, track hits and misses separately
    return 0; // TODO: Implement proper hit rate tracking
  }

  /**
   * Get rate limit status for a user
   */
  getRateLimitStatus(userId) {
    const userKey = `user_${userId}`;
    const userLimit = this.userRequestCounts.get(userKey);
    
    if (!userLimit) {
      return {
        requestsUsed: 0,
        requestsRemaining: this.maxRequestsPerMinute,
        resetTime: Date.now() + this.rateLimitWindow
      };
    }
    
    const now = Date.now();
    if (now >= userLimit.resetTime) {
      return {
        requestsUsed: 0,
        requestsRemaining: this.maxRequestsPerMinute,
        resetTime: now + this.rateLimitWindow
      };
    }
    
    return {
      requestsUsed: userLimit.count,
      requestsRemaining: this.maxRequestsPerMinute - userLimit.count,
      resetTime: userLimit.resetTime
    };
  }

  /**
   * Start cleanup interval for expired cache and rate limits
   */
  startCleanupInterval() {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
      this.cleanupExpiredRateLimits();
    }, 300000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { entriesRemoved: cleaned });
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupExpiredRateLimits() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.userRequestCounts.entries()) {
      if (now >= value.resetTime && value.count === 0) {
        this.userRequestCounts.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info('Rate limit cleanup completed', { entriesRemoved: cleaned });
    }
  }

  /**
   * Health check for AI services
   */
  async healthCheck() {
    try {
      const geminiHealth = await this.geminiService.healthCheck();
      
      return {
        success: true,
        status: 'healthy',
        services: {
          gemini: geminiHealth.status
        },
        features: this.features,
        cache: this.getCacheStats()
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new AIOrchestrator();
