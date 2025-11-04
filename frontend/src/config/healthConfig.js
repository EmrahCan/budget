const healthConfig = {
  // Memory management configuration
  memory: {
    // Memory thresholds
    thresholds: {
      warning: 0.75,    // 75%
      critical: 0.85,   // 85%
      emergency: 0.95   // 95%
    },
    
    // Cache management
    cache: {
      maxSize: 100,               // Maximum cached items
      cleanupInterval: 30000,     // 30 seconds
      maxAge: 300000,             // 5 minutes max age
      enableAutoCleanup: true
    },
    
    // Component tracking
    components: {
      maxRegistered: 50,          // Maximum registered components
      cleanupInactive: true,      // Cleanup inactive components
      trackLargeObjects: true     // Track objects > 1MB
    }
  },
  
  // Performance monitoring configuration
  performance: {
    // Render performance
    rendering: {
      slowRenderThreshold: 16,    // 60fps threshold (16ms)
      criticalRenderThreshold: 100, // 100ms critical threshold
      trackRenderTimes: true,
      maxRenderHistory: 50        // Keep last 50 render times
    },
    
    // Network performance
    network: {
      slowRequestThreshold: 2000, // 2 seconds
      criticalRequestThreshold: 5000, // 5 seconds
      maxRequestHistory: 100,     // Keep last 100 requests
      trackErrors: true
    },
    
    // General performance
    monitoring: {
      interval: 10000,            // 10 seconds
      enableAutoOptimization: true,
      collectMetrics: true
    }
  },
  
  // System health monitoring
  health: {
    // Monitoring settings
    monitoring: {
      enabled: true,
      interval: 10000,            // 10 seconds
      enableAutoCleanup: true,
      memoryThreshold: 0.8,       // 80%
      performanceThreshold: 100   // 100ms
    },
    
    // Alert settings
    alerts: {
      enabled: true,
      maxAlerts: 10,              // Keep last 10 alerts
      autoCleanupOnCritical: true,
      showNotifications: process.env.NODE_ENV === 'development'
    },
    
    // Cleanup strategies
    cleanup: {
      strategies: {
        cache_clear: true,
        component_cleanup: true,
        force_gc: true,
        image_cleanup: true,
        storage_cleanup: true
      },
      
      // Emergency cleanup settings
      emergency: {
        enabled: true,
        memoryThreshold: 0.95,    // 95%
        performanceThreshold: 1000, // 1 second
        aggressiveCleanup: true
      }
    }
  },
  
  // UI configuration
  ui: {
    // Health indicator
    healthIndicator: {
      enabled: true,
      position: 'bottom-right',
      autoHide: process.env.NODE_ENV === 'production',
      showDetails: false,
      
      // Visual settings
      size: 48,                   // 48px diameter
      colors: {
        healthy: '#4CAF50',
        warning: '#FF9800',
        critical: '#F44336',
        unknown: '#9E9E9E'
      }
    },
    
    // Notifications
    notifications: {
      enabled: process.env.NODE_ENV === 'development',
      duration: 5000,             // 5 seconds
      position: 'top-right',
      
      // Notification types
      types: {
        memory: true,
        performance: true,
        network: true,
        cleanup: true
      }
    }
  },
  
  // Development vs Production settings
  environment: {
    development: {
      memory: {
        thresholds: {
          warning: 0.70,          // Lower thresholds for development
          critical: 0.80,
          emergency: 0.90
        },
        cache: {
          maxSize: 50,            // Smaller cache in development
          cleanupInterval: 15000  // More frequent cleanup
        }
      },
      
      performance: {
        monitoring: {
          interval: 5000,         // More frequent monitoring
          verbose: true
        }
      },
      
      ui: {
        healthIndicator: {
          enabled: true,
          autoHide: false,        // Always show in development
          showDetails: true
        },
        notifications: {
          enabled: true
        }
      }
    },
    
    production: {
      memory: {
        thresholds: {
          warning: 0.80,          // Higher thresholds for production
          critical: 0.90,
          emergency: 0.95
        },
        cache: {
          maxSize: 200,           // Larger cache in production
          cleanupInterval: 60000  // Less frequent cleanup
        }
      },
      
      performance: {
        monitoring: {
          interval: 30000,        // Less frequent monitoring
          verbose: false
        }
      },
      
      ui: {
        healthIndicator: {
          enabled: true,
          autoHide: true,         // Hide when healthy in production
          showDetails: false
        },
        notifications: {
          enabled: false          // Disable notifications in production
        }
      }
    }
  },
  
  // Feature flags
  features: {
    memoryGuard: true,
    performanceMonitor: true,
    systemHealth: true,
    autoCleanup: true,
    healthIndicator: true,
    
    // Experimental features
    experimental: {
      predictiveCleanup: false,   // Predict and prevent memory issues
      adaptiveThresholds: false,  // Adapt thresholds based on usage patterns
      mlOptimization: false       // Machine learning based optimization
    }
  },
  
  // API endpoints for health monitoring
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      metrics: '/health/metrics'
    },
    
    // Health check settings
    healthCheck: {
      enabled: true,
      interval: 60000,            // 1 minute
      timeout: 5000,              // 5 seconds
      retries: 3
    }
  }
};

// Apply environment-specific overrides
const env = process.env.NODE_ENV || 'development';
if (healthConfig.environment[env]) {
  const envConfig = healthConfig.environment[env];
  
  // Deep merge environment config
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  };
  
  deepMerge(healthConfig, envConfig);
}

export default healthConfig;