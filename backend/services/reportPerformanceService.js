const connectionPoolManager = require('./connectionPoolManager');
const enhancedCacheManager = require('./enhancedCacheManager');
const queueManager = require('./queueManager');
const queryOptimizer = require('./queryOptimizer');
const performanceMonitor = require('./performanceMonitor');
const logger = require('../utils/logger');

class ReportPerformanceService {
  constructor() {
    this.initialized = false;
    this.performanceThresholds = {
      queryTime: 5000, // 5 seconds
      cacheHitRate: 0.8, // 80%
      memoryUsage: 0.85, // 85%
      queueLength: 100
    };
  }

  /**
   * Initialize all performance services
   */
  async initialize() {
    try {
      logger.info('Initializing Report Performance Service...');

      // Initialize connection pools
      await connectionPoolManager.initializeDefaultPools();

      // Initialize cache manager
      await enhancedCacheManager.initialize();

      // Initialize queue manager
      await queueManager.initialize();

      // Initialize performance monitoring
      performanceMonitor.startMonitoring();

      // Set up performance alerts
      this.setupPerformanceAlerts();

      // Start background optimization tasks
      this.startBackgroundOptimization();

      this.initialized = true;
      logger.info('Report Performance Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Report Performance Service:', error);
      throw error;
    }
  }

  /**
   * Execute optimized report query
   */
  async executeOptimizedQuery(queryType, params, options = {}) {
    if (!this.initialized) {
      throw new Error('ReportPerformanceService not initialized');
    }

    const {
      useCache = true,
      cacheTimeout = 300, // 5 minutes
      poolName = 'readonly',
      priority = 'normal'
    } = options;

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(queryType, params);

    try {
      // Check cache first
      if (useCache) {
        const cachedResult = await enhancedCacheManager.get(cacheKey);
        if (cachedResult) {
          const executionTime = Date.now() - startTime;
          logger.cache('hit', cacheKey);
          performanceMonitor.recordMetric('cache_hit', executionTime);
          return cachedResult;
        }
      }

      // Optimize query based on type and params
      const optimizedQuery = await queryOptimizer.optimizeQuery(queryType, params);

      // Execute query with appropriate pool
      const result = await connectionPoolManager.executeQuery(
        optimizedQuery.sql,
        optimizedQuery.params,
        { poolName, timeout: 30000 }
      );

      const executionTime = Date.now() - startTime;

      // Cache the result
      if (useCache && result) {
        await enhancedCacheManager.set(cacheKey, result, cacheTimeout);
        logger.cache('set', cacheKey, null, cacheTimeout);
      }

      // Record performance metrics
      performanceMonitor.recordMetric('query_execution', executionTime);
      logger.query(optimizedQuery.sql, executionTime, params);

      // Check if query was slow
      if (executionTime > this.performanceThresholds.queryTime) {
        logger.warn(`Slow query detected: ${queryType} took ${executionTime}ms`);
        await this.handleSlowQuery(queryType, params, executionTime);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      performanceMonitor.recordMetric('query_error', executionTime);
      logger.errorWithContext('Query execution failed', error, { queryType, params });
      throw error;
    }
  }

  /**
   * Execute batch report generation
   */
  async executeBatchReports(reportRequests, options = {}) {
    const {
      maxConcurrency = 5,
      priority = 'normal'
    } = options;

    logger.info(`Starting batch report generation for ${reportRequests.length} reports`);

    const results = [];
    const errors = [];

    // Process reports in batches to avoid overwhelming the system
    for (let i = 0; i < reportRequests.length; i += maxConcurrency) {
      const batch = reportRequests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await this.executeOptimizedQuery(
            request.queryType,
            request.params,
            { ...request.options, priority }
          );
          return { index: i + index, result, success: true };
        } catch (error) {
          logger.errorWithContext('Batch report failed', error, request);
          return { index: i + index, error, success: false };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(({ value }) => {
        if (value.success) {
          results[value.index] = value.result;
        } else {
          errors[value.index] = value.error;
        }
      });
    }

    logger.info(`Batch report generation completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      results,
      errors,
      summary: {
        total: reportRequests.length,
        successful: results.filter(r => r !== undefined).length,
        failed: errors.filter(e => e !== undefined).length
      }
    };
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const [
        poolStats,
        cacheStats,
        queueStats,
        systemMetrics
      ] = await Promise.all([
        connectionPoolManager.getAllPoolStats(),
        enhancedCacheManager.getStats(),
        queueManager.getStats(),
        performanceMonitor.getSystemMetrics()
      ]);

      return {
        timestamp: new Date().toISOString(),
        database: poolStats,
        cache: cacheStats,
        queue: queueStats,
        system: systemMetrics,
        thresholds: this.performanceThresholds,
        alerts: performanceMonitor.getActiveAlerts()
      };
    } catch (error) {
      logger.errorWithContext('Failed to get performance metrics', error);
      throw error;
    }
  }

  /**
   * Optimize system performance
   */
  async optimizePerformance() {
    logger.info('Starting performance optimization...');

    try {
      // Clear expired cache entries
      await enhancedCacheManager.cleanup();

      // Optimize database connections
      await this.optimizeDatabaseConnections();

      // Process queue backlog
      await queueManager.processBacklog();

      // Update query optimization statistics
      await queryOptimizer.updateStatistics();

      logger.info('Performance optimization completed');
    } catch (error) {
      logger.errorWithContext('Performance optimization failed', error);
    }
  }

  /**
   * Health check for all performance components
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {}
    };

    try {
      // Database health
      const dbHealth = await connectionPoolManager.healthCheck();
      health.components.database = dbHealth;

      // Cache health
      const cacheHealth = await enhancedCacheManager.healthCheck();
      health.components.cache = cacheHealth;

      // Queue health
      const queueHealth = await queueManager.healthCheck();
      health.components.queue = queueHealth;

      // System health
      const systemHealth = performanceMonitor.getSystemHealth();
      health.components.system = systemHealth;

      // Determine overall health
      const unhealthyComponents = Object.values(health.components)
        .filter(component => component.status !== 'healthy');

      if (unhealthyComponents.length > 0) {
        health.status = unhealthyComponents.length > 2 ? 'critical' : 'degraded';
      }

    } catch (error) {
      health.status = 'critical';
      health.error = error.message;
      logger.errorWithContext('Health check failed', error);
    }

    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down Report Performance Service...');

    try {
      // Stop background tasks
      this.stopBackgroundOptimization();

      // Stop performance monitoring
      performanceMonitor.stopMonitoring();

      // Close queue manager
      await queueManager.shutdown();

      // Close cache connections
      await enhancedCacheManager.shutdown();

      // Close database pools
      await connectionPoolManager.closeAllPools();

      this.initialized = false;
      logger.info('Report Performance Service shutdown completed');
    } catch (error) {
      logger.errorWithContext('Error during shutdown', error);
    }
  }

  // Private methods

  generateCacheKey(queryType, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `report:${queryType}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }

  setupPerformanceAlerts() {
    performanceMonitor.setAlert('high_query_time', {
      threshold: this.performanceThresholds.queryTime,
      callback: (metric) => {
        logger.warn(`Performance alert: Query time exceeded threshold (${metric.value}ms)`);
      }
    });

    performanceMonitor.setAlert('low_cache_hit_rate', {
      threshold: this.performanceThresholds.cacheHitRate,
      callback: (metric) => {
        logger.warn(`Performance alert: Cache hit rate below threshold (${metric.value})`);
      }
    });

    performanceMonitor.setAlert('high_memory_usage', {
      threshold: this.performanceThresholds.memoryUsage,
      callback: (metric) => {
        logger.warn(`Performance alert: Memory usage above threshold (${metric.value})`);
      }
    });
  }

  startBackgroundOptimization() {
    // Run optimization every 30 minutes
    this.optimizationInterval = setInterval(() => {
      this.optimizePerformance().catch(error => {
        logger.errorWithContext('Background optimization failed', error);
      });
    }, 30 * 60 * 1000);

    // Run cache cleanup every 10 minutes
    this.cacheCleanupInterval = setInterval(() => {
      if (enhancedCacheManager && enhancedCacheManager.cleanup) {
        enhancedCacheManager.cleanup().catch(error => {
          logger.errorWithContext('Cache cleanup failed', error);
        });
      }
    }, 10 * 60 * 1000);
  }

  stopBackgroundOptimization() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  async optimizeDatabaseConnections() {
    const poolStats = connectionPoolManager.getAllPoolStats();
    
    for (const [poolName, stats] of Object.entries(poolStats)) {
      if (stats.stats.query_errors > 10) {
        logger.warn(`High error rate detected for pool ${poolName}, considering pool reset`);
      }
      
      if (parseFloat(stats.stats.averageExecutionTime) > 1000) {
        logger.warn(`High average execution time for pool ${poolName}: ${stats.stats.averageExecutionTime}`);
      }
    }
  }

  async handleSlowQuery(queryType, params, executionTime) {
    // Log slow query for analysis
    logger.warn('Slow query analysis', {
      queryType,
      params,
      executionTime,
      timestamp: new Date().toISOString()
    });

    // Add to optimization queue for future analysis
    await queueManager.addJob('query_optimization', {
      queryType,
      params,
      executionTime,
      timestamp: new Date().toISOString()
    }, { priority: 'low' });
  }
}

module.exports = new ReportPerformanceService();