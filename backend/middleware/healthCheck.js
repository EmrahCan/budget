const systemHealthMonitor = require('../services/systemHealthMonitor');
const performanceMonitor = require('../services/performanceMonitor');
const logger = require('../utils/logger');

/**
 * Health check middleware
 */
const healthCheckMiddleware = (req, res, next) => {
  // Add health check endpoints
  if (req.path === '/health') {
    return handleHealthCheck(req, res);
  }
  
  if (req.path === '/health/detailed') {
    return handleDetailedHealthCheck(req, res);
  }
  
  if (req.path === '/health/metrics') {
    return handleMetricsCheck(req, res);
  }
  
  // Continue to next middleware
  next();
};

/**
 * Basic health check
 */
const handleHealthCheck = async (req, res) => {
  try {
    const health = await systemHealthMonitor.getCurrentHealthStatus();
    
    const response = {
      status: health.overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Detailed health check
 */
const handleDetailedHealthCheck = async (req, res) => {
  try {
    const health = await systemHealthMonitor.getCurrentHealthStatus();
    const perfReport = performanceMonitor.getPerformanceReport();
    
    const response = {
      status: health.overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      details: health.details,
      metrics: health.metrics,
      performance: {
        requests: perfReport.metrics.requests,
        database: perfReport.metrics.database,
        cache: perfReport.metrics.cache,
        errors: perfReport.metrics.errors
      },
      recommendations: perfReport.recommendations,
      history: systemHealthMonitor.getHealthHistory(10)
    };
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Metrics check
 */
const handleMetricsCheck = async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const metrics = performanceMonitor.exportMetrics(format);
    
    if (format === 'prometheus') {
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } else {
      res.json(JSON.parse(metrics));
    }
  } catch (error) {
    logger.error('Metrics check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Metrics check failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * System health monitoring middleware
 */
const systemHealthMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track request start
  performanceMonitor.trackRequest(req, res, () => {
    // Continue to next middleware
    next();
  });
  
  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests
    if (responseTime > 5000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    // Track errors
    if (res.statusCode >= 500) {
      performanceMonitor.trackError(new Error(`HTTP ${res.statusCode}`), 'http_error');
    }
    
    originalSend.call(this, data);
  };
};

/**
 * Memory monitoring middleware
 */
const memoryMonitoringMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
  
  // Log high memory usage
  if (memoryUsagePercent > 0.8) {
    logger.warn(`High memory usage: ${(memoryUsagePercent * 100).toFixed(1)}%`);
  }
  
  // Force garbage collection if memory is very high
  if (memoryUsagePercent > 0.9 && global.gc) {
    logger.warn('Forcing garbage collection due to high memory usage');
    global.gc();
  }
  
  next();
};

/**
 * Error tracking middleware
 */
const errorTrackingMiddleware = (err, req, res, next) => {
  // Track error in performance monitor
  performanceMonitor.trackError(err, 'application_error');
  
  // Log error details
  logger.error('Application error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Send error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

/**
 * Initialize health monitoring
 */
const initializeHealthMonitoring = () => {
  // Start system health monitoring
  systemHealthMonitor.startMonitoring();
  
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // Register alert callbacks
  systemHealthMonitor.registerAlertCallback('performance', async (alert) => {
    logger.warn(`Performance Alert: ${alert.message}`);
    
    // Take action based on alert type
    switch (alert.type) {
      case 'memory':
        if (alert.level === 'emergency' && global.gc) {
          global.gc();
          logger.info('Forced garbage collection due to memory alert');
        }
        break;
      
      case 'response_time':
        if (alert.level === 'critical') {
          // Could implement request throttling here
          logger.warn('Critical response time - consider implementing throttling');
        }
        break;
    }
  });
  
  logger.info('Health monitoring initialized');
};

/**
 * Shutdown health monitoring
 */
const shutdownHealthMonitoring = () => {
  systemHealthMonitor.stopMonitoring();
  performanceMonitor.stopMonitoring();
  logger.info('Health monitoring shutdown');
};

// Graceful shutdown handling
process.on('SIGTERM', shutdownHealthMonitoring);
process.on('SIGINT', shutdownHealthMonitoring);

module.exports = {
  healthCheckMiddleware,
  systemHealthMiddleware,
  memoryMonitoringMiddleware,
  errorTrackingMiddleware,
  initializeHealthMonitoring,
  shutdownHealthMonitoring
};