// Application startup utilities

import environmentConfig from '../config/environment';

export const performStartupChecks = () => {
  console.log('🚀 Starting Budget App...');
  
  try {
    // Environment validation
    const isValid = environmentConfig.validateEnvironment();
    
    if (!isValid) {
      console.warn('⚠️ Environment validation failed, but continuing with fallbacks');
    }
    
    // Log app info
    const config = environmentConfig.getAppConfig();
    console.log(`📱 ${config.name} v${config.version}`);
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`🔗 API URL: ${config.apiUrl}`);
    
    // Feature flags
    const features = environmentConfig.getFeatureFlags();
    if (environmentConfig.isDevelopment()) {
      console.log('🎛️ Feature Flags:', features);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Startup check failed:', error);
    return false;
  }
};

export const checkApiConnectivity = async () => {
  try {
    const apiUrl = environmentConfig.getApiUrl();
    const healthUrl = apiUrl.replace('/api', '/health');
    
    console.log('🔍 Checking API connectivity...');
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is reachable:', data.message);
      return true;
    } else {
      console.warn('⚠️ API returned non-200 status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ API connectivity check failed:', error.message);
    return false;
  }
};