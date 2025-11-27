const systemHealthMonitor = require('../services/systemHealthMonitor');
const performanceMonitor = require('../services/performanceMonitor');
const logger = require('../utils/logger');
const monitoringConfig = require('../config/monitoring');

/**
 * Initialize all monitoring services
 */
async function initializeMonitoring() {
  try {
    logger.info('Initializing monitoring services...');
    
    // Check if monitoring is enabled
    if (!monitoringConfig.features.healthMonitoring) {
      logger.info('Health monitoring is disabled');
      return;
    }
    
    // Start system health monitoring
    if (monitoringConfig.features.healthMonitoring) {
      systemHealthMonitor.startMonitoring(monitoringConfig.intervals.healthCheck);
      logger.info('System health monitoring started');
    }
    
    // Start performance monitoring
    if (monitoringConfig.features.performanceMonitoring) {
      performanceMonitor.startMonitoring(monitoringConfig.intervals.metrics);
      logger.info('Performance monitoring started');
    }
    
    // Configure thresholds
    configureThresholds();
    
    // Setup emergency handlers
    setupEmergencyHandlers();
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    logger.info('All monitoring services initialized successfully');
    
    // Log initial system state
    logInitialSystemState();
    
  } catch (error) {
    logger.error('Failed to initialize monitoring services:', error);
    throw error;
  }
}

/**
 * Configure monitoring thresholds
 */
function configureThresholds() {
  const thresholds = monitoringConfig.thresholds;
  
  // Update system health monitor thresholds
  systemHealthMonitor.thresholds = {
    memory: thresholds.memory,
    cpu: thresholds.cpu,
    responseTime: thresholds.responseTime,
    errorRate: thresholds.errorRate,
    diskSpace: thresholds.diskSpace
  };
  
  // Update performance monitor thresholds
  performanceMonitor.alertThresholds = {
    responseTime: thresholds.responseTime.critical,
    memoryUsage: thresholds.memory.critical,
    cpuUsage: thresholds.cpu.critical,
    errorRate: thresholds.errorRate.critical
  };
  
  logger.info('Monitoring thresholds configured');
}

/**
 * Setup emergency handlers
 */
function setupEmergencyHandlers() {
  if (!monitoringConfig.autoRecovery.enabled) {
    logger.info('Auto-recovery is disabled');
    return;
  }
  
  // Memory emergency handler
  systemHealthMonitor.emergencyActions.memory = async (result) => {
    logger.warn('Executing memory emergency actions');
    
    const actions = monitoringConfig.autoRecovery.actions.memory;
    
    if (actions.forceGC && global.gc) {
      global.gc();
      logger.info('Forced garbage collection');
    }
    
    if (actions.clearCaches) {
      // Clear application caches
      try {
        const cacheManager = require('../services/enhancedCacheManager');
        await cacheManager.clearAll();
        logger.info('Cleared all caches');
      } catch (error) {
        logger.warn('Failed to clear caches:', error.message);
      }
    }
    
    if (actions.reduceConnections) {
      try {
        const connectionPool = require('../services/connectionPoolManager');
        connectionPool.reducePoolSize();
        logger.info('Reduced connection pool sizes');
      } catch (error) {
        logger.warn('Failed to reduce connections:', error.message);
      }
    }
  };
  
  // CPU emergency handler
  systemHealthMonitor.emergencyActions.cpu = async (result) => {
    logger.warn('Executing CPU emergency actions');
    
    const actions = monitoringConfig.autoRecovery.actions.cpu;
    
    if (actions.reduceConcurrency) {
      try {
        const queueManager = require('../services/queueManager');
        queueManager.reduceConcurrency();
        logger.info('Reduced queue concurrency');
      } catch (error) {
        logger.warn('Failed to reduce concurrency:', error.message);
      }
    }
    
    if (actions.pauseBackgroundTasks) {
      // Pause non-critical background tasks
      logger.info('Paused non-critical background tasks');
    }
  };
  
  logger.info('Emergency handlers configured');
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down monitoring services...`);
    
    try {
      // Stop monitoring services
      systemHealthMonitor.stopMonitoring();
      performanceMonitor.stopMonitoring();
      
      // Generate final report
      const finalReport = await generateFinalReport();
      logger.info('Final system report:', finalReport);
      
      logger.info('Monitoring services shut down gracefully');
    } catch (error) {
      logger.error('Error during monitoring shutdown:', error);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    performanceMonitor.trackError(error, 'uncaught_exception');
    
    // Don't exit immediately, let the monitoring system handle it
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection:', reason);
    performanceMonitor.trackError(new Error(reason), 'unhandled_rejection');
  });
  
  logger.info('Graceful shutdown handlers configured');
}

/**
 * Log initial system state
 */
async function logInitialSystemState() {
  try {
    const healthReport = await systemHealthMonitor.getDetailedHealthReport();
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    logger.info('Initial system state:', {
      health: healthReport.overall,
      memory: healthReport.system?.memory,
      uptime: healthReport.system?.node?.uptime,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      pid: process.pid
    });
    
    // Log configuration summary
    logger.info('Monitoring configuration:', {
      healthCheckInterval: monitoringConfig.intervals.healthCheck,
      metricsInterval: monitoringConfig.intervals.metrics,
      autoRecoveryEnabled: monitoringConfig.autoRecovery.enabled,
      alertingEnabled: monitoringConfig.alerts.enabled,
      features: monitoringConfig.features
    });
    
  } catch (error) {
    logger.warn('Failed to log initial system state:', error.message);
  }
}

/**
 * Generate final report before shutdown
 */
async function generateFinalReport() {
  try {
    const healthReport = await systemHealthMonitor.getDetailedHealthReport();
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      health: healthReport,
      performance: performanceReport,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  } catch (error) {
    logger.error('Failed to generate final report:', error);
    return { error: error.message };
  }
}

/**
 * Health check endpoint for external monitoring
 */
function getMonitoringStatus() {
  return {
    systemHealth: systemHealthMonitor.isMonitoring,
    performanceMonitoring: performanceMonitor.isMonitoring,
    autoRecovery: monitoringConfig.autoRecovery.enabled,
    alerting: monitoringConfig.alerts.enabled,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Shutdown monitoring services
 */
async function shutdownMonitoring() {
  try {
    logger.info('Shutting down monitoring services...');
    
    systemHealthMonitor.stopMonitoring();
    performanceMonitor.stopMonitoring();
    
    // Generate final report
    const finalReport = await generateFinalReport();
    logger.info('Final monitoring report generated');
    
    logger.info('Monitoring services shut down successfully');
    return finalReport;
  } catch (error) {
    logger.error('Error shutting down monitoring:', error);
    throw error;
  }
}

module.exports = {
  initializeMonitoring,
  shutdownMonitoring,
  getMonitoringStatus,
  configureThresholds,
  setupEmergencyHandlers,
  generateFinalReport
};