module.exports = {
  // System health monitoring configuration
  monitoring: {
    enabled: true,
    interval: 10000, // 10 seconds
    
    // Memory thresholds
    memory: {
      warning: 0.75,    // 75%
      critical: 0.85,   // 85%
      emergency: 0.95   // 95%
    },
    
    // CPU thresholds
    cpu: {
      warning: 0.70,    // 70%
      critical: 0.85,   // 85%
      emergency: 0.95   // 95%
    },
    
    // Response time thresholds (milliseconds)
    responseTime: {
      warning: 2000,    // 2 seconds
      critical: 5000,   // 5 seconds
      emergency: 10000  // 10 seconds
    },
    
    // Error rate thresholds
    errorRate: {
      warning: 0.05,    // 5%
      critical: 0.10,   // 10%
      emergency: 0.20   // 20%
    }
  },
  
  // Automatic cleanup configuration
  cleanup: {
    enabled: true,
    
    // Memory cleanup strategies
    memory: {
      forceGC: true,              // Force garbage collection
      clearCaches: true,          // Clear application caches
      optimizeConnections: true,  // Optimize database connections
      cleanupTempFiles: true      // Clean temporary files
    },
    
    // Performance optimization strategies
    performance: {
      optimizeQueries: true,      // Optimize slow database queries
      adjustCacheSize: true,      // Adjust cache sizes
      throttleRequests: false,    // Throttle incoming requests (disabled by default)
      clearMetrics: true          // Clear old performance metrics
    }
  },
  
  // Alert configuration
  alerts: {
    enabled: true,
    
    // Alert channels
    channels: {
      console: true,              // Log to console
      file: true,                 // Log to file
      webhook: false,             // Send to webhook (disabled by default)
      email: false                // Send email alerts (disabled by default)
    },
    
    // Alert frequency limits
    rateLimit: {
      maxAlertsPerMinute: 5,      // Maximum alerts per minute
      cooldownPeriod: 300000      // 5 minutes cooldown between same alert types
    }
  },
  
  // Database connection pool configuration
  database: {
    pool: {
      min: 2,                     // Minimum connections
      max: 10,                    // Maximum connections
      acquireTimeoutMillis: 30000, // 30 seconds
      idleTimeoutMillis: 600000,  // 10 minutes
      reapIntervalMillis: 1000,   // 1 second
      createRetryIntervalMillis: 200
    },
    
    // Query optimization
    queryOptimization: {
      enabled: true,
      slowQueryThreshold: 1000,   // 1 second
      explainSlowQueries: true,
      cacheQueryPlans: true
    }
  },
  
  // Cache configuration
  cache: {
    // Memory cache settings
    memory: {
      maxSize: 100,               // Maximum items in cache
      ttl: 300000,                // 5 minutes TTL
      checkPeriod: 60000          // Check every minute
    },
    
    // Redis cache settings (if using Redis)
    redis: {
      enabled: false,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'budget_app:',
      ttl: 3600                   // 1 hour default TTL
    }
  },
  
  // Request handling configuration
  requests: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000,   // 15 minutes
      max: 1000,                  // Max requests per window
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // Request timeout
    timeout: 30000,               // 30 seconds
    
    // Body size limits
    bodyLimit: {
      json: '10mb',
      urlencoded: '10mb',
      raw: '10mb',
      text: '10mb'
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    
    // Performance logging
    performance: {
      logSlowRequests: true,
      slowRequestThreshold: 1000, // 1 second
      logMemoryUsage: true,
      memoryLogInterval: 60000    // 1 minute
    },
    
    // Error logging
    errors: {
      logStackTrace: process.env.NODE_ENV !== 'production',
      logRequestDetails: true,
      logUserContext: false       // Don't log sensitive user data
    }
  },
  
  // Development vs Production settings
  environment: {
    development: {
      monitoring: {
        interval: 5000,           // More frequent monitoring
        verbose: true             // Verbose logging
      },
      cleanup: {
        aggressive: false         // Less aggressive cleanup
      }
    },
    
    production: {
      monitoring: {
        interval: 30000,          // Less frequent monitoring
        verbose: false            // Less verbose logging
      },
      cleanup: {
        aggressive: true          // More aggressive cleanup
      }
    }
  }
};