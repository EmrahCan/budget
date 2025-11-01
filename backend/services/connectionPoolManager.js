const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class ConnectionPoolManager {
  constructor() {
    this.pools = new Map();
    this.defaultPoolConfig = {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      idleTimeout: 300000, // 5 minutes
      maxReconnects: 3,
      queueLimit: 0
    };
    this.poolStats = new Map();
  }

  /**
   * Create a connection pool
   */
  createPool(name, config = {}) {
    const poolConfig = {
      ...this.defaultPoolConfig,
      ...config,
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 3306,
      user: config.user || process.env.DB_USER || 'root',
      password: config.password || process.env.DB_PASSWORD || '',
      database: config.database || process.env.DB_NAME || 'budget_app',
      charset: 'utf8mb4'
    };

    try {
      const pool = mysql.createPool(poolConfig);
      
      // Add event listeners for monitoring
      pool.on('connection', (connection) => {
        logger.debug(`New connection established as id ${connection.threadId} for pool ${name}`);
        this.updatePoolStats(name, 'connections_created');
      });

      pool.on('error', (err) => {
        logger.error(`Pool ${name} error:`, err);
        this.updatePoolStats(name, 'errors');
      });

      this.pools.set(name, pool);
      this.initializePoolStats(name);
      
      logger.info(`Connection pool '${name}' created with ${poolConfig.connectionLimit} connections`);
      return pool;
    } catch (error) {
      logger.error(`Failed to create pool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get a connection pool
   */
  getPool(name = 'default') {
    const pool = this.pools.get(name);
    if (!pool) {
      throw new Error(`Pool '${name}' not found`);
    }
    return pool;
  }

  /**
   * Execute query with automatic pool selection and retry logic
   */
  async executeQuery(query, params = [], options = {}) {
    const {
      poolName = 'default',
      timeout = 30000,
      retryAttempts = 2,
      retryDelay = 1000
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const pool = this.getPool(poolName);
        
        const [results] = await pool.execute(query, params);
        const executionTime = Date.now() - startTime;
        
        this.updatePoolStats(poolName, 'queries_executed');
        this.updatePoolStats(poolName, 'total_execution_time', executionTime);
        
        if (executionTime > 5000) { // Log slow queries
          logger.warn(`Slow query detected (${executionTime}ms): ${query.substring(0, 100)}...`);
        }
        
        return results;
      } catch (error) {
        lastError = error;
        this.updatePoolStats(poolName, 'query_errors');
        
        if (attempt < retryAttempts && this.isRetryableError(error)) {
          logger.warn(`Query attempt ${attempt} failed, retrying in ${retryDelay}ms:`, error.message);
          await this.sleep(retryDelay * attempt);
        } else {
          logger.error(`Query failed after ${attempt} attempts:`, error);
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async executeTransaction(queries, poolName = 'default') {
    const pool = this.getPool(poolName);
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params = [] } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      this.updatePoolStats(poolName, 'transactions_committed');
      
      logger.debug(`Transaction completed successfully with ${queries.length} queries`);
      return results;
    } catch (error) {
      await connection.rollback();
      this.updatePoolStats(poolName, 'transactions_rolled_back');
      
      logger.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute batch insert for better performance
   */
  async executeBatchInsert(table, columns, rows, options = {}) {
    const {
      poolName = 'default',
      batchSize = 1000,
      onDuplicateUpdate = false
    } = options;

    if (!rows.length) return [];

    const pool = this.getPool(poolName);
    const results = [];
    
    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const placeholders = batch.map(() => 
        `(${columns.map(() => '?').join(', ')})`
      ).join(', ');
      
      let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
      
      if (onDuplicateUpdate) {
        const updateClause = columns.map(col => `${col} = VALUES(${col})`).join(', ');
        query += ` ON DUPLICATE KEY UPDATE ${updateClause}`;
      }
      
      const params = batch.flat();
      
      try {
        const [result] = await pool.execute(query, params);
        results.push(result);
        
        this.updatePoolStats(poolName, 'batch_inserts');
        logger.debug(`Batch insert completed: ${batch.length} rows into ${table}`);
      } catch (error) {
        logger.error(`Batch insert failed for table ${table}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolName) {
    const pool = this.pools.get(poolName);
    const stats = this.poolStats.get(poolName) || {};
    
    if (!pool) {
      return null;
    }

    return {
      poolName,
      config: {
        connectionLimit: pool.config.connectionLimit,
        acquireTimeout: pool.config.acquireTimeout,
        timeout: pool.config.timeout
      },
      stats: {
        ...stats,
        averageExecutionTime: stats.queries_executed > 0 
          ? (stats.total_execution_time / stats.queries_executed).toFixed(2) + 'ms'
          : '0ms'
      }
    };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats() {
    const allStats = {};
    for (const poolName of this.pools.keys()) {
      allStats[poolName] = this.getPoolStats(poolName);
    }
    return allStats;
  }

  /**
   * Health check for all pools
   */
  async healthCheck() {
    const healthStatus = {};
    
    for (const [name, pool] of this.pools.entries()) {
      try {
        const startTime = Date.now();
        await pool.execute('SELECT 1 as health_check');
        const responseTime = Date.now() - startTime;
        
        healthStatus[name] = {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        };
      } catch (error) {
        healthStatus[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return healthStatus;
  }

  /**
   * Close all pools
   */
  async closeAllPools() {
    const closePromises = [];
    
    for (const [name, pool] of this.pools.entries()) {
      closePromises.push(
        pool.end().then(() => {
          logger.info(`Pool '${name}' closed successfully`);
        }).catch(error => {
          logger.error(`Error closing pool '${name}':`, error);
        })
      );
    }
    
    await Promise.all(closePromises);
    this.pools.clear();
    this.poolStats.clear();
  }

  /**
   * Initialize default pools
   */
  async initializeDefaultPools() {
    try {
      // Main application pool
      this.createPool('default', {
        connectionLimit: 15,
        acquireTimeout: 60000,
        timeout: 60000
      });

      // Read-only pool for reports (if using read replicas)
      this.createPool('readonly', {
        connectionLimit: 10,
        acquireTimeout: 30000,
        timeout: 45000,
        host: process.env.DB_READ_HOST || process.env.DB_HOST
      });

      // Analytics pool for heavy queries
      this.createPool('analytics', {
        connectionLimit: 5,
        acquireTimeout: 120000,
        timeout: 120000
      });

      logger.info('Default connection pools initialized');
    } catch (error) {
      logger.error('Failed to initialize default pools:', error);
      throw error;
    }
  }

  // Private methods
  initializePoolStats(poolName) {
    this.poolStats.set(poolName, {
      connections_created: 0,
      queries_executed: 0,
      query_errors: 0,
      transactions_committed: 0,
      transactions_rolled_back: 0,
      batch_inserts: 0,
      total_execution_time: 0,
      errors: 0
    });
  }

  updatePoolStats(poolName, metric, value = 1) {
    const stats = this.poolStats.get(poolName);
    if (stats) {
      if (metric === 'total_execution_time') {
        stats[metric] += value;
      } else {
        stats[metric] += 1;
      }
    }
  }

  isRetryableError(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ER_LOCK_WAIT_TIMEOUT',
      'ER_LOCK_DEADLOCK'
    ];
    
    return retryableErrors.some(errorCode => 
      error.code === errorCode || error.message.includes(errorCode)
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ConnectionPoolManager();