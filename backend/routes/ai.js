const express = require('express');
const Joi = require('joi');
const aiOrchestrator = require('../services/aiOrchestrator');
const geminiAIService = require('../services/geminiAIService');
const { 
  aiRateLimit, 
  checkAIFeature, 
  aiRequestLogger, 
  aiErrorHandler,
  validateAIRequest,
  cacheAIResponse,
  circuitBreakerMiddleware
} = require('../middleware/aiMiddleware');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint (no auth required)
router.get('/health', async (req, res, next) => {
  try {
    const result = await aiOrchestrator.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: result.status,
        services: result.services,
        features: result.features,
        cache: result.cache,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// Apply middleware to all other AI routes
router.use(authenticateToken);
router.use(aiRateLimit);
router.use(aiRequestLogger);
router.use(circuitBreakerMiddleware);

// Validation schemas
const categorizationSchema = Joi.object({
  description: Joi.string().required().min(1).max(500),
  amount: Joi.number().required().min(0),
  context: Joi.object().optional()
});

const insightsSchema = Joi.object({
  timeframe: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly').default('monthly'),
  includeRecommendations: Joi.boolean().default(true)
});

const recommendationsSchema = Joi.object({
  userProfile: Joi.object().optional(),
  includeInvestments: Joi.boolean().default(false)
});

const querySchema = Joi.object({
  query: Joi.string().required().min(1).max(1000),
  language: Joi.string().valid('tr', 'en').default('tr')
});

// POST /api/ai/categorize - Expense categorization
router.post('/categorize', 
  checkAIFeature('expenseCategorizationEnabled'),
  validateAIRequest(categorizationSchema),
  async (req, res, next) => {
    try {
      const { description, amount, context } = req.body;
      const userId = req.user.id;
      
      const result = await aiOrchestrator.processRequest(
        'categorize',
        { description, amount, context },
        userId,
        { useCache: true, cacheTTL: 3600000 }
      );
      
      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: 'Categorization failed',
          message: result.error,
          fallback: result.fallback
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        cached: result.cached,
        processingTime: result.processingTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/insights - Financial insights
router.get('/insights',
  checkAIFeature('financialInsightsEnabled'),
  validateAIRequest(insightsSchema),
  cacheAIResponse((req) => `insights:${req.user.id}:${req.query.timeframe}`, 1800),
  async (req, res, next) => {
    try {
      const { timeframe } = req.query;
      const userId = req.user.id;
      
      // Get user's financial data (this would be implemented based on your data structure)
      const userData = {
        userId,
        timeframe,
        // Add actual user financial data here
        transactions: [], // Get from database
        accounts: [], // Get from database
        budgets: [] // Get from database
      };
      
      const result = await req.aiCircuitBreaker.execute(async () => {
        return await geminiAIService.generateFinancialInsights(userData, timeframe);
      });
      
      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: 'Insights generation failed',
          message: result.error
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/recommendations - Personalized recommendations
router.get('/recommendations',
  checkAIFeature('recommendationsEnabled'),
  validateAIRequest(recommendationsSchema),
  cacheAIResponse((req) => `recommendations:${req.user.id}`, 3600),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { includeInvestments } = req.query;
      
      // Get user profile and financial data
      const userProfile = {
        userId,
        preferences: {
          includeInvestments: includeInvestments === 'true'
        }
        // Add actual user profile data
      };
      
      const financialData = {
        // Add actual financial data
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        debts: 0
      };
      
      const result = await req.aiCircuitBreaker.execute(async () => {
        return await geminiAIService.getPersonalizedRecommendations(userProfile, financialData);
      });
      
      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: 'Recommendations generation failed',
          message: result.error
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/ai/query - Natural language queries
router.post('/query',
  checkAIFeature('naturalLanguageQueriesEnabled'),
  validateAIRequest(querySchema),
  async (req, res, next) => {
    try {
      const { query, language } = req.body;
      const userId = req.user.id;
      
      const userContext = {
        userId,
        language,
        // Add user context data
      };
      
      const result = await req.aiCircuitBreaker.execute(async () => {
        return await geminiAIService.processNaturalLanguageQuery(query, userContext);
      });
      
      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: 'Query processing failed',
          message: result.error
        });
      }
      
      // Store query in history (implement as needed)
      // await storeQueryHistory(userId, query, result.data);
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);



// GET /api/ai/rate-limit - Get user's rate limit status
router.get('/rate-limit', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = aiOrchestrator.getRateLimitStatus(userId);
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/cache/stats - Get cache statistics
router.get('/cache/stats', async (req, res, next) => {
  try {
    const stats = aiOrchestrator.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ai/cache - Clear user's cache
router.delete('/cache', async (req, res, next) => {
  try {
    const userId = req.user.id;
    aiOrchestrator.clearCache({ userId });
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/categorize/feedback - Learn from user corrections
router.post('/categorize/feedback',
  validateAIRequest(Joi.object({
    transactionId: Joi.string().required(),
    description: Joi.string().required(),
    suggestedCategory: Joi.string().required(),
    actualCategory: Joi.string().required()
  })),
  async (req, res, next) => {
    try {
      const { transactionId, description, suggestedCategory, actualCategory } = req.body;
      const userId = req.user.id;
      
      const categorizationService = require('../services/categorizationService');
      const result = await categorizationService.learnFromCorrection(
        userId,
        transactionId,
        description,
        suggestedCategory,
        actualCategory
      );
      
      res.json({
        success: result.success,
        message: result.message || 'AI öğrendi. Gelecek öneriler daha iyi olacak.',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/categorize/stats - Get user's categorization statistics
router.get('/categorize/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const categorizationService = require('../services/categorizationService');
    
    const result = await categorizationService.getUserCategorizationStats(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/categorize/suggestions - Get category suggestions
router.get('/categorize/suggestions',
  validateAIRequest(Joi.object({
    description: Joi.string().required().min(2).max(500)
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { description } = req.query;
      const categorizationService = require('../services/categorizationService');
      
      const result = await categorizationService.getSuggestions(userId, description);
      
      res.json({
        success: true,
        data: result.data || [],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/ai/categorize/batch - Batch categorize transactions
router.post('/categorize/batch',
  validateAIRequest(Joi.object({
    transactions: Joi.array().items(
      Joi.object({
        id: Joi.string().optional(),
        description: Joi.string().required(),
        amount: Joi.number().required(),
        context: Joi.object().optional()
      })
    ).min(1).max(50)
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { transactions } = req.body;
      const categorizationService = require('../services/categorizationService');
      
      const result = await categorizationService.batchCategorize(userId, transactions);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/ai/categorize/learning - Clear learning data
router.delete('/categorize/learning',
  validateAIRequest(Joi.object({
    category: Joi.string().optional()
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { category } = req.query;
      const categorizationService = require('../services/categorizationService');
      
      const result = await categorizationService.clearLearningData(userId, category);
      
      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/ai/anomaly/check - Check if transaction is anomalous
router.post('/anomaly/check',
  validateAIRequest(Joi.object({
    amount: Joi.number().required().min(0),
    category: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    date: Joi.date().optional()
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const transaction = req.body;
      const anomalyService = require('../services/anomalyDetectionService');
      
      const result = await anomalyService.detectAnomaly(transaction, userId);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      // Log the anomaly check
      if (result.data.isAnomaly) {
        await db.query(`
          INSERT INTO ai_interactions (
            user_id,
            interaction_type,
            request_data,
            response_data,
            confidence_score,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          userId,
          'anomaly_detection',
          JSON.stringify(transaction),
          JSON.stringify(result.data),
          result.data.zScore || 0
        ]);
      }
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/ai/anomaly/confirm - Confirm transaction as normal or fraudulent
router.post('/anomaly/confirm',
  validateAIRequest(Joi.object({
    transactionId: Joi.string().optional(),
    transaction: Joi.object({
      amount: Joi.number().required(),
      category: Joi.string().required(),
      description: Joi.string().optional()
    }).required(),
    isNormal: Joi.boolean().required(),
    userFeedback: Joi.string().optional()
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { transaction, isNormal, userFeedback } = req.body;
      const anomalyService = require('../services/anomalyDetectionService');
      
      // Update user profile based on confirmation
      const result = await anomalyService.updateUserProfile(userId, transaction, isNormal);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      // Log user feedback
      await db.query(`
        INSERT INTO ai_interactions (
          user_id,
          interaction_type,
          request_data,
          response_data,
          user_feedback,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        userId,
        'anomaly_confirmation',
        JSON.stringify(transaction),
        JSON.stringify({ isNormal }),
        userFeedback || (isNormal ? 'confirmed_normal' : 'confirmed_anomaly')
      ]);
      
      res.json({
        success: true,
        message: isNormal ? 'İşlem normal olarak kaydedildi' : 'İşlem şüpheli olarak işaretlendi',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/anomaly/stats - Get anomaly detection statistics
router.get('/anomaly/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const anomalyService = require('../services/anomalyDetectionService');
    
    const result = await anomalyService.getAnomalyStats(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/anomaly/rebuild-profile - Rebuild user spending profile
router.post('/anomaly/rebuild-profile',
  validateAIRequest(Joi.object({
    category: Joi.string().optional()
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { category } = req.body;
      const anomalyService = require('../services/anomalyDetectionService');
      
      const result = await anomalyService.rebuildUserProfile(userId, category);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        message: result.message,
        categoriesUpdated: result.categoriesUpdated,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/budget/performance - Get budget performance evaluation
router.get('/budget/performance', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const predictiveService = require('../services/predictiveAnalyticsService');
    
    const result = await predictiveService.evaluateBudgetPerformance(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/budget/adjust - Get budget adjustment suggestions
router.post('/budget/adjust', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const predictiveService = require('../services/predictiveAnalyticsService');
    
    // First get current performance
    const performance = await predictiveService.evaluateBudgetPerformance(userId);
    
    if (!performance.success) {
      return res.status(400).json({
        success: false,
        error: performance.error
      });
    }
    
    // Suggestions are already included in performance data
    res.json({
      success: true,
      data: {
        suggestions: performance.data.improvements,
        currentPerformance: {
          score: performance.data.performanceScore,
          utilization: performance.data.overallUtilization
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/coach/ask - Ask financial coach a question
router.post('/coach/ask',
  validateAIRequest(Joi.object({
    question: Joi.string().required().min(5).max(500)
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { question } = req.body;
      const financialCoachService = require('../services/financialCoachService');
      
      const result = await financialCoachService.answerQuestion(question, userId);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/coach/health-report - Get financial health report
router.get('/coach/health-report', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const financialCoachService = require('../services/financialCoachService');
    
    const result = await financialCoachService.generateHealthReport(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/coach/progress - Get coaching progress
router.get('/coach/progress', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const financialCoachService = require('../services/financialCoachService');
    
    const result = await financialCoachService.trackProgress(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/ocr/receipt - Process receipt image (stub)
router.post('/ocr/receipt', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ocrService = require('../services/ocrService');
    
    // TODO: Implement file upload with multer
    // const imageBuffer = req.file.buffer;
    
    const result = await ocrService.processReceipt(null, userId);
    
    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/voice/process - Process voice command (stub)
router.post('/voice/process',
  validateAIRequest(Joi.object({
    transcript: Joi.string().required().min(2).max(200)
  })),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { transcript } = req.body;
      const voiceService = require('../services/voiceCommandService');
      
      const result = await voiceService.processCommand(transcript, userId);
      
      res.json({
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/ai/voice/commands - Get supported voice commands
router.get('/voice/commands', async (req, res, next) => {
  try {
    const voiceService = require('../services/voiceCommandService');
    const commands = voiceService.getSupportedCommands();
    
    res.json({
      success: true,
      data: { commands },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/stats - AI usage statistics (admin only)
router.get('/stats', async (req, res, next) => {
  try {
    // This would require admin authentication
    // For now, return basic stats
    const cacheStats = aiOrchestrator.getCacheStats();
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        features: aiOrchestrator.features,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/financial-summary - Generate AI financial summary
router.post('/financial-summary', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, period = 'month' } = req.body;
    
    // Get user's financial data
    const db = require('../config/database');
    
    // Get transactions
    const transactionsQuery = `
      SELECT type, category, amount, description, transaction_date
      FROM transactions
      WHERE user_id = $1
      ${startDate ? 'AND transaction_date >= $2' : ''}
      ${endDate ? 'AND transaction_date <= $3' : ''}
      ORDER BY transaction_date DESC
      LIMIT 100
    `;
    
    const params = [userId];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const transactionsResult = await db.query(transactionsQuery, params);
    const transactions = transactionsResult.rows;
    
    // Get active fixed payments
    const fixedPaymentsQuery = `
      SELECT name, amount, category, due_day
      FROM fixed_payments
      WHERE user_id = $1 AND is_active = true
    `;
    const fixedPaymentsResult = await db.query(fixedPaymentsQuery, [userId]);
    const fixedPayments = fixedPaymentsResult.rows;
    
    // Calculate summary
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: transactions.length,
      categories: {},
      fixedPayments: {
        monthly: 0,
        count: fixedPayments.length,
        items: []
      }
    };
    
    // Process transactions
    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.totalIncome += parseFloat(t.amount);
      } else if (t.type === 'expense') {
        summary.totalExpense += parseFloat(t.amount);
      }
      
      if (t.category) {
        if (!summary.categories[t.category]) {
          summary.categories[t.category] = { total: 0, count: 0 };
        }
        summary.categories[t.category].total += parseFloat(t.amount);
        summary.categories[t.category].count += 1;
      }
    });
    
    // Process fixed payments (all are monthly by default)
    fixedPayments.forEach(fp => {
      const amount = parseFloat(fp.amount);
      const monthlyAmount = amount; // Fixed payments are monthly
      
      summary.fixedPayments.monthly += monthlyAmount;
      summary.fixedPayments.items.push({
        name: fp.name,
        amount: amount,
        monthlyAmount: monthlyAmount,
        category: fp.category,
        dueDay: fp.due_day
      });
      
      // Add to categories
      if (fp.category) {
        if (!summary.categories[fp.category]) {
          summary.categories[fp.category] = { total: 0, count: 0, fixed: 0 };
        }
        summary.categories[fp.category].fixed = (summary.categories[fp.category].fixed || 0) + monthlyAmount;
        summary.categories[fp.category].total += monthlyAmount;
      }
    });
    
    // Calculate total expense including fixed payments
    summary.totalExpenseWithFixed = summary.totalExpense + summary.fixedPayments.monthly;
    summary.netIncome = summary.totalIncome - summary.totalExpenseWithFixed;
    summary.savingsRate = summary.totalIncome > 0 
      ? ((summary.netIncome / summary.totalIncome) * 100).toFixed(2)
      : 0;
    
    // Generate AI insights
    const prompt = `
      Aşağıdaki finansal verileri analiz et ve Türkçe bir özet oluştur:
      
      Toplam Gelir: ${summary.totalIncome.toFixed(2)} TL
      Toplam Gider (İşlemler): ${summary.totalExpense.toFixed(2)} TL
      Sabit Ödemeler (Aylık): ${summary.fixedPayments.monthly.toFixed(2)} TL
      Toplam Gider (Sabit Dahil): ${summary.totalExpenseWithFixed.toFixed(2)} TL
      Net Gelir: ${summary.netIncome.toFixed(2)} TL
      Tasarruf Oranı: %${summary.savingsRate}
      İşlem Sayısı: ${summary.transactionCount}
      
      Sabit Ödemeler (Aylık):
      - Toplam Sabit Ödeme: ${summary.fixedPayments.monthly.toFixed(2)} TL
      - Sabit Ödeme Sayısı: ${summary.fixedPayments.count}
      ${summary.fixedPayments.items.map(fp => 
        `- ${fp.name}: ${fp.monthlyAmount.toFixed(2)} TL/ay${fp.dueDay ? ` (Her ayın ${fp.dueDay}. günü)` : ''}`
      ).join('\n')}
      
      Kategori Bazında Harcamalar:
      ${Object.entries(summary.categories).map(([cat, data]) => 
        `- ${cat}: ${data.total.toFixed(2)} TL (${data.count} işlem)${data.fixed ? ` + ${data.fixed.toFixed(2)} TL sabit` : ''}`
      ).join('\n')}
      
      Lütfen şunları içeren bir özet oluştur:
      1. Genel finansal durum değerlendirmesi (2-3 cümle, sabit ödemeleri de dikkate al)
      2. En çok harcama yapılan 3 kategori (sabit ödemeler dahil)
      3. Tasarruf durumu hakkında yorum
      4. 2-3 pratik öneri
      
      Yanıtı JSON formatında ver:
      {
        "overview": "Genel değerlendirme",
        "topCategories": ["kategori1", "kategori2", "kategori3"],
        "savingsAnalysis": "Tasarruf analizi",
        "recommendations": ["öneri1", "öneri2", "öneri3"]
      }
    `;
    
    const aiResult = await geminiAIService.generateContent(prompt);
    
    res.json({
      success: true,
      data: {
        summary,
        aiInsights: aiResult.data,
        period,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Financial summary error:', error);
    next(error);
  }
});

// Error handler for AI routes
router.use(aiErrorHandler);

module.exports = router;