/**
 * Environment variable utilities
 */

// Get environment variables from window.ENV (set in env-config.js)
// or from import.meta.env (for development)
const getEnvVariable = (key: string): string => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  
  if (typeof import.meta === 'object' && import.meta && 'env' in import.meta) {
    return (import.meta as any).env[key] || '';
  }
  
  return '';
};

// Environment configuration
export const env = {
  // API Configuration
  VITE_API_URL: getEnvVariable('VITE_API_URL'),
  VITE_COGNIS_API_KEY: getEnvVariable('VITE_COGNIS_API_KEY'),
  VITE_PUBLIC_URL: getEnvVariable('VITE_PUBLIC_URL'),
  
  // App Configuration
  VITE_APP_NAME: getEnvVariable('VITE_APP_NAME') || 'Cognis Digital',
  VITE_APP_BUILD_TIME: getEnvVariable('VITE_APP_BUILD_TIME') || new Date().toISOString(),
  VITE_APP_COMMIT_HASH: getEnvVariable('VITE_APP_COMMIT_HASH') || 'development',
  
  // Dynamic Model Configuration
  VITE_DEFAULT_MODEL: getEnvVariable('VITE_DEFAULT_MODEL') || 'medium-model',
  VITE_MODEL_TEMPERATURE: parseFloat(getEnvVariable('VITE_MODEL_TEMPERATURE') || '0.7'),
  VITE_MAX_TOKENS: parseInt(getEnvVariable('VITE_MAX_TOKENS') || '512', 10),
  
  // Feature Flags
  VITE_ENABLE_LOCAL_MODEL: getEnvVariable('VITE_ENABLE_LOCAL_MODEL') === 'true',
  VITE_ENABLE_STREAMING: getEnvVariable('VITE_ENABLE_STREAMING') === 'true',
  
  // Return full environment object for debugging
  debug: (): Record<string, any> => {
    return {
      VITE_API_URL: getEnvVariable('VITE_API_URL'),
      VITE_COGNIS_API_KEY: getEnvVariable('VITE_COGNIS_API_KEY') ? '***' : 'not-set',
      VITE_PUBLIC_URL: getEnvVariable('VITE_PUBLIC_URL'),
      VITE_APP_NAME: getEnvVariable('VITE_APP_NAME'),
      VITE_APP_BUILD_TIME: getEnvVariable('VITE_APP_BUILD_TIME'),
      VITE_APP_COMMIT_HASH: getEnvVariable('VITE_APP_COMMIT_HASH'),
      VITE_DEFAULT_MODEL: getEnvVariable('VITE_DEFAULT_MODEL'),
      VITE_MODEL_TEMPERATURE: getEnvVariable('VITE_MODEL_TEMPERATURE'),
      VITE_MAX_TOKENS: getEnvVariable('VITE_MAX_TOKENS'),
      VITE_ENABLE_LOCAL_MODEL: getEnvVariable('VITE_ENABLE_LOCAL_MODEL'),
      VITE_ENABLE_STREAMING: getEnvVariable('VITE_ENABLE_STREAMING'),
    };
  }
};
