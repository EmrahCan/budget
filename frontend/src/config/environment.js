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

export default getCurrentEnvironment();