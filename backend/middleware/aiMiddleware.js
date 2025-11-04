const aiConfig = require('../config/aiConfig');

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// AI Rate Limiting Middleware
const aiRateLimit = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, {
      count: 0,
      resetTime: now + windowMs
    });
  }
  
  const userLimit = rateLimitStore.get(userId);
  
  // Reset if window expired
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  // Check limit
  if (userLimit.count >= aiConfig.rateLimiting.maxRequestsPerMinute) {
    return res.status(429).json({
      success: false,
      error: 'AI rate limit exceeded',
      message: 'Too many AI requests. Please try again later.',
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }
  
  userLimit.count++;
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': aiConfig.rateLimiting.maxRequestsPerMinute,
    'X-RateLimit-Remaining': aiConfig.rateLimiting.maxRequestsPerMinute - userLimit.count,
    'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
  });
  
  next();
};

// AI Feature Check Middleware
const checkAIFeature = (featureName) => {
  return (req, res, next) => {
    if (!aiConfig.features[featureName]) {
      return res.status(503).json({
        success: false,
        error: 'Feature disabled',
        message: `AI feature '${featureName}' is currently disabled`
      });
    }
    next();
  };
};

// AI Request Logging Middleware
const aiRequestLogger = (req, res, next) => {
  if (!aiConfig.logging.enabled || !aiConfig.logging.logRequests) {
    return next();
  }
  
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(`[AI Request] ${req.method} ${req.path}`, {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      duration,
      statusCode: res.statusCode,
      requestBody: aiConfig.logging.logSensitiveData ? req.body : '[REDACTED]',
      responseSize: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// AI Error Handler Middleware
const aiErrorHandler = (error, req, res, next) => {
  console.error('[AI Error]', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Rate limit errors
  if (error.message.includes('Rate limit exceeded')) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'AI service is temporarily unavailable due to rate limiting'
    });
  }
  
  // API key errors
  if (error.message.includes('API key') || error.message.includes('authentication')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'AI service authentication failed'
    });
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'Request timeout',
      message: 'AI service request timed out'
    });
  }
  
  // Generic AI service errors
  if (error.message.includes('AI') || error.message.includes('Gemini')) {
    return res.status(503).json({
      success: false,
      error: 'AI service unavailable',
      message: 'AI service is temporarily unavailable'
    });
  }
  
  // Pass other errors to default handler
  next(error);
};

// AI Request Validation Middleware
const validateAIRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
};

// AI Response Cache Middleware
const aiCache = new Map();

const cacheAIResponse = (cacheKey, ttl = aiConfig.cache.ttl) => {
  return (req, res, next) => {
    if (!aiConfig.cache.enabled) {
      return next();
    }
    
    const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
    const cached = aiCache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      console.log(`[AI Cache] Hit for key: ${key}`);
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200 && data.success) {
        aiCache.set(key, {
          data,
          expiry: Date.now() + (ttl * 1000)
        });
        
        // Clean up old cache entries
        if (aiCache.size > aiConfig.cache.maxSize) {
          const oldestKey = aiCache.keys().next().value;
          aiCache.delete(oldestKey);
        }
        
        console.log(`[AI Cache] Stored for key: ${key}`);
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Circuit Breaker for AI Service
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

const aiCircuitBreaker = new CircuitBreaker();

const circuitBreakerMiddleware = (req, res, next) => {
  req.aiCircuitBreaker = aiCircuitBreaker;
  next();
};

module.exports = {
  aiRateLimit,
  checkAIFeature,
  aiRequestLogger,
  aiErrorHandler,
  validateAIRequest,
  cacheAIResponse,
  circuitBreakerMiddleware,
  CircuitBreaker
};