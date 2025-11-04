const express = require('express');
const Joi = require('joi');
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
    const result = await geminiAIService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: result.status,
        timestamp: new Date().toISOString(),
        features: {
          categorization: process.env.AI_CATEGORIZATION_ENABLED !== 'false',
          insights: process.env.AI_INSIGHTS_ENABLED !== 'false',
          recommendations: process.env.AI_RECOMMENDATIONS_ENABLED !== 'false',
          naturalLanguageQueries: process.env.AI_NL_QUERIES_ENABLED !== 'false'
        }
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
  cacheAIResponse((req) => `categorize:${req.body.description}:${req.body.amount}`, 3600),
  async (req, res, next) => {
    try {
      const { description, amount, context } = req.body;
      
      const result = await req.aiCircuitBreaker.execute(async () => {
        return await geminiAIService.categorizeExpense(description, amount, context);
      });
      
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



// GET /api/ai/stats - AI usage statistics (admin only)
router.get('/stats', async (req, res, next) => {
  try {
    // This would require admin authentication
    // For now, return basic stats
    
    res.json({
      success: true,
      data: {
        totalRequests: 0, // Implement actual stats
        successRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// Error handler for AI routes
router.use(aiErrorHandler);

module.exports = router;