import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  // AI Feature States
  const [aiEnabled, setAiEnabled] = useState(true);
  const [features, setFeatures] = useState({
    categorization: true,
    naturalLanguage: true,
    predictions: true,
    ocr: false,
    voice: false,
    anomaly: true,
    notifications: true,
    coach: false,
  });

  // User Preferences
  const [preferences, setPreferences] = useState({
    autoCategorization: true,
    categorizationThreshold: 70,
    voiceEnabled: false,
    notificationsEnabled: true,
    notificationFrequency: 'daily',
    language: 'tr',
    learningMode: true,
  });

  // Cache Management
  const [cache, setCache] = useState({
    categorizations: new Map(),
    queries: new Map(),
    insights: null,
    recommendations: null,
  });

  // Rate Limit Status
  const [rateLimitStatus, setRateLimitStatus] = useState({
    requestsUsed: 0,
    requestsRemaining: 30,
    resetTime: null,
  });

  // Loading States
  const [loading, setLoading] = useState({
    categorization: false,
    query: false,
    insights: false,
    recommendations: false,
  });

  // Error States
  const [errors, setErrors] = useState({});

  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 0,
    cacheHitRate: 0,
  });

  /**
   * Initialize AI context - check health and load preferences
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check AI health
        const healthResponse = await aiAPI.healthCheck();
        if (healthResponse.data?.data) {
          setFeatures(healthResponse.data.data.features || features);
          setAiEnabled(healthResponse.data.data.status === 'healthy');
        }

        // Load user preferences from localStorage
        const savedPreferences = localStorage.getItem('aiPreferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }

        // Load rate limit status
        await updateRateLimitStatus();
      } catch (error) {
        console.error('AI initialization error:', error);
        setAiEnabled(false);
      }
    };

    initialize();
  }, []);

  /**
   * Save preferences to localStorage
   */
  useEffect(() => {
    localStorage.setItem('aiPreferences', JSON.stringify(preferences));
  }, [preferences]);

  /**
   * Update rate limit status
   */
  const updateRateLimitStatus = useCallback(async () => {
    try {
      const response = await aiAPI.getRateLimitStatus();
      if (response.data?.data) {
        setRateLimitStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to update rate limit status:', error);
    }
  }, []);

  /**
   * Categorize transaction with caching
   */
  const categorizeTransaction = useCallback(async (description, amount, context = {}) => {
    if (!aiEnabled || !features.categorization) {
      return { success: false, error: 'AI categorization is disabled' };
    }

    // Check cache
    const cacheKey = `${description}_${amount}`;
    if (cache.categorizations.has(cacheKey)) {
      return { success: true, data: cache.categorizations.get(cacheKey), cached: true };
    }

    setLoading(prev => ({ ...prev, categorization: true }));
    setErrors(prev => ({ ...prev, categorization: null }));

    try {
      const response = await aiAPI.categorizeTransaction({
        description,
        amount,
        context,
      });

      if (response.data?.success) {
        // Update cache
        const newCache = new Map(cache.categorizations);
        newCache.set(cacheKey, response.data.data);
        setCache(prev => ({ ...prev, categorizations: newCache }));

        // Update rate limit
        await updateRateLimitStatus();

        return response.data;
      }

      return { success: false, error: 'Categorization failed' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, categorization: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(prev => ({ ...prev, categorization: false }));
    }
  }, [aiEnabled, features.categorization, cache.categorizations, updateRateLimitStatus]);

  /**
   * Send categorization feedback
   */
  const sendCategorizationFeedback = useCallback(async (transactionId, description, suggestedCategory, actualCategory) => {
    try {
      const response = await aiAPI.sendCategorizationFeedback({
        transactionId,
        description,
        suggestedCategory,
        actualCategory,
      });

      // Clear cache for this description
      const newCache = new Map(cache.categorizations);
      for (const [key] of newCache) {
        if (key.startsWith(description)) {
          newCache.delete(key);
        }
      }
      setCache(prev => ({ ...prev, categorizations: newCache }));

      return response.data;
    } catch (error) {
      console.error('Failed to send feedback:', error);
      return { success: false, error: error.message };
    }
  }, [cache.categorizations]);

  /**
   * Process natural language query
   */
  const processQuery = useCallback(async (query, language = 'tr') => {
    if (!aiEnabled || !features.naturalLanguage) {
      return { success: false, error: 'Natural language queries are disabled' };
    }

    // Check cache
    const cacheKey = `${query}_${language}`;
    if (cache.queries.has(cacheKey)) {
      return { success: true, data: cache.queries.get(cacheKey), cached: true };
    }

    setLoading(prev => ({ ...prev, query: true }));
    setErrors(prev => ({ ...prev, query: null }));

    try {
      const response = await aiAPI.processQuery(query, language);

      if (response.data?.success) {
        // Update cache
        const newCache = new Map(cache.queries);
        newCache.set(cacheKey, response.data.data);
        setCache(prev => ({ ...prev, queries: newCache }));

        await updateRateLimitStatus();

        return response.data;
      }

      return { success: false, error: 'Query processing failed' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, query: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(prev => ({ ...prev, query: false }));
    }
  }, [aiEnabled, features.naturalLanguage, cache.queries, updateRateLimitStatus]);

  /**
   * Get AI insights
   */
  const getInsights = useCallback(async (timeframe = 'monthly', forceRefresh = false) => {
    if (!aiEnabled) {
      return { success: false, error: 'AI is disabled' };
    }

    // Check cache
    if (cache.insights && !forceRefresh) {
      return { success: true, data: cache.insights, cached: true };
    }

    setLoading(prev => ({ ...prev, insights: true }));
    setErrors(prev => ({ ...prev, insights: null }));

    try {
      const response = await aiAPI.getInsights(timeframe);

      if (response.data?.success) {
        setCache(prev => ({ ...prev, insights: response.data.data }));
        await updateRateLimitStatus();
        return response.data;
      }

      return { success: false, error: 'Failed to get insights' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, insights: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  }, [aiEnabled, cache.insights, updateRateLimitStatus]);

  /**
   * Get AI recommendations
   */
  const getRecommendations = useCallback(async (includeInvestments = false, forceRefresh = false) => {
    if (!aiEnabled) {
      return { success: false, error: 'AI is disabled' };
    }

    // Check cache
    if (cache.recommendations && !forceRefresh) {
      return { success: true, data: cache.recommendations, cached: true };
    }

    setLoading(prev => ({ ...prev, recommendations: true }));
    setErrors(prev => ({ ...prev, recommendations: null }));

    try {
      const response = await aiAPI.getRecommendations(includeInvestments);

      if (response.data?.success) {
        setCache(prev => ({ ...prev, recommendations: response.data.data }));
        await updateRateLimitStatus();
        return response.data;
      }

      return { success: false, error: 'Failed to get recommendations' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, recommendations: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  }, [aiEnabled, cache.recommendations, updateRateLimitStatus]);

  /**
   * Clear all AI cache
   */
  const clearCache = useCallback(async () => {
    try {
      await aiAPI.clearCache();
      setCache({
        categorizations: new Map(),
        queries: new Map(),
        insights: null,
        recommendations: null,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      const response = await aiAPI.getCacheStats();
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }, []);

  /**
   * Get AI statistics
   */
  const getStats = useCallback(async () => {
    try {
      const response = await aiAPI.getStats();
      if (response.data?.success) {
        setStats(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get AI stats:', error);
      return null;
    }
  }, []);

  const value = {
    // States
    aiEnabled,
    features,
    preferences,
    rateLimitStatus,
    loading,
    errors,
    stats,
    cache,

    // Actions
    categorizeTransaction,
    sendCategorizationFeedback,
    processQuery,
    getInsights,
    getRecommendations,
    clearCache,
    updatePreferences,
    getCacheStats,
    getStats,
    updateRateLimitStatus,

    // Setters
    setAiEnabled,
    setFeatures,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export default AIContext;
