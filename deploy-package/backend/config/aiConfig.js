const aiConfig = {
  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
  },

  // Rate Limiting
  rateLimiting: {
    maxRequestsPerMinute: parseInt(process.env.AI_RATE_LIMIT) || 60,
    maxRequestsPerHour: parseInt(process.env.AI_RATE_LIMIT_HOUR) || 1000,
    maxRequestsPerDay: parseInt(process.env.AI_RATE_LIMIT_DAY) || 10000,
  },

  // Feature Flags
  features: {
    expenseCategorizationEnabled: process.env.AI_CATEGORIZATION_ENABLED !== 'false',
    financialInsightsEnabled: process.env.AI_INSIGHTS_ENABLED !== 'false',
    recommendationsEnabled: process.env.AI_RECOMMENDATIONS_ENABLED !== 'false',
    naturalLanguageQueriesEnabled: process.env.AI_NL_QUERIES_ENABLED !== 'false',
  },

  // Caching
  cache: {
    enabled: process.env.AI_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.AI_CACHE_TTL) || 3600, // 1 hour
    maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE) || 1000,
  },

  // Logging
  logging: {
    enabled: process.env.AI_ENABLE_LOGGING !== 'false',
    level: process.env.AI_LOG_LEVEL || 'info',
    logRequests: process.env.AI_LOG_REQUESTS !== 'false',
    logResponses: process.env.AI_LOG_RESPONSES === 'true',
  },

  // Confidence Thresholds
  thresholds: {
    categorizationMinConfidence: parseInt(process.env.AI_CATEGORIZATION_MIN_CONFIDENCE) || 70,
    insightMinConfidence: parseInt(process.env.AI_INSIGHT_MIN_CONFIDENCE) || 60,
    recommendationMinConfidence: parseInt(process.env.AI_RECOMMENDATION_MIN_CONFIDENCE) || 75,
  },

  // Prompt Templates
  prompts: {
    categorization: {
      system: "You are a financial AI assistant specialized in categorizing expenses for Turkish users.",
      categories: [
        'Yiyecek ve İçecek',
        'Ulaşım',
        'Alışveriş',
        'Faturalar',
        'Eğlence',
        'Sağlık',
        'Eğitim',
        'Ev ve Yaşam',
        'Teknoloji',
        'Giyim',
        'Seyahat',
        'Diğer'
      ]
    },
    insights: {
      system: "You are a financial advisor providing insights to Turkish users about their spending patterns.",
      analysisTypes: [
        'spending_pattern',
        'budget_alert',
        'unusual_transaction',
        'saving_opportunity',
        'trend_analysis'
      ]
    },
    recommendations: {
      system: "You are a financial consultant providing personalized recommendations to Turkish users.",
      types: [
        'budget_optimization',
        'saving_strategy',
        'cost_reduction',
        'investment_suggestion'
      ]
    },
    naturalLanguage: {
      system: "You are a financial data assistant helping Turkish users query their financial information.",
      supportedLanguages: ['tr', 'en']
    }
  },

  // Error Handling
  errorHandling: {
    maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.AI_RETRY_DELAY) || 1000,
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS) || 30000,
  },

  // Security
  security: {
    encryptSensitiveData: process.env.AI_ENCRYPT_DATA !== 'false',
    anonymizeUserData: process.env.AI_ANONYMIZE_DATA === 'true',
    logSensitiveData: process.env.AI_LOG_SENSITIVE_DATA === 'true',
  }
};

// Validation
const validateConfig = () => {
  const errors = [];

  if (!aiConfig.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (aiConfig.rateLimiting.maxRequestsPerMinute <= 0) {
    errors.push('AI_RATE_LIMIT must be greater than 0');
  }

  if (aiConfig.cache.ttl <= 0) {
    errors.push('AI_CACHE_TTL must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`AI Configuration errors: ${errors.join(', ')}`);
  }
};

// Initialize configuration
try {
  validateConfig();
  console.log('AI Configuration loaded successfully');
} catch (error) {
  console.error('AI Configuration error:', error.message);
  process.exit(1);
}

module.exports = aiConfig;