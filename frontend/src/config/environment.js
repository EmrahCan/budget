// Environment configuration and validation

class EnvironmentConfig {
  constructor() {
    this.validateEnvironment();
    this.logConfiguration();
  }

  // Get environment type
  getEnvironment() {
    return process.env.NODE_ENV || 'development';
  }

  // Check if development
  isDevelopment() {
    return this.getEnvironment() === 'development';
  }

  // Check if production
  isProduction() {
    return this.getEnvironment() === 'production';
  }

  // Get API URL
  getApiUrl() {
    const apiUrl = process.env.REACT_APP_API_URL;
    
    if (!apiUrl) {
      const fallback = this.isProduction() 
        ? 'http://4.210.173.21:5001/api'
        : 'http://localhost:5002/api';
      
      console.warn(`REACT_APP_API_URL not set, using fallback: ${fallback}`);
      return fallback;
    }
    
    return apiUrl;
  }

  // Get app configuration
  getAppConfig() {
    return {
      name: process.env.REACT_APP_NAME || 'Budget App',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: this.getEnvironment(),
      debug: process.env.REACT_APP_DEBUG === 'true',
      apiUrl: this.getApiUrl()
    };
  }

  // Validate required environment variables
  validateEnvironment() {
    const requiredVars = [
      'REACT_APP_API_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing environment variables:', missing);
      console.warn('Using fallback values. Check your .env file.');
    }

    // Validate API URL format
    try {
      new URL(this.getApiUrl());
    } catch (error) {
      console.error('❌ Invalid API URL format:', this.getApiUrl());
      throw new Error('Invalid API URL configuration');
    }

    return missing.length === 0;
  }

  // Log configuration (development only)
  logConfiguration() {
    if (this.isDevelopment()) {
      const config = this.getAppConfig();
      console.log('🔧 Environment Configuration:');
      console.table(config);
    }
  }

  // Get feature flags
  getFeatureFlags() {
    return {
      enableDevtools: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true',
      enableDebugLogs: process.env.REACT_APP_DEBUG === 'true',
      logLevel: process.env.REACT_APP_LOG_LEVEL || 'info'
    };
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

export default environmentConfig;

// Export individual functions for convenience
export const {
  getEnvironment,
  isDevelopment,
  isProduction,
  getApiUrl,
  getAppConfig,
  validateEnvironment,
  getFeatureFlags
} = environmentConfig;