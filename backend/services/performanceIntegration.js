const queryOptimizer = require('./queryOptimizer');
const queueManager = require('./queueManager');
const enhancedCacheManager = require('./enhancedCacheManager');
const connectionPoolManager = require('./connectionPoolManager');
const performanceMonitor = require('./performanceMonitor');
const logger = require('../utils/logger');

class PerformanceIntegration {
  constructor() {
    this.initialized = false;
    this.services = {
      queryOptimizer,
      queueManager,
      enhancedCacheManager,
      connectionPoolManager,
      performanceMonitor
    };
  }

  /**
   * Initialize all performance services
   */
  async initialize() {
    try {
      logger.info('Initializing performance optimization services...');

      // Initialize connection pools first
      await connectionPoolManager.initializeDefaultPools();
      
      // Initialize enhanced cache manager
      await enhancedCacheManager.initialize();
      
      // Initialize queue manager with default queues
      queueManager.initializeDefaultQueues();
      
      // Set up queue processors
      await this.setupQueueProcessors();
      
      // Create database indexes for optimization
      const defaultPool = connectionPoolManager.getPool('default');
      await queryOptimizer.createOptimalIndexes(defaultPool);
      
      // Start performance monitoring
      performanceMonitor.startMonitoring();
      
      // Set up cache warming
      await this.setupCacheWarming();
      
      this.initialized = true;
      logger.info('Performance optimization services initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize performance services:', error);
      throw error;
    }
  }

  /**
   * Setup queue processors for different job types
   */
  async setupQueueProcessors() {
    // Report generation processor
    await queueManager.processQueue('reports', async (job) => {
      const { type, reportData, userId, format } = job.data;
      
      switch (type) {
        case 'generate_report':
          return await this.processReportGeneration(reportData, format, userId);
        default:
          throw new Error(`Unknown report job type: ${type}`);
      }
    });

    // Data processing processor
    await queueManager.processQueue('data-processing', async (job) => {
      const { type, params } = job.data;
      
      switch (type) {
        case 'aggregate_data':
          return await this.processDataAggregation(params);
        default:
          throw new Error(`Unknown data processing job type: ${type}`);
      }
    });

    // Maintenance processor
    await queueManager.processQueue('maintenance', async (job) => {
      const { type, keys, cleanupType, params } = job.data;
      
      switch (type) {
        case 'warm_cache':
          return await this.processCacheWarming(keys);
        case 'cleanup':
          return await this.processCleanup(cleanupType, params);
        default:
          throw new Error(`Unknown maintenance job type: ${type}`);
      }
    });

    logger.info('Queue processors set up successfully');
  }

  /**
   * Setup cache warming for frequently accessed data
   */
  async setupCacheWarming() {
    const warmupData = [
      {
        key: 'categories:all',
        dataFn: async () => {
          return await this.executeOptimizedQuery(
            'categories:all',
            () => connectionPoolManager.executeQuery(
              'SELECT * FROM categories WHERE is_active = 1 ORDER BY name',
              []
            )
          );
        },
        options: enhancedCacheManager.getStrategy('categories')
      },
      {
        key: 'user:summary:default',
        dataFn: async () => {
          return await this.executeOptimizedQuery(
            'user:summary:default',
            () => connectionPoolManager.executeQuery(
              `SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense
               FROM transactions 
               WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
              []
            )
          );
        },
        options: enhancedCacheManager.getStrategy('summaries')
      }
    ];

    await enhancedCacheManager.warmCache(warmupData);
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeOptimizedQuery(cacheKey, queryFn, options = {}) {
    const startTime = Date.now();
    
    try {
      // Try cache first
      const cachedResult = await enhancedCacheManager.get(cacheKey, {
        fallbackFn: queryFn
      });
      
      const executionTime = Date.now() - startTime;
      
      if (cachedResult) {
        performanceMonitor.trackCacheHit();
      } else {
        performanceMonitor.trackCacheMiss();
      }
      
      performanceMonitor.trackDatabaseQuery(executionTime, executionTime > 1000);
      
      return cachedResult;
    } catch (error) {
      performanceMonitor.trackError(error, 'database');
      throw error;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      services: {
        cache: enhancedCacheManager.getStats(),
        queues: queueManager.getAllQueueStats(),
        connectionPools: connectionPoolManager.getAllPoolStats(),
        performance: performanceMonitor.getPerformanceReport(),
        queryOptimizer: await queryOptimizer.analyzeQueryPerformance()
      },
      health: await this.performHealthCheck(),
      recommendations: await this.generateOptimizationRecommendations()
    };

    return report;
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    const healthStatus = {
      overall: 'healthy',
      services: {}
    };

    try {
      // Check connection pools
      healthStatus.services.connectionPools = await connectionPoolManager.healthCheck();
      
      // Check cache
      healthStatus.services.cache = {
        redis: enhancedCacheManager.isRedisConnected ? 'healthy' : 'degraded',
        memory: 'healthy'
      };
      
      // Check queues
      const queueStats = queueManager.getAllQueueStats();
      healthStatus.services.queues = {};
      
      Object.keys(queueStats).forEach(queueName => {
        const stats = queueStats[queueName];
        healthStatus.services.queues[queueName] = {
          status: stats.processing ? 'healthy' : 'paused',
          jobCount: stats.jobCount
        };
      });
      
      // Determine overall health
      const unhealthyServices = Object.values(healthStatus.services).some(service => 
        typeof service === 'object' && Object.values(service).includes('unhealthy')
      );
      
      if (unhealthyServices) {
        healthStatus.overall = 'degraded';
      }
      
    } catch (error) {
      healthStatus.overall = 'unhealthy';
      healthStatus.error = error.message;
    }

    return healthStatus;
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Cache recommendations
    const cacheStats = enhancedCacheManager.getStats();
    if (parseFloat(cacheStats.hitRate) < 70) {
      recommendations.push({
        service: 'cache',
        priority: 'medium',
        message: 'Cache hit rate is below 70%. Consider reviewing cache strategies and TTL values.'
      });
    }
    
    // Queue recommendations
    const queueStats = queueManager.getAllQueueStats();
    Object.entries(queueStats).forEach(([queueName, stats]) => {
      if (stats.jobCount > 100) {
        recommendations.push({
          service: 'queue',
          priority: 'high',
          message: `Queue '${queueName}' has ${stats.jobCount} pending jobs. Consider increasing concurrency or adding workers.`
        });
      }
    });
    
    // Database recommendations
    const queryAnalysis = await queryOptimizer.analyzeQueryPerformance();
    if (queryAnalysis.slowQueries.length > 0) {
      recommendations.push({
        service: 'database',
        priority: 'high',
        message: `${queryAnalysis.slowQueries.length} slow queries detected. Review query optimization and indexing.`
      });
    }
    
    return recommendations;
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown() {
    try {
      logger.info('Shutting down performance services...');
      
      // Stop performance monitoring
      performanceMonitor.stopMonitoring();
      
      // Close connection pools
      await connectionPoolManager.closeAllPools();
      
      // Clear caches
      await enhancedCacheManager.clear();
      
      this.initialized = false;
      logger.info('Performance services shut down successfully');
      
    } catch (error) {
      logger.error('Error during performance services shutdown:', error);
    }
  }

  // Private methods for queue processors
  async processReportGeneration(reportData, format, userId) {
    logger.info(`Processing report generation for user ${userId} in ${format} format`);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      reportId: `report_${Date.now()}`,
      format,
      userId,
      generatedAt: new Date().toISOString()
    };
  }

  async processDataAggregation(params) {
    logger.info('Processing data aggregation:', params);
    
    // Simulate data aggregation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      aggregatedRecords: Math.floor(Math.random() * 1000),
      processedAt: new Date().toISOString()
    };
  }

  async processCacheWarming(keys) {
    logger.info('Processing cache warming for keys:', keys);
    
    // Warm specified cache keys
    for (const key of keys) {
      try {
        // This would typically fetch fresh data and cache it
        await enhancedCacheManager.set(key, { warmed: true, timestamp: Date.now() });
      } catch (error) {
        logger.warn(`Failed to warm cache for key ${key}:`, error);
      }
    }
    
    return {
      success: true,
      warmedKeys: keys.length,
      processedAt: new Date().toISOString()
    };
  }

  async processCleanup(cleanupType, params) {
    logger.info(`Processing cleanup: ${cleanupType}`, params);
    
    switch (cleanupType) {
      case 'expired_cache':
        // Clean up expired cache entries
        break;
      case 'old_logs':
        // Clean up old log files
        break;
      case 'temp_files':
        // Clean up temporary files
        break;
      default:
        logger.warn(`Unknown cleanup type: ${cleanupType}`);
    }
    
    return {
      success: true,
      cleanupType,
      processedAt: new Date().toISOString()
    };
  }
}

module.exports = new PerformanceIntegration();