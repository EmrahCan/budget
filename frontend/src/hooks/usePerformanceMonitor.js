import { useEffect, useRef, useState, useCallback } from 'react';

const usePerformanceMonitor = (componentName = 'Component') => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: null,
    averageRenderTime: 0,
    memoryUsage: null,
    isSlowRender: false
  });
  
  const renderStartTime = useRef(null);
  const renderTimes = useRef([]);
  const mountTime = useRef(Date.now());

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Keep last 10 render times for average calculation
      renderTimes.current.push(renderTime);
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
      
      const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime,
        averageRenderTime,
        isSlowRender: renderTime > 16 // 60fps threshold
      }));
      
      // Log slow renders
      if (renderTime > 50) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      renderStartTime.current = null;
    }
  }, [componentName]);

  // Memory usage monitoring
  const updateMemoryUsage = useCallback(() => {
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit,
          usagePercentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        }
      }));
    }
  }, []);

  // Component lifecycle monitoring
  useEffect(() => {
    startMeasurement();
    
    return () => {
      endMeasurement();
    };
  });

  // Memory monitoring interval
  useEffect(() => {
    updateMemoryUsage();
    
    const interval = setInterval(updateMemoryUsage, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  // Component unmount logging
  useEffect(() => {
    return () => {
      const totalLifetime = Date.now() - mountTime.current;
      console.log(`${componentName} unmounted after ${totalLifetime}ms, ${metrics.renderCount} renders`);
    };
  }, [componentName, metrics.renderCount]);

  // Performance report
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      ...metrics,
      totalLifetime: Date.now() - mountTime.current,
      renderFrequency: metrics.renderCount / ((Date.now() - mountTime.current) / 1000), // renders per second
      isPerformant: metrics.averageRenderTime < 16 && (metrics.memoryUsage?.usagePercentage || 0) < 80
    };
  }, [componentName, metrics]);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    updateMemoryUsage,
    getPerformanceReport
  };
};

export default usePerformanceMonitor;