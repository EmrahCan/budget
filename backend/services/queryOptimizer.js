const { performance } = require('perf_hooks');
const logger = require('../utils/logger');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.performanceMetrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Optimize database queries with caching and performance monitoring
   */
  async executeOptimizedQuery(queryKey, queryFunction, options = {}) {
    const startTime = performance.now();
    const { 
      useCache = true, 
      cacheTTL = 300000, // 5 minutes
      logSlowQueries = true 
    } = options;

    try {
      // Check cache first
      if (useCache && this.queryCache.has(queryKey)) {
        const cached = this.queryCache.get(queryKey);
        if (Date.now() - cached.timestamp < cacheTTL) {
          logger.debug(`Query cache hit: ${queryKey}`);
          return cached.data;
        } else {
          this.queryCache.delete(queryKey);
        }
      }

      // Execute query
      const result = await queryFunction();
      const executionTime = performance.now() - startTime;

      // Cache result if enabled
      if (useCache) {
        this.queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      // Track performance metrics
      this.trackQueryPerformance(queryKey, executionTime);

      // Log slow queries
      if (logSlowQueries && executionTime > this.slowQueryThreshold) {
        logger.warn(`Slow query detected: ${queryKey} took ${executionTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error(`Query failed: ${queryKey} after ${executionTime.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Batch multiple queries for better performance
   */
  async executeBatchQueries(queries) {
    const startTime = performance.now();
    
    try {
      // Group queries by type for optimization
      const groupedQueries = this.groupQueriesByType(queries);
      const results = {};

      // Execute queries in parallel where possible
      const promises = Object.entries(groupedQueries).map(async ([type, typeQueries]) => {
        if (type === 'read') {
          // Read queries can be executed in parallel
          const readResults = await Promise.all(
            typeQueries.map(query => this.executeOptimizedQuery(query.key, query.fn, query.options))
          );
          typeQueries.forEach((query, index) => {
            results[query.key] = readResults[index];
          });
        } else {
          // Write queries should be executed sequentially
          for (const query of typeQueries) {
            results[query.key] = await this.executeOptimizedQuery(query.key, query.fn, query.options);
          }
        }
      });

      await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;
      logger.info(`Batch query completed: ${queries.length} queries in ${totalTime.toFixed(2)}ms`);
      
      return results;
    } catch (error) {
      logger.error('Batch query failed', error);
      throw error;
    }
  }

  /**
   * Generate optimized SQL queries with proper indexing hints
   */
  generateOptimizedQuery(baseQuery, filters = {}, options = {}) {
    const { 
      useIndex = null, 
      limit = null, 
      offset = null,
      orderBy = null,
      groupBy = null
    } = options;

    let optimizedQuery = baseQuery;

    // Add index hints if specified
    if (useIndex) {
      optimizedQuery = optimizedQuery.replace(
        /FROM\s+(\w+)/i, 
        `FROM $1 USE INDEX (${useIndex})`
      );
    }

    // Add WHERE conditions with proper parameter binding
    if (Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters)
        .map(key => `${key} = ?`)
        .join(' AND ');
      
      if (optimizedQuery.includes('WHERE')) {
        optimizedQuery += ` AND ${conditions}`;
      } else {
        optimizedQuery += ` WHERE ${conditions}`;
      }
    }

    // Add GROUP BY
    if (groupBy) {
      optimizedQuery += ` GROUP BY ${groupBy}`;
    }

    // Add ORDER BY
    if (orderBy) {
      optimizedQuery += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      optimizedQuery += ` LIMIT ${limit}`;
      if (offset) {
        optimizedQuery += ` OFFSET ${offset}`;
      }
    }

    return {
      query: optimizedQuery,
      params: Object.values(filters)
    };
  }

  /**
   * Create database indexes for better query performance
   */
  async createOptimalIndexes(db) {
    const indexes = [
      // Transaction indexes
      {
        table: 'transactions',
        name: 'idx_transactions_date_category',
        columns: ['date', 'category_id'],
        type: 'BTREE'
      },
      {
        table: 'transactions',
        name: 'idx_transactions_user_date',
        columns: ['user_id', 'date'],
        type: 'BTREE'
      },
      {
        table: 'transactions',
        name: 'idx_transactions_amount',
        columns: ['amount'],
        type: 'BTREE'
      },
      
      // Fixed payments indexes
      {
        table: 'fixed_payments',
        name: 'idx_fixed_payments_user_active',
        columns: ['user_id', 'is_active'],
        type: 'BTREE'
      },
      {
        table: 'fixed_payments',
        name: 'idx_fixed_payments_next_date',
        columns: ['next_payment_date'],
        type: 'BTREE'
      },
      
      // Installment payments indexes
      {
        table: 'installment_payments',
        name: 'idx_installment_payments_user_status',
        columns: ['user_id', 'status'],
        type: 'BTREE'
      },
      {
        table: 'installment_payments',
        name: 'idx_installment_payments_due_date',
        columns: ['due_date'],
        type: 'BTREE'
      },
      
      // Categories indexes
      {
        table: 'categories',
        name: 'idx_categories_user_type',
        columns: ['user_id', 'type'],
        type: 'BTREE'
      }
    ];

    for (const index of indexes) {
      try {
        const createIndexQuery = `
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} (${index.columns.join(', ')}) 
          USING ${index.type}
        `;
        
        await db.query(createIndexQuery);
        logger.info(`Created index: ${index.name} on ${index.table}`);
      } catch (error) {
        logger.warn(`Failed to create index ${index.name}:`, error.message);
      }
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQueryPerformance() {
    const analysis = {
      totalQueries: this.performanceMetrics.size,
      slowQueries: [],
      averageExecutionTime: 0,
      cacheHitRate: 0,
      recommendations: []
    };

    let totalTime = 0;
    let slowQueryCount = 0;

    for (const [queryKey, metrics] of this.performanceMetrics.entries()) {
      const avgTime = metrics.totalTime / metrics.count;
      totalTime += avgTime;

      if (avgTime > this.slowQueryThreshold) {
        analysis.slowQueries.push({
          query: queryKey,
          averageTime: avgTime,
          executionCount: metrics.count,
          totalTime: metrics.totalTime
        });
        slowQueryCount++;
      }
    }

    analysis.averageExecutionTime = totalTime / this.performanceMetrics.size;
    analysis.cacheHitRate = this.calculateCacheHitRate();

    // Generate recommendations
    if (slowQueryCount > 0) {
      analysis.recommendations.push('Consider adding database indexes for slow queries');
    }
    
    if (analysis.cacheHitRate < 0.5) {
      analysis.recommendations.push('Increase cache TTL or review caching strategy');
    }

    if (analysis.averageExecutionTime > 500) {
      analysis.recommendations.push('Consider query optimization or database scaling');
    }

    return analysis;
  }

  /**
   * Clear query cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Private methods
  groupQueriesByType(queries) {
    return queries.reduce((groups, query) => {
      const type = query.type || 'read';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(query);
      return groups;
    }, {});
  }

  trackQueryPerformance(queryKey, executionTime) {
    if (!this.performanceMetrics.has(queryKey)) {
      this.performanceMetrics.set(queryKey, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }

    const metrics = this.performanceMetrics.get(queryKey);
    metrics.count++;
    metrics.totalTime += executionTime;
    metrics.minTime = Math.min(metrics.minTime, executionTime);
    metrics.maxTime = Math.max(metrics.maxTime, executionTime);
  }

  calculateCacheHitRate() {
    // This would need to be implemented based on actual cache hit/miss tracking
    return 0.75; // Placeholder
  }
}

module.exports = new QueryOptimizer();