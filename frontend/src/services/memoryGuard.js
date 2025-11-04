class MemoryGuard {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.memoryThresholds = {
      warning: 0.75,    // 75%
      critical: 0.85,   // 85%
      emergency: 0.95   // 95%
    };
    
    this.callbacks = new Map();
    this.memoryHistory = [];
    this.maxHistorySize = 50;
    
    // Component tracking
    this.componentRegistry = new Map();
    this.largeObjectRegistry = new WeakMap();
    
    // Cleanup strategies
    this.cleanupStrategies = new Map();
    this.setupCleanupStrategies();
    
    // Performance observer for memory leaks
    this.setupPerformanceObserver();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(interval = 5000) { // 5 seconds
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, interval);
    
    console.log('Memory guard monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Memory guard monitoring stopped');
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    if (!window.performance || !window.performance.memory) {
      return null;
    }
    
    const memory = window.performance.memory;
    const usage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      timestamp: Date.now()
    };
    
    // Add to history
    this.memoryHistory.push(usage);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
    
    // Evaluate memory level
    const level = this.evaluateMemoryLevel(usage.percentage / 100);
    
    if (level !== 'normal') {
      this.handleMemoryAlert(level, usage);
    }
    
    return usage;
  }

  /**
   * Evaluate memory level
   */
  evaluateMemoryLevel(percentage) {
    if (percentage >= this.memoryThresholds.emergency) return 'emergency';
    if (percentage >= this.memoryThresholds.critical) return 'critical';
    if (percentage >= this.memoryThresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Handle memory alert
   */
  async handleMemoryAlert(level, usage) {
    console.warn(`Memory Alert [${level}]: ${usage.percentage.toFixed(1)}% used`);
    
    // Notify callbacks
    for (const [name, callback] of this.callbacks) {
      try {
        await callback(level, usage);
      } catch (error) {
        console.error(`Error in memory callback ${name}:`, error);
      }
    }
    
    // Execute automatic cleanup
    if (level === 'critical' || level === 'emergency') {
      await this.executeEmergencyCleanup(level);
    }
  }

  /**
   * Execute emergency cleanup
   */
  async executeEmergencyCleanup(level) {
    console.warn(`Executing emergency cleanup for ${level} memory usage`);
    
    // Get current usage before cleanup
    const beforeUsage = this.checkMemoryUsage();
    
    const strategies = level === 'emergency' 
      ? ['cache_clear', 'component_cleanup', 'force_gc', 'image_cleanup']
      : ['cache_clear', 'component_cleanup'];
    
    for (const strategyName of strategies) {
      const strategy = this.cleanupStrategies.get(strategyName);
      if (strategy) {
        try {
          await strategy();
          console.log(`Cleanup strategy '${strategyName}' executed`);
        } catch (error) {
          console.error(`Error executing cleanup strategy '${strategyName}':`, error);
        }
      }
    }
    
    // Check if cleanup was effective
    setTimeout(() => {
      const newUsage = this.checkMemoryUsage();
      if (newUsage && beforeUsage) {
        const improvement = beforeUsage.percentage - newUsage.percentage;
        console.log(`Memory cleanup freed ${improvement.toFixed(1)}% memory`);
      }
    }, 1000);
  }

  /**
   * Setup cleanup strategies
   */
  setupCleanupStrategies() {
    // Clear caches
    this.cleanupStrategies.set('cache_clear', async () => {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear application caches
      if (window.cacheManager) {
        window.cacheManager.clear();
      }
      
      // Clear localStorage if too large
      try {
        const storageSize = JSON.stringify(localStorage).length;
        if (storageSize > 1024 * 1024) { // 1MB
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('cache_') || key.startsWith('temp_')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
    });
    
    // Component cleanup
    this.cleanupStrategies.set('component_cleanup', async () => {
      // Cleanup registered components
      for (const [componentId, component] of this.componentRegistry) {
        if (component.cleanup && typeof component.cleanup === 'function') {
          try {
            await component.cleanup();
          } catch (error) {
            console.warn(`Error cleaning up component ${componentId}:`, error);
          }
        }
      }
      
      // Clear component registry of inactive components
      const activeComponents = new Map();
      for (const [componentId, component] of this.componentRegistry) {
        if (component.isActive && component.isActive()) {
          activeComponents.set(componentId, component);
        }
      }
      this.componentRegistry = activeComponents;
    });
    
    // Force garbage collection
    this.cleanupStrategies.set('force_gc', async () => {
      if (window.gc) {
        window.gc();
      }
      
      // Create memory pressure to trigger GC
      const tempArrays = [];
      for (let i = 0; i < 10; i++) {
        tempArrays.push(new Array(1000000).fill(null));
      }
      tempArrays.length = 0;
    });
    
    // Image cleanup
    this.cleanupStrategies.set('image_cleanup', async () => {
      // Remove unused images from DOM
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.offsetParent && !img.dataset.keepAlive) {
          img.src = '';
          img.srcset = '';
        }
      });
      
      // Clear image caches
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        if (!canvas.offsetParent) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      });
    });
  }

  /**
   * Register component for memory management
   */
  registerComponent(componentId, component) {
    this.componentRegistry.set(componentId, {
      ...component,
      registeredAt: Date.now()
    });
  }

  /**
   * Unregister component
   */
  unregisterComponent(componentId) {
    const component = this.componentRegistry.get(componentId);
    if (component && component.cleanup) {
      try {
        component.cleanup();
      } catch (error) {
        console.warn(`Error cleaning up component ${componentId}:`, error);
      }
    }
    this.componentRegistry.delete(componentId);
  }

  /**
   * Track large object
   */
  trackLargeObject(obj, metadata = {}) {
    this.largeObjectRegistry.set(obj, {
      ...metadata,
      trackedAt: Date.now(),
      size: this.estimateObjectSize(obj)
    });
  }

  /**
   * Estimate object size
   */
  estimateObjectSize(obj) {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate
    } catch (error) {
      return 0;
    }
  }

  /**
   * Register memory callback
   */
  registerCallback(name, callback) {
    this.callbacks.set(name, callback);
  }

  /**
   * Unregister memory callback
   */
  unregisterCallback(name) {
    this.callbacks.delete(name);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const current = this.checkMemoryUsage();
    if (!current) return null;
    
    const history = this.memoryHistory.slice(-10);
    const trend = history.length > 1 
      ? history[history.length - 1].percentage - history[0].percentage
      : 0;
    
    return {
      current,
      trend,
      level: this.evaluateMemoryLevel(current.percentage / 100),
      history: this.memoryHistory,
      components: this.componentRegistry.size,
      recommendations: this.generateRecommendations(current)
    };
  }

  /**
   * Generate memory recommendations
   */
  generateRecommendations(usage) {
    const recommendations = [];
    const level = this.evaluateMemoryLevel(usage.percentage / 100);
    
    if (level === 'warning' || level === 'critical' || level === 'emergency') {
      recommendations.push({
        type: 'cleanup',
        priority: level === 'emergency' ? 'high' : 'medium',
        message: 'Consider clearing caches and unused data'
      });
    }
    
    if (this.componentRegistry.size > 50) {
      recommendations.push({
        type: 'components',
        priority: 'medium',
        message: 'Large number of registered components - review for memory leaks'
      });
    }
    
    const trend = this.memoryHistory.length > 5 
      ? this.memoryHistory[this.memoryHistory.length - 1].percentage - this.memoryHistory[this.memoryHistory.length - 5].percentage
      : 0;
    
    if (trend > 10) {
      recommendations.push({
        type: 'trend',
        priority: 'high',
        message: 'Memory usage is increasing rapidly - investigate potential memory leaks'
      });
    }
    
    return recommendations;
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.includes('memory')) {
              console.log(`Memory performance: ${entry.name} took ${entry.duration}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Could not setup performance observer:', error);
      }
    }
  }

  /**
   * Create memory-safe wrapper for functions
   */
  createMemorySafeWrapper(fn, options = {}) {
    const { maxExecutions = 1000, cleanupInterval = 60000 } = options;
    let executionCount = 0;
    let lastCleanup = Date.now();
    
    return async (...args) => {
      executionCount++;
      
      // Periodic cleanup
      if (Date.now() - lastCleanup > cleanupInterval) {
        if (window.gc) window.gc();
        lastCleanup = Date.now();
      }
      
      // Prevent excessive executions
      if (executionCount > maxExecutions) {
        console.warn('Function execution limit reached, forcing cleanup');
        executionCount = 0;
        if (window.gc) window.gc();
      }
      
      try {
        return await fn(...args);
      } catch (error) {
        console.error('Error in memory-safe wrapper:', error);
        throw error;
      }
    };
  }

  /**
   * Force memory check and cleanup
   */
  async forceCleanup() {
    const usage = this.checkMemoryUsage();
    if (usage) {
      await this.executeEmergencyCleanup('critical');
      return this.checkMemoryUsage();
    }
    return null;
  }
}

// Create singleton instance
const memoryGuard = new MemoryGuard();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  memoryGuard.startMonitoring();
}

export default memoryGuard;