const connectionPoolManager = require('./connectionPoolManager');
const queryOptimizer = require('./queryOptimizer');
const enhancedCacheManager = require('./enhancedCacheManager');
const queueManager = require('./queueManager');
const performanceMonitor = require('./performanceMonitor');
const logger = require('../utils/logger');

class OptimizedReportService {
  constructor() {
    this.reportQueries = {
      summary: {
        income: `
          SELECT 
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
            COUNT(CASE WHEN amount > 0 THEN 1 END) as income_count
          FROM transactions 
          WHERE user_id = ? AND date BETWEEN ? AND ?
        `,
        expense: `
          SELECT 
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expense,
            COUNT(CASE WHEN amount < 0 THEN 1 END) as expense_count
          FROM transactions 
          WHERE user_id = ? AND date BETWEEN ? AND ?
        `,
        categoryBreakdown: `
          SELECT 
            c.name as category_name,
            c.type as category_type,
            COALESCE(SUM(ABS(t.amount)), 0) as total_amount,
            COUNT(t.id) as transaction_count
          FROM categories c
          LEFT JOIN transactions t ON c.id = t.category_id 
            AND t.user_id = ? AND t.date BETWEEN ? AND ?
          WHERE c.user_id = ? OR c.user_id IS NULL
          GROUP BY c.id, c.name, c.type
          ORDER BY total_amount DESC
        `
      },
      detailed: {
        transactions: `
          SELECT 
            t.id,
            t.amount,
            t.description,
            t.date,
            c.name as category_name,
            c.type as category_type
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = ? AND t.date BETWEEN ? AND ?
          ORDER BY t.date DESC, t.id DESC
          LIMIT ? OFFSET ?
        `,
        monthlyTrends: `
          SELECT 
            DATE_FORMAT(date, '%Y-%m') as month,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as monthly_income,
            SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as monthly_expense,
            COUNT(*) as transaction_count
          FROM transactions
          WHERE user_id = ? AND date BETWEEN ? AND ?
          GROUP BY DATE_FORMAT(date, '%Y-%m')
          ORDER BY month DESC
        `
      },
      comparison: {
        periodComparison: `
          SELECT 
            'current' as period,
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
          FROM transactions 
          WHERE user_id = ? AND date BETWEEN ? AND ?
          
          UNION ALL
          
          SELECT 
            'previous' as period,
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
          FROM transactions 
          WHERE user_id = ? AND date BETWEEN ? AND ?
        `
      }
    };
  }

  /**
   * Generate optimized report with caching and background processing
   */
  async generateReport(userId, filters, options = {}) {
    const {
      reportType = 'summary',
      useCache = true,
      useBackgroundProcessing = false,
      priority = 5
    } = options;

    try {
      const cacheKey = this.generateReportCacheKey(userId, filters, reportType);
      
      // Check cache first if enabled
      if (useCache) {
        const cachedReport = await enhancedCacheManager.get(cacheKey);
        if (cachedReport) {
          logger.debug(`Report served from cache: ${cacheKey}`);
          return cachedReport;
        }
      }

      // Use background processing for heavy reports
      if (useBackgroundProcessing) {
        const job = await queueManager.addReportGenerationJob({
          userId,
          filters,
          reportType
        }, { priority });
        
        return {
          jobId: job.id,
          status: 'processing',
          message: 'Report generation started in background'
        };
      }

      // Generate report synchronously
      const report = await this.generateReportData(userId, filters, reportType);
      
      // Cache the result
      if (useCache) {
        const cacheStrategy = enhancedCacheManager.getStrategy('reports');
        await enhancedCacheManager.set(cacheKey, report, cacheStrategy);
      }

      return report;
    } catch (error) {
      performanceMonitor.trackError(error, 'report_generation');
      logger.error('Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate report data with optimized queries
   */
  async generateReportData(userId, filters, reportType) {
    const { dateRange, categories = [] } = filters;
    const startTime = performance.now();

    try {
      let reportData = {};

      switch (reportType) {
        case 'summary':
          reportData = await this.generateSummaryReport(userId, dateRange, categories);
          break;
        case 'detailed':
          reportData = await this.generateDetailedReport(userId, dateRange, categories);
          break;
        case 'comparison':
          reportData = await this.generateComparisonReport(userId, dateRange, categories);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const executionTime = performance.now() - startTime;
      logger.info(`Report generated in ${executionTime.toFixed(2)}ms for user ${userId}`);

      return {
        ...reportData,
        metadata: {
          reportType,
          userId,
          filters,
          generatedAt: new Date().toISOString(),
          executionTime: executionTime.toFixed(2) + 'ms'
        }
      };
    } catch (error) {
      logger.error('Report data generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate summary report with optimized queries
   */
  async generateSummaryReport(userId, dateRange, categories) {
    const queries = [
      {
        key: 'income_summary',
        fn: () => connectionPoolManager.executeQuery(
          this.reportQueries.summary.income,
          [userId, dateRange.start, dateRange.end],
          { poolName: 'readonly' }
        ),
        type: 'read'
      },
      {
        key: 'expense_summary', 
        fn: () => connectionPoolManager.executeQuery(
          this.reportQueries.summary.expense,
          [userId, dateRange.start, dateRange.end],
          { poolName: 'readonly' }
        ),
        type: 'read'
      },
      {
        key: 'category_breakdown',
        fn: () => connectionPoolManager.executeQuery(
          this.reportQueries.summary.categoryBreakdown,
          [userId, dateRange.start, dateRange.end, userId],
          { poolName: 'readonly' }
        ),
        type: 'read'
      }
    ];

    const results = await queryOptimizer.executeBatchQueries(queries);
    
    const incomeData = results.income_summary[0] || { total_income: 0, income_count: 0 };
    const expenseData = results.expense_summary[0] || { total_expense: 0, expense_count: 0 };
    const categoryData = results.category_breakdown || [];

    return {
      summary: {
        totalIncome: parseFloat(incomeData.total_income) || 0,
        totalExpense: parseFloat(expenseData.total_expense) || 0,
        netIncome: (parseFloat(incomeData.total_income) || 0) - (parseFloat(expenseData.total_expense) || 0),
        transactionCount: (incomeData.income_count || 0) + (expenseData.expense_count || 0),
        savingsRate: incomeData.total_income > 0 
          ? (((incomeData.total_income - expenseData.total_expense) / incomeData.total_income) * 100)
          : 0,
        averageTransaction: ((incomeData.total_income || 0) + (expenseData.total_expense || 0)) / 
          Math.max(1, (incomeData.income_count || 0) + (expenseData.expense_count || 0))
      },
      categories: categoryData.map(cat => ({
        name: cat.category_name,
        type: cat.category_type,
        amount: parseFloat(cat.total_amount) || 0,
        transactionCount: cat.transaction_count || 0,
        percentage: expenseData.total_expense > 0 
          ? ((parseFloat(cat.total_amount) || 0) / expenseData.total_expense * 100)
          : 0
      }))
    };
  }

  /**
   * Generate detailed report with pagination
   */
  async generateDetailedReport(userId, dateRange, categories, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const queries = [
      {
        key: 'detailed_transactions',
        fn: () => connectionPoolManager.executeQuery(
          this.reportQueries.detailed.transactions,
          [userId, dateRange.start, dateRange.end, limit, offset],
          { poolName: 'readonly' }
        ),
        type: 'read'
      },
      {
        key: 'monthly_trends',
        fn: () => connectionPoolManager.executeQuery(
          this.reportQueries.detailed.monthlyTrends,
          [userId, dateRange.start, dateRange.end],
          { poolName: 'readonly' }
        ),
        type: 'read'
      }
    ];

    const results = await queryOptimizer.executeBatchQueries(queries);
    
    // Also get summary data
    const summaryData = await this.generateSummaryReport(userId, dateRange, categories);

    return {
      ...summaryData,
      transactions: results.detailed_transactions || [],
      trends: results.monthly_trends || [],
      pagination: {
        page,
        limit,
        hasMore: (results.detailed_transactions || []).length === limit
      }
    };
  }

  /**
   * Generate comparison report
   */
  async generateComparisonReport(userId, dateRange, categories) {
    // Calculate previous period
    const currentStart = new Date(dateRange.start);
    const currentEnd = new Date(dateRange.end);
    const periodLength = currentEnd - currentStart;
    
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime() - 1);

    const comparisonQuery = this.reportQueries.comparison.periodComparison;
    
    const results = await connectionPoolManager.executeQuery(
      comparisonQuery,
      [
        userId, dateRange.start, dateRange.end,
        userId, previousStart.toISOString().split('T')[0], previousEnd.toISOString().split('T')[0]
      ],
      { poolName: 'readonly' }
    );

    const currentPeriod = results.find(r => r.period === 'current') || { income: 0, expense: 0 };
    const previousPeriod = results.find(r => r.period === 'previous') || { income: 0, expense: 0 };

    // Get detailed data for current period
    const detailedData = await this.generateDetailedReport(userId, dateRange, categories);

    return {
      ...detailedData,
      comparison: {
        current: {
          income: parseFloat(currentPeriod.income) || 0,
          expense: parseFloat(currentPeriod.expense) || 0,
          net: (parseFloat(currentPeriod.income) || 0) - (parseFloat(currentPeriod.expense) || 0)
        },
        previous: {
          income: parseFloat(previousPeriod.income) || 0,
          expense: parseFloat(previousPeriod.expense) || 0,
          net: (parseFloat(previousPeriod.income) || 0) - (parseFloat(previousPeriod.expense) || 0)
        },
        changes: {
          income: this.calculatePercentageChange(previousPeriod.income, currentPeriod.income),
          expense: this.calculatePercentageChange(previousPeriod.expense, currentPeriod.expense),
          net: this.calculatePercentageChange(
            (parseFloat(previousPeriod.income) || 0) - (parseFloat(previousPeriod.expense) || 0),
            (parseFloat(currentPeriod.income) || 0) - (parseFloat(currentPeriod.expense) || 0)
          )
        }
      }
    };
  }

  /**
   * Generate cache key for reports
   */
  generateReportCacheKey(userId, filters, reportType) {
    const keyParts = [
      'report',
      reportType,
      userId,
      filters.dateRange.start,
      filters.dateRange.end,
      (filters.categories || []).sort().join(',') || 'all'
    ];
    
    return keyParts.join(':');
  }

  /**
   * Preload frequently accessed reports
   */
  async preloadReports(userId) {
    const commonFilters = [
      // Current month
      {
        dateRange: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        categories: []
      },
      // Last 3 months
      {
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        categories: []
      }
    ];

    const preloadPromises = [];
    
    for (const filters of commonFilters) {
      for (const reportType of ['summary', 'detailed']) {
        preloadPromises.push(
          this.generateReport(userId, filters, { 
            reportType, 
            useCache: true,
            useBackgroundProcessing: true,
            priority: 3
          })
        );
      }
    }

    try {
      await Promise.all(preloadPromises);
      logger.info(`Reports preloaded for user ${userId}`);
    } catch (error) {
      logger.warn(`Report preloading failed for user ${userId}:`, error);
    }
  }

  /**
   * Get report generation status (for background jobs)
   */
  async getReportStatus(jobId) {
    // This would check the job status in the queue
    const queueStats = queueManager.getAllQueueStats();
    
    // Simplified status check
    return {
      jobId,
      status: 'completed', // This would be dynamic based on actual job status
      progress: 100,
      result: null
    };
  }

  /**
   * Invalidate report cache for user
   */
  async invalidateUserReportCache(userId) {
    try {
      await enhancedCacheManager.invalidateByTags([`user:${userId}`, 'reports']);
      logger.info(`Report cache invalidated for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate cache for user ${userId}:`, error);
    }
  }

  /**
   * Get report service performance metrics
   */
  getServiceMetrics() {
    return {
      cache: enhancedCacheManager.getStats(),
      queues: queueManager.getAllQueueStats(),
      database: connectionPoolManager.getAllPoolStats(),
      performance: performanceMonitor.getPerformanceReport()
    };
  }

  /**
   * Optimize report queries based on usage patterns
   */
  async optimizeQueries() {
    try {
      const analysis = await queryOptimizer.analyzeQueryPerformance();
      
      // Log optimization suggestions
      if (analysis.recommendations.length > 0) {
        logger.info('Query optimization recommendations:', analysis.recommendations);
      }
      
      // Clear slow query cache
      if (analysis.slowQueries.length > 0) {
        const slowQueryKeys = analysis.slowQueries.map(q => q.query);
        for (const key of slowQueryKeys) {
          queryOptimizer.clearCache(key);
        }
      }
      
      return analysis;
    } catch (error) {
      logger.error('Query optimization failed:', error);
      throw error;
    }
  }

  // Private methods
  calculatePercentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }

  /**
   * Process report generation (used by queue processor)
   */
  async processReportGeneration(reportData, format, userId) {
    try {
      const { filters, reportType } = reportData;
      
      // Generate the actual report
      const report = await this.generateReportData(userId, filters, reportType);
      
      // Cache the result
      const cacheKey = this.generateReportCacheKey(userId, filters, reportType);
      const cacheStrategy = enhancedCacheManager.getStrategy('reports');
      await enhancedCacheManager.set(cacheKey, report, cacheStrategy);
      
      return {
        success: true,
        report,
        format,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Background report generation failed:', error);
      throw error;
    }
  }
}

module.exports = new OptimizedReportService();