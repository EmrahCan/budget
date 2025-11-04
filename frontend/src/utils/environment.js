// Environment configuration utilities

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

export const isDevelopment = () => {
  return getEnvironment() === 'development';
};

export const isProduction = () => {
  return getEnvironment() === 'production';
};

export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL;
};

export const getAppName = () => {
  return process.env.REACT_APP_NAME || 'Budget App';
};

export const getAppVersion = () => {
  return process.env.REACT_APP_VERSION || '1.0.0';
};

export const isDebugEnabled = () => {
  return process.env.REACT_APP_DEBUG === 'true';
};

export const validateEnvironment = () => {
  const requiredVars = [
    'REACT_APP_API_URL',
    'REACT_APP_ENVIRONMENT'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    return false;
  }

  // Validate API URL format
  try {
    new URL(process.env.REACT_APP_API_URL);
  } catch (error) {
    console.error('Invalid REACT_APP_API_URL format:', process.env.REACT_APP_API_URL);
    return false;
  }

  return true;
};

export const logEnvironmentInfo = () => {
  if (isDevelopment()) {
    console.log('🔧 Environment Configuration:');
    console.log(`  Environment: ${getEnvironment()}`);
    console.log(`  API URL: ${getApiUrl()}`);
    console.log(`  App Name: ${getAppName()}`);
    console.log(`  App Version: ${getAppVersion()}`);
    console.log(`  Debug Mode: ${isDebugEnabled()}`);
    console.log(`  Environment Valid: ${validateEnvironment()}`);
  }
};