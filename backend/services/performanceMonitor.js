const { performance, PerformanceObserver } = require('perf_hooks');
const os = require('os');
const process = require('process');
const logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
      },
      database: {
        queries: 0,
        averageQueryTime: 0,
        totalQueryTime: 0,
        slowQueries: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    
    this.performanceObserver = null;
    this.monitoringInterval = null;
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      memoryUsage: 0.9, // 90%
      cpuUsage: 0.8, // 80%
      errorRate: 0.1 // 10%
    };
    
    this.initializePerformanceObserver();
  }

  /**
   * Initialize performance observer
   */
  initializePerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.processPerformanceEntry(entry);
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring(interval = 30000) { // 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
    }, interval);
    
    logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    logger.info('Performance monitoring stopped');
  }

  /**
   * Track request performance
   */
  trackRequest(req, res, next) {
    const startTime = performance.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Update metrics
      this.metrics.requests.total++;
      this.metrics.requests.totalResponseTime += responseTime;
      this.metrics.requests.averageResponseTime = 
        this.metrics.requests.totalResponseTime / this.metrics.requests.total;
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        this.metrics.requests.successful++;
      } else {
        this.metrics.requests.failed++;
      }
      
      // Log slow requests
      if (responseTime > this.alertThresholds.responseTime) {
        logger.warn(`Slow request detected: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms`);
      }
      
      originalSend.call(this, data);
    }.bind(this);
    
    next();
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(queryTime, isSlowQuery = false) {
    this.metrics.database.queries++;
    this.metrics.database.totalQueryTime += queryTime;
    this.metrics.database.averageQueryTime = 
      this.metrics.database.totalQueryTime / this.metrics.database.queries;
    
    if (isSlowQuery) {
      this.metrics.database.slowQueries++;
    }
  }

  /**
   * Track cache performance
   */
  trackCacheHit() {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  /**
   * Track cache miss
   */
  trackCacheMiss() {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  /**
   * Track error occurrence
   */
  trackError(error, type = 'general') {
    this.metrics.errors.total++;
    
    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    this.metrics.errors.byType[type]++;
    
    logger.error(`Error tracked (${type}):`, error);
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: { ...this.metrics },
      system: this.getSystemMetrics(),
      alerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external),
        usage: memUsage.heapUsed / memUsage.heapTotal
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        usage: this.metrics.system.cpuUsage
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: this.formatBytes(os.totalmem()),
        freeMemory: this.formatBytes(os.freemem()),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      },
      node: {
        version: process.version,
        pid: process.pid,
        uptime: process.uptime()
      }
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Response time recommendations
    if (this.metrics.requests.averageResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time is high. Consider optimizing database queries or adding caching.'
      });
    }
    
    // Database recommendations
    if (this.metrics.database.slowQueries > this.metrics.database.queries * 0.1) {
      recommendations.push({
        type: 'database',
        priority: 'high',
        message: 'High number of slow queries detected. Review query optimization and indexing.'
      });
    }
    
    // Cache recommendations
    if (this.metrics.cache.hitRate < 0.7) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Cache hit rate is low. Consider increasing cache TTL or reviewing cache strategy.'
      });
    }
    
    // Memory recommendations
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected. Consider memory optimization or scaling.'
      });
    }
    
    // Error rate recommendations
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.failed / this.metrics.requests.total 
      : 0;
    
    if (errorRate > 0.05) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High error rate detected. Review error handling and system stability.'
      });
    }
    
    return recommendations;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format = 'json') {
    const metrics = this.getPerformanceReport();
    
    switch (format) {
      case 'prometheus':
        return this.formatPrometheusMetrics(metrics);
      case 'json':
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
      },
      database: {
        queries: 0,
        averageQueryTime: 0,
        totalQueryTime: 0,
        slowQueries: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    
    logger.info('Performance metrics reset');
  }

  // Private methods
  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        if (entry.name.startsWith('db-query')) {
          this.trackDatabaseQuery(entry.duration, entry.duration > 1000);
        }
        break;
      case 'navigation':
        // Handle navigation timing if needed
        break;
      case 'resource':
        // Handle resource timing if needed
        break;
    }
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
    this.metrics.system.uptime = process.uptime();
    
    // Calculate CPU usage (simplified)
    this.metrics.system.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? this.metrics.cache.hits / total : 0;
  }

  checkAlerts() {
    const alerts = [];
    
    // Check response time
    if (this.metrics.requests.averageResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Average response time (${this.metrics.requests.averageResponseTime.toFixed(2)}ms) exceeds threshold`
      });
    }
    
    // Check memory usage
    if (this.metrics.system.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage (${(this.metrics.system.memoryUsage * 100).toFixed(1)}%) exceeds threshold`
      });
    }
    
    // Check error rate
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.failed / this.metrics.requests.total 
      : 0;
    
    if (errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'warning',
        message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold`
      });
    }
    
    // Log alerts
    alerts.forEach(alert => {
      logger.warn(`Performance Alert [${alert.type}]: ${alert.message}`);
    });
  }

  getActiveAlerts() {
    // This would return currently active alerts
    // For now, return empty array
    return [];
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatPrometheusMetrics(metrics) {
    // Convert metrics to Prometheus format
    let output = '';
    
    output += `# HELP http_requests_total Total number of HTTP requests\n`;
    output += `# TYPE http_requests_total counter\n`;
    output += `http_requests_total ${metrics.metrics.requests.total}\n\n`;
    
    output += `# HELP http_request_duration_ms Average HTTP request duration in milliseconds\n`;
    output += `# TYPE http_request_duration_ms gauge\n`;
    output += `http_request_duration_ms ${metrics.metrics.requests.averageResponseTime}\n\n`;
    
    output += `# HELP database_queries_total Total number of database queries\n`;
    output += `# TYPE database_queries_total counter\n`;
    output += `database_queries_total ${metrics.metrics.database.queries}\n\n`;
    
    output += `# HELP cache_hit_rate Cache hit rate\n`;
    output += `# TYPE cache_hit_rate gauge\n`;
    output += `cache_hit_rate ${metrics.metrics.cache.hitRate}\n\n`;
    
    return output;
  }
}

module.exports = new PerformanceMonitor();