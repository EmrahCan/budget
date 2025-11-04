import { useEffect, useRef, useCallback, useState } from 'react';
import healthConfig from '../config/healthConfig';

const useMemoryManagement = ({
  maxCacheSize = healthConfig.memory.cache.maxSize,
  cleanupInterval = healthConfig.memory.cache.cleanupInterval,
  memoryThreshold = healthConfig.memory.thresholds.warning,
  enableAutoCleanup = healthConfig.memory.cache.enableAutoCleanup
}) => {
  const cacheRef = useRef(new Map());
  const accessTimeRef = useRef(new Map());
  const cleanupIntervalRef = useRef(null);
  const [memoryStats, setMemoryStats] = useState({
    used: 0,
    total: 0,
    percentage: 0,
    isHigh: false
  });

  // Get current memory usage
  const getMemoryUsage = useCallback(() => {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;
      const percentage = (used / limit) * 100;
      
      return {
        used,
        total,
        limit,
        percentage,
        isHigh: percentage > memoryThreshold * 100
      };
    }
    return null;
  }, [memoryThreshold]);

  // Update memory stats
  const updateMemoryStats = useCallback(() => {
    const stats = getMemoryUsage();
    if (stats) {
      setMemoryStats(stats);
      
      // Log high memory usage
      if (stats.isHigh) {
        console.warn(`High memory usage detected: ${stats.percentage.toFixed(1)}%`);
      }
    }
  }, [getMemoryUsage]);

  // Add item to cache
  const cacheItem = useCallback((key, data) => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    
    // Remove oldest items if cache is full
    if (cache.size >= maxCacheSize) {
      const oldestKey = Array.from(accessTime.entries())
        .sort(([,a], [,b]) => a - b)[0][0];
      
      cache.delete(oldestKey);
      accessTime.delete(oldestKey);
    }
    
    cache.set(key, data);
    accessTime.set(key, Date.now());
  }, [maxCacheSize]);

  // Get item from cache
  const getCachedItem = useCallback((key) => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    
    if (cache.has(key)) {
      accessTime.set(key, Date.now()); // Update access time
      return cache.get(key);
    }
    
    return null;
  }, []);

  // Remove item from cache
  const removeCachedItem = useCallback((key) => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    
    cache.delete(key);
    accessTime.delete(key);
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    accessTimeRef.current.clear();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    updateMemoryStats();
  }, [updateMemoryStats]);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    const now = Date.now();
    const maxAge = cleanupInterval * 2; // Keep items for 2x cleanup interval
    
    let removedCount = 0;
    
    for (const [key, time] of accessTime.entries()) {
      if (now - time > maxAge) {
        cache.delete(key);
        accessTime.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Memory cleanup: removed ${removedCount} cached items`);
      updateMemoryStats();
    }
  }, [cleanupInterval, updateMemoryStats]);

  // Force cleanup when memory is high
  const forceCleanup = useCallback(() => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    
    // Remove half of the cache, starting with oldest items
    const sortedEntries = Array.from(accessTime.entries())
      .sort(([,a], [,b]) => a - b);
    
    const itemsToRemove = Math.floor(sortedEntries.length / 2);
    
    for (let i = 0; i < itemsToRemove; i++) {
      const [key] = sortedEntries[i];
      cache.delete(key);
      accessTime.delete(key);
    }
    
    console.log(`Force cleanup: removed ${itemsToRemove} cached items`);
    updateMemoryStats();
  }, [updateMemoryStats]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const accessTime = accessTimeRef.current;
    
    return {
      size: cache.size,
      maxSize: maxCacheSize,
      usage: (cache.size / maxCacheSize) * 100,
      oldestAccess: accessTime.size > 0 ? Math.min(...accessTime.values()) : null,
      newestAccess: accessTime.size > 0 ? Math.max(...accessTime.values()) : null
    };
  }, [maxCacheSize]);

  // Setup cleanup interval
  useEffect(() => {
    if (enableAutoCleanup) {
      cleanupIntervalRef.current = setInterval(() => {
        cleanupCache();
        updateMemoryStats();
        
        // Force cleanup if memory is high
        const stats = getMemoryUsage();
        if (stats && stats.isHigh) {
          forceCleanup();
        }
      }, cleanupInterval);
      
      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
      };
    }
  }, [enableAutoCleanup, cleanupInterval, cleanupCache, updateMemoryStats, getMemoryUsage, forceCleanup]);

  // Initial memory stats update
  useEffect(() => {
    updateMemoryStats();
  }, [updateMemoryStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return {
    // Cache operations
    cacheItem,
    getCachedItem,
    removeCachedItem,
    clearCache,
    
    // Memory management
    memoryStats,
    updateMemoryStats,
    forceCleanup,
    
    // Cache statistics
    getCacheStats,
    
    // Manual cleanup
    cleanupCache
  };
};

export default useMemoryManagement;