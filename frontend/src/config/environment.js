// Environment configuration
export const environment = {
  development: {
    API_BASE_URL: 'http://localhost:5001',
    AI_ENABLED: true,
    DEBUG_MODE: true,
    CACHE_ENABLED: true,
    PERFORMANCE_MONITORING: true
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
    AI_ENABLED: process.env.REACT_APP_AI_ENABLED === 'true',
    DEBUG_MODE: false,
    CACHE_ENABLED: true,
    PERFORMANCE_MONITORING: true
  }
};

export const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environment[env] || environment.development;
};

const currentEnv = getCurrentEnvironment();

// Export helper functions
const environmentConfig = {
  validateEnvironment: () => {
    try {
      const apiUrl = currentEnv.API_BASE_URL;
      return apiUrl && apiUrl.length > 0;
    } catch (error) {
      console.error('Environment validation error:', error);
      return false;
    }
  },
  
  getAppConfig: () => {
    return {
      name: process.env.REACT_APP_NAME || 'Budget App',
      version: process.env.REACT_APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      apiUrl: currentEnv.API_BASE_URL
    };
  },
  
  getFeatureFlags: () => {
    return {
      aiEnabled: currentEnv.AI_ENABLED,
      debugMode: currentEnv.DEBUG_MODE,
      cacheEnabled: currentEnv.CACHE_ENABLED,
      performanceMonitoring: currentEnv.PERFORMANCE_MONITORING
    };
  },
  
  isDevelopment: () => {
    return process.env.NODE_ENV === 'development';
  },
  
  getApiUrl: () => {
    return currentEnv.API_BASE_URL + '/api';
  }
};

export default environmentConfig;