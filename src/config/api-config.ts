// API Configuration for Cognis integration
export const API_CONFIG = {
  COGNIS_API_KEY: 'sk-test-cognis-workforce-key-12345',
  API_URL: 'https://api.cognisdigital.com',
  API_VERSION: 'v1',
  SELF_HOSTED: true // Setting this to true to avoid API key requirement
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.ENV = {
    ...window.ENV,
    VITE_COGNIS_API_KEY: API_CONFIG.COGNIS_API_KEY,
    VITE_API_URL: `${API_CONFIG.API_URL}/${API_CONFIG.API_VERSION}`,
    VITE_SELF_HOSTED: String(API_CONFIG.SELF_HOSTED)
  };
}

export default API_CONFIG;
