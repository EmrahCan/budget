const os = require('os');
const process = require('process');
const logger = require('../utils/logger');
const performanceMonitor = require('./performanceMonitor');
const healthConfig = require('../config/healthConfig');

class SystemHealthMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.alertCallbacks = new Map();
    
    // Critical thresholds from config
    this.thresholds = healthConfig.monitoring;
    
    this.healthHistory = [];
    this.maxHistorySize = 100;
    this.emergencyActions = new Map();
    
    this.setupEmergencyActions();
  }

  /**
   * Start health monitoring
   */
  startMonitoring(interval = 10000) { // 10 seconds
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
    }, interval);
    
    logger.info('System health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('System health monitoring stopped');
  }

  /**
   * Check system health and trigger alerts
   */
  async checkSystemHealth() {
    try {
      const health = await this.getSystemHealth();
      this.healthHistory.push({
        timestamp: new Date(),
        ...health
      });
      
      // Keep history size manageable
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory.shift();
      }
      
      // Check for critical conditions
      await this.evaluateHealth(health);
      
    } catch (error) {
      logger.error('Error checking system health:', error);
    }
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU usage calculation
    const cpuUsage = await this.getCPUUsage();
    
    // Get performance metrics
    const perfReport = performanceMonitor.getPerformanceReport();
    
    return {
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: usedMem / totalMem,
        process: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          usage: memUsage.heapUsed / memUsage.heapTotal
        }
      },
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      performance: {
        responseTime: perfReport.metrics.requests.averageResponseTime,
        errorRate: perfReport.metrics.requests.total > 0 
          ? perfReport.metrics.requests.failed / perfReport.metrics.requests.total 
          : 0,
        dbQueries: perfReport.metrics.database.averageQueryTime,
        cacheHitRate: perfReport.metrics.cache.hitRate
      },
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * Evaluate health and trigger actions
   */
  async evaluateHealth(health) {
    const alerts = [];
    
    // Memory evaluation
    const memoryLevel = this.evaluateMetric(health.memory.usage, this.thresholds.memory);
    if (memoryLevel !== 'normal') {
      alerts.push({
        type: 'memory',
        level: memoryLevel,
        value: health.memory.usage,
        message: `Memory usage at ${(health.memory.usage * 100).toFixed(1)}%`
      });
      
      if (memoryLevel === 'emergency') {
        await this.executeEmergencyAction('memory_cleanup');
      }
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Evaluate metric against thresholds
   */
  evaluateMetric(value, thresholds) {
    if (value >= thresholds.emergency) return 'emergency';
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Process alert
   */
  async processAlert(alert) {
    logger.warn(`Health Alert [${alert.type}] ${alert.level}: ${alert.message}`);
    
    // Call registered alert callbacks
    for (const [name, callback] of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        logger.error(`Error in alert callback ${name}:`, error);
      }
    }
  }

  /**
   * Setup emergency actions
   */
  setupEmergencyActions() {
    this.emergencyActions.set('memory_cleanup', async () => {
      logger.warn('Executing emergency memory cleanup');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Forced garbage collection executed');
      }
      
      logger.info('Emergency memory cleanup completed');
    });
  }

  /**
   * Execute emergency action
   */
  async executeEmergencyAction(actionName) {
    const action = this.emergencyActions.get(actionName);
    if (action) {
      try {
        await action();
        logger.info(`Emergency action '${actionName}' executed successfully`);
      } catch (error) {
        logger.error(`Error executing emergency action '${actionName}':`, error);
      }
    } else {
      logger.warn(`Emergency action '${actionName}' not found`);
    }
  }

  /**
   * Register alert callback
   */
  registerAlertCallback(name, callback) {
    this.alertCallbacks.set(name, callback);
    logger.info(`Alert callback '${name}' registered`);
  }

  /**
   * Get CPU usage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const cpuTime = endUsage.user + endUsage.system; // microseconds
        
        const usage = cpuTime / totalTime;
        resolve(Math.min(usage, 1)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 50) {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get current health status
   */
  async getCurrentHealthStatus() {
    const health = await this.getSystemHealth();
    
    const status = {
      overall: 'healthy',
      details: {
        memory: this.evaluateMetric(health.memory.usage, this.thresholds.memory),
        cpu: this.evaluateMetric(health.cpu.usage, this.thresholds.cpu),
        responseTime: this.evaluateMetric(health.performance.responseTime, this.thresholds.responseTime),
        errorRate: this.evaluateMetric(health.performance.errorRate, this.thresholds.errorRate)
      },
      metrics: health
    };
    
    // Determine overall status
    const levels = Object.values(status.details);
    if (levels.includes('emergency')) {
      status.overall = 'emergency';
    } else if (levels.includes('critical')) {
      status.overall = 'critical';
    } else if (levels.includes('warning')) {
      status.overall = 'warning';
    }
    
    return status;
  }

  /**
   * Force health check
   */
  async forceHealthCheck() {
    await this.checkSystemHealth();
    return this.getCurrentHealthStatus();
  }
}

module.exports = new SystemHealthMonitor();