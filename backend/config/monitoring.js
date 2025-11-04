module.exports = {
  // System health thresholds
  thresholds: {
    memory: {
      warning: 0.75,  // 75%
      critical: 0.90  // 90%
    },
    cpu: {
      warning: 0.70,  // 70%
      critical: 0.85  // 85%
    },
    responseTime: {
      warning: 2000,  // 2 seconds
      critical: 5000  // 5 seconds
    },
    errorRate: {
      warning: 0.05,  // 5%
      critical: 0.10  // 10%
    },
    diskSpace: {
      warning: 0.80,  // 80%
      critical: 0.95  // 95%
    },
    database: {
      queryTime: {
        warning: 2000,  // 2 seconds
        critical: 5000  // 5 seconds
      },
      slowQueryRate: {
        warning: 0.10,  // 10%
        critical: 0.20  // 20%
      }
    },
    cache: {
      hitRate: {
        warning: 0.50,  // 50%
        critical: 0.30  // 30%
      }
    }
  },

  // Monitoring intervals (in milliseconds)
  intervals: {
    healthCheck: 30000,     // 30 seconds
    metrics: 60000,         // 1 minute
    cleanup: 300000,        // 5 minutes
    alertCheck: 15000       // 15 seconds
  },

  // Auto-recovery settings
  autoRecovery: {
    enabled: true,
    maxAttempts: 3,
    cooldownPeriod: 300000, // 5 minutes
    actions: {
      memory: {
        forceGC: true,
        clearCaches: true,
        reduceConnections: true
      },
      cpu: {
        reduceConcurrency: true,
        pauseBackgroundTasks: true,
        enableThrottling: true
      },
      disk: {
        cleanupTempFiles: true,
        rotateLogs: true,
        compressOldFiles: true
      },
      responseTime: {
        enableAggressiveCaching: true,
        optimizeQueries: true,
        reduceComplexity: true
      }
    }
  },

  // Alert settings
  alerts: {
    enabled: true,
    channels: {
      console: true,
      file: true,
      webhook: false,
      email: false
    },
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    emailSettings: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO?.split(',') || []
    },
    rateLimiting: {
      maxAlertsPerHour: 10,
      cooldownPeriod: 300000 // 5 minutes between same alert types
    }
  },

  // Circuit breaker settings
  circuitBreaker: {
    database: {
      failureThreshold: 3,
      resetTimeout: 30000,    // 30 seconds
      monitoringPeriod: 10000 // 10 seconds
    },
    cache: {
      failureThreshold: 5,
      resetTimeout: 15000,    // 15 seconds
      monitoringPeriod: 5000  // 5 seconds
    },
    external: {
      failureThreshold: 10,
      resetTimeout: 60000,    // 1 minute
      monitoringPeriod: 30000 // 30 seconds
    }
  },

  // Performance monitoring
  performance: {
    trackRequests: true,
    trackDatabase: true,
    trackCache: true,
    trackMemory: true,
    trackCpu: true,
    
    // Request tracking
    slowRequestThreshold: 5000, // 5 seconds
    trackUserAgent: true,
    trackIP: false, // Set to true if needed for debugging
    
    // Database tracking
    slowQueryThreshold: 1000, // 1 second
    trackQueryPlans: false,   // Enable for detailed analysis
    
    // Memory tracking
    memoryLeakDetection: true,
    memoryLeakThreshold: 50 * 1024 * 1024, // 50MB growth per hour
    
    // Sampling rates (0.0 to 1.0)
    sampling: {
      requests: 1.0,    // Track all requests
      database: 1.0,    // Track all queries
      cache: 0.1,       // Track 10% of cache operations
      memory: 1.0       // Track all memory operations
    }
  },

  // Cache management
  cache: {
    maxSize: 1000,              // Maximum number of items
    ttl: 3600000,               // 1 hour default TTL
    cleanupInterval: 300000,    // 5 minutes
    compressionEnabled: true,
    compressionThreshold: 1024, // Compress items larger than 1KB
    
    // Cache strategies
    strategies: {
      lru: true,        // Least Recently Used
      ttl: true,        // Time To Live
      size: true        // Size-based eviction
    },
    
    // Memory pressure handling
    memoryPressure: {
      enabled: true,
      threshold: 0.8,   // 80% memory usage
      evictionRate: 0.2 // Evict 20% of cache
    }
  },

  // Connection pool settings
  connectionPool: {
    database: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    
    // Emergency settings (when system is under stress)
    emergency: {
      database: {
        min: 1,
        max: 5
      }
    }
  },

  // Queue management
  queue: {
    defaultConcurrency: 5,
    emergencyConcurrency: 2,
    maxQueueSize: 1000,
    processingTimeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    performance: {
      enabled: true,
      slowOperationThreshold: 1000, // 1 second
      includeStackTrace: false
    },
    health: {
      enabled: true,
      logInterval: 300000, // 5 minutes
      includeSystemMetrics: true
    },
    errors: {
      enabled: true,
      includeStackTrace: true,
      includeRequestDetails: true
    }
  },

  // Development vs Production settings
  environment: {
    development: {
      // More relaxed thresholds for development
      thresholds: {
        memory: { warning: 0.85, critical: 0.95 },
        cpu: { warning: 0.80, critical: 0.90 },
        responseTime: { warning: 5000, critical: 10000 }
      },
      intervals: {
        healthCheck: 60000, // 1 minute
        metrics: 120000     // 2 minutes
      },
      logging: {
        level: 'debug'
      }
    },
    
    production: {
      // Stricter thresholds for production
      thresholds: {
        memory: { warning: 0.70, critical: 0.85 },
        cpu: { warning: 0.60, critical: 0.80 },
        responseTime: { warning: 1000, critical: 3000 }
      },
      intervals: {
        healthCheck: 15000, // 15 seconds
        metrics: 30000      // 30 seconds
      },
      logging: {
        level: 'warn'
      }
    }
  },

  // Feature flags
  features: {
    healthMonitoring: true,
    performanceMonitoring: true,
    autoRecovery: true,
    circuitBreaker: true,
    memoryManagement: true,
    alerting: true,
    metricsExport: true,
    detailedLogging: process.env.NODE_ENV !== 'production'
  }
};

// Apply environment-specific overrides
const config = module.exports;
const env = process.env.NODE_ENV || 'development';

if (config.environment[env]) {
  const envConfig = config.environment[env];
  
  // Deep merge environment-specific settings
  Object.keys(envConfig).forEach(key => {
    if (typeof envConfig[key] === 'object' && !Array.isArray(envConfig[key])) {
      config[key] = { ...config[key], ...envConfig[key] };
    } else {
      config[key] = envConfig[key];
    }
  });
}