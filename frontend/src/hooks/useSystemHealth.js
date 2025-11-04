import { useState, useEffect, useCallback, useRef } from 'react';
import memoryGuard from '../services/memoryGuard';

const useSystemHealth = (options = {}) => {
  const {
    monitoringInterval = 10000, // 10 seconds
    enableAutoCleanup = true,
    memoryThreshold = 0.8,
    performanceThreshold = 100 // ms
  } = options;

  const [healthStatus, setHealthStatus] = useState({
    memory: { level: 'normal', usage: 0, trend: 0 },
    performance: { level: 'normal', renderTime: 0, trend: 0 },
    network: { level: 'normal', latency: 0, errors: 0 },
    overall: 'healthy'
  });

  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const monitoringIntervalRef = useRef(null);
  const performanceMetrics = useRef({
    renderTimes: [],
    networkRequests: [],
    errors: []
  });

  // Memory monitoring
  const checkMemoryHealth = useCallback(() => {
    const memoryStats = memoryGuard.getMemoryStats();
    if (!memoryStats) return { level: 'normal', usage: 0, trend: 0 };

    const level = memoryStats.level;
    const usage = memoryStats.current.percentage / 100;
    const trend = memoryStats.trend;

    return { level, usage, trend };
  }, []);

  // Performance monitoring
  const checkPerformanceHealth = useCallback(() => {
    const renderTimes = performanceMetrics.current.renderTimes;
    if (renderTimes.length === 0) return { level: 'normal', renderTime: 0, trend: 0 };

    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const recentAvg = renderTimes.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, renderTimes.length);
    const trend = recentAvg - avgRenderTime;

    let level = 'normal';
    if (avgRenderTime > performanceThreshold * 2) level = 'critical';
    else if (avgRenderTime > performanceThreshold) level = 'warning';

    return { level, renderTime: avgRenderTime, trend };
  }, [performanceThreshold]);

  // Network monitoring
  const checkNetworkHealth = useCallback(() => {
    const requests = performanceMetrics.current.networkRequests;
    const errors = performanceMetrics.current.errors;
    
    if (requests.length === 0) return { level: 'normal', latency: 0, errors: 0 };

    const avgLatency = requests.reduce((a, b) => a + b.duration, 0) / requests.length;
    const errorRate = errors.length / requests.length;

    let level = 'normal';
    if (errorRate > 0.1 || avgLatency > 5000) level = 'critical';
    else if (errorRate > 0.05 || avgLatency > 2000) level = 'warning';

    return { level, latency: avgLatency, errors: errorRate };
  }, []);

  // Overall health assessment
  const assessOverallHealth = useCallback((memory, performance, network) => {
    const levels = [memory.level, performance.level, network.level];
    
    if (levels.includes('critical')) return 'critical';
    if (levels.includes('warning')) return 'warning';
    return 'healthy';
  }, []);

  // Health check function
  const performHealthCheck = useCallback(() => {
    const memory = checkMemoryHealth();
    const performance = checkPerformanceHealth();
    const network = checkNetworkHealth();
    const overall = assessOverallHealth(memory, performance, network);

    const newHealthStatus = {
      memory,
      performance,
      network,
      overall,
      timestamp: Date.now()
    };

    setHealthStatus(newHealthStatus);

    // Generate alerts for critical conditions
    const newAlerts = [];
    
    if (memory.level === 'critical' || memory.level === 'emergency') {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'memory',
        level: memory.level,
        message: `High memory usage: ${(memory.usage * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        autoCleanup: enableAutoCleanup
      });
    }

    if (performance.level === 'critical') {
      newAlerts.push({
        id: `performance-${Date.now()}`,
        type: 'performance',
        level: performance.level,
        message: `Slow rendering: ${performance.renderTime.toFixed(0)}ms average`,
        timestamp: Date.now()
      });
    }

    if (network.level === 'critical') {
      newAlerts.push({
        id: `network-${Date.now()}`,
        type: 'network',
        level: network.level,
        message: `Network issues: ${(network.errors * 100).toFixed(1)}% error rate`,
        timestamp: Date.now()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-10), ...newAlerts]); // Keep last 10 alerts
    }

    return newHealthStatus;
  }, [checkMemoryHealth, checkPerformanceHealth, checkNetworkHealth, assessOverallHealth, enableAutoCleanup]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    memoryGuard.startMonitoring();

    monitoringIntervalRef.current = setInterval(() => {
      performHealthCheck();
    }, monitoringInterval);

    console.log('System health monitoring started');
  }, [isMonitoring, performHealthCheck, monitoringInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);
    memoryGuard.stopMonitoring();

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    console.log('System health monitoring stopped');
  }, [isMonitoring]);

  // Record render time
  const recordRenderTime = useCallback((renderTime) => {
    performanceMetrics.current.renderTimes.push(renderTime);
    
    // Keep only last 50 measurements
    if (performanceMetrics.current.renderTimes.length > 50) {
      performanceMetrics.current.renderTimes.shift();
    }
  }, []);

  // Record network request
  const recordNetworkRequest = useCallback((request) => {
    performanceMetrics.current.networkRequests.push({
      ...request,
      timestamp: Date.now()
    });

    // Keep only last 100 requests
    if (performanceMetrics.current.networkRequests.length > 100) {
      performanceMetrics.current.networkRequests.shift();
    }
  }, []);

  // Record error
  const recordError = useCallback((error) => {
    performanceMetrics.current.errors.push({
      ...error,
      timestamp: Date.now()
    });

    // Keep only last 50 errors
    if (performanceMetrics.current.errors.length > 50) {
      performanceMetrics.current.errors.shift();
    }
  }, []);

  // Force cleanup
  const forceCleanup = useCallback(async () => {
    try {
      await memoryGuard.forceCleanup();
      
      // Clear performance metrics
      performanceMetrics.current = {
        renderTimes: [],
        networkRequests: [],
        errors: []
      };

      // Clear alerts
      setAlerts([]);

      // Perform health check after cleanup
      setTimeout(() => {
        performHealthCheck();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error during force cleanup:', error);
      return false;
    }
  }, [performHealthCheck]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Get health report
  const getHealthReport = useCallback(() => {
    return {
      status: healthStatus,
      alerts: alerts,
      metrics: {
        renderTimes: performanceMetrics.current.renderTimes.slice(-10),
        networkRequests: performanceMetrics.current.networkRequests.slice(-10),
        errors: performanceMetrics.current.errors.slice(-10)
      },
      recommendations: generateRecommendations()
    };
  }, [healthStatus, alerts]);

  // Generate recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations = [];

    if (healthStatus.memory.level === 'warning' || healthStatus.memory.level === 'critical') {
      recommendations.push({
        type: 'memory',
        priority: healthStatus.memory.level === 'critical' ? 'high' : 'medium',
        message: 'Consider reducing data cache size or clearing unused components',
        action: 'cleanup'
      });
    }

    if (healthStatus.performance.level === 'warning' || healthStatus.performance.level === 'critical') {
      recommendations.push({
        type: 'performance',
        priority: healthStatus.performance.level === 'critical' ? 'high' : 'medium',
        message: 'Optimize component rendering or reduce data processing',
        action: 'optimize'
      });
    }

    if (healthStatus.network.level === 'warning' || healthStatus.network.level === 'critical') {
      recommendations.push({
        type: 'network',
        priority: healthStatus.network.level === 'critical' ? 'high' : 'medium',
        message: 'Check network connectivity or reduce API call frequency',
        action: 'network_check'
      });
    }

    return recommendations;
  }, [healthStatus]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Register memory guard callback
  useEffect(() => {
    const handleMemoryAlert = (level, usage) => {
      if (enableAutoCleanup && (level === 'critical' || level === 'emergency')) {
        console.log('Auto-cleanup triggered by memory guard');
        forceCleanup();
      }
    };

    memoryGuard.registerCallback('useSystemHealth', handleMemoryAlert);

    return () => {
      memoryGuard.unregisterCallback('useSystemHealth');
    };
  }, [enableAutoCleanup, forceCleanup]);

  return {
    healthStatus,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    recordRenderTime,
    recordNetworkRequest,
    recordError,
    forceCleanup,
    dismissAlert,
    getHealthReport
  };
};

export default useSystemHealth;