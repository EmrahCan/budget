const express = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const reportPerformanceService = require('../services/reportPerformanceService');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for report endpoints
const reportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Çok fazla rapor isteği gönderildi, lütfen daha sonra tekrar deneyin',
    retryAfter: '15 dakika'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const heavyReportRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit heavy operations
  message: {
    error: 'Çok fazla ağır rapor isteği, lütfen daha sonra tekrar deneyin',
    retryAfter: '5 dakika'
  }
});

// Validation middleware
const validateReportFilters = [
  query('startDate').optional().isISO8601().withMessage('Geçersiz başlangıç tarihi formatı'),
  query('endDate').optional().isISO8601().withMessage('Geçersiz bitiş tarihi formatı'),
  query('categories').optional().isArray().withMessage('Kategoriler dizi olmalıdır'),
  query('accounts').optional().isArray().withMessage('Hesaplar dizi olmalıdır'),
  query('reportType').optional().isIn(['summary', 'detailed', 'comparison']).withMessage('Geçersiz rapor türü'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit 1-10000 arasında olmalıdır'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset negatif olamaz')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/reports/optimized/summary
 * Get optimized financial summary
 */
router.get('/summary', 
  reportRateLimit, 
  validateReportFilters,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categories: req.query.categories || [],
        userId: req.user.id
      };

      const startTime = Date.now();
      const result = await reportPerformanceService.executeOptimizedQuery(
        'financial_summary',
        filters,
        { 
          useCache: true, 
          cacheTimeout: 300,
          poolName: 'readonly'
        }
      );
      const queryTime = Date.now() - startTime;

      res.json({
        success: true,
        data: result,
        meta: {
          queryTime,
          cached: queryTime < 50,
          filters,
          timestamp: new Date().toISOString()
        }
      });

      logger.performance('financial_summary', queryTime, { userId: req.user.id });
    } catch (error) {
      logger.errorWithContext('Error in optimized summary endpoint', error, { 
        userId: req.user.id,
        query: req.query 
      });
      
      res.status(500).json({
        success: false,
        message: 'Rapor oluşturulurken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/reports/optimized/category-analysis
 * Get optimized category analysis
 */
router.get('/category-analysis',
  reportRateLimit,
  validateReportFilters,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categories: req.query.categories || [],
        groupBy: req.query.groupBy || 'category',
        userId: req.user.id
      };

      const startTime = Date.now();
      const result = await reportPerformanceService.executeOptimizedQuery(
        'category_analysis',
        filters,
        { 
          useCache: true, 
          cacheTimeout: 600,
          poolName: 'readonly'
        }
      );
      const queryTime = Date.now() - startTime;

      res.json({
        success: true,
        data: result,
        meta: {
          queryTime,
          cached: queryTime < 50,
          filters,
          timestamp: new Date().toISOString()
        }
      });

      logger.performance('category_analysis', queryTime, { userId: req.user.id });
    } catch (error) {
      logger.errorWithContext('Error in category analysis endpoint', error, { 
        userId: req.user.id,
        query: req.query 
      });
      
      res.status(500).json({
        success: false,
        message: 'Kategori analizi oluşturulurken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/reports/optimized/trend-analysis
 * Get optimized trend analysis
 */
router.get('/trend-analysis',
  reportRateLimit,
  validateReportFilters,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        interval: req.query.interval || 'month',
        categories: req.query.categories || [],
        userId: req.user.id
      };

      const startTime = Date.now();
      const result = await reportPerformanceService.executeOptimizedQuery(
        'trend_analysis',
        filters,
        { 
          useCache: true, 
          cacheTimeout: 900,
          poolName: 'readonly'
        }
      );
      const queryTime = Date.now() - startTime;

      res.json({
        success: true,
        data: result,
        meta: {
          queryTime,
          cached: queryTime < 50,
          filters,
          timestamp: new Date().toISOString()
        }
      });

      logger.performance('trend_analysis', queryTime, { userId: req.user.id });
    } catch (error) {
      logger.errorWithContext('Error in trend analysis endpoint', error, { 
        userId: req.user.id,
        query: req.query 
      });
      
      res.status(500).json({
        success: false,
        message: 'Trend analizi oluşturulurken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/reports/optimized/batch
 * Generate multiple reports in batch
 */
router.post('/batch',
  heavyReportRateLimit,
  [
    body('reports').isArray().withMessage('Raporlar dizi olmalıdır'),
    body('reports.*.queryType').isString().withMessage('Sorgu türü gereklidir'),
    body('reports.*.params').isObject().withMessage('Parametreler obje olmalıdır')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { reports, options = {} } = req.body;
      
      // Add userId to all report params
      const reportsWithUserId = reports.map(report => ({
        ...report,
        params: {
          ...report.params,
          userId: req.user.id
        }
      }));

      const startTime = Date.now();
      const result = await reportPerformanceService.executeBatchReports(
        reportsWithUserId,
        {
          maxConcurrency: 3,
          priority: options.priority || 'normal'
        }
      );
      const totalTime = Date.now() - startTime;

      res.json({
        success: true,
        data: result,
        meta: {
          totalTime,
          reportCount: reports.length,
          timestamp: new Date().toISOString()
        }
      });

      logger.performance('batch_reports', totalTime, { 
        userId: req.user.id,
        reportCount: reports.length,
        successful: result.summary.successful,
        failed: result.summary.failed
      });
    } catch (error) {
      logger.errorWithContext('Error in batch reports endpoint', error, { 
        userId: req.user.id,
        body: req.body 
      });
      
      res.status(500).json({
        success: false,
        message: 'Toplu rapor oluşturulurken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/reports/optimized/performance
 * Get performance metrics (admin only)
 */
router.get('/performance',
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem için admin yetkisi gereklidir'
        });
      }

      const metrics = await reportPerformanceService.getPerformanceMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.errorWithContext('Error getting performance metrics', error, { 
        userId: req.user.id 
      });
      
      res.status(500).json({
        success: false,
        message: 'Performans metrikleri alınırken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/reports/optimized/optimize
 * Trigger performance optimization (admin only)
 */
router.post('/optimize',
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem için admin yetkisi gereklidir'
        });
      }

      await reportPerformanceService.optimizePerformance();

      res.json({
        success: true,
        message: 'Performans optimizasyonu başlatıldı',
        timestamp: new Date().toISOString()
      });

      logger.info(`Performance optimization triggered by admin user ${req.user.id}`);
    } catch (error) {
      logger.errorWithContext('Error triggering optimization', error, { 
        userId: req.user.id 
      });
      
      res.status(500).json({
        success: false,
        message: 'Optimizasyon başlatılırken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/reports/optimized/health
 * Get system health status
 */
router.get('/health',
  async (req, res) => {
    try {
      const health = await reportPerformanceService.healthCheck();

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 206 : 503;

      res.status(statusCode).json({
        success: health.status !== 'critical',
        data: health
      });
    } catch (error) {
      logger.errorWithContext('Error in health check', error);
      
      res.status(503).json({
        success: false,
        message: 'Sistem durumu kontrol edilirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;