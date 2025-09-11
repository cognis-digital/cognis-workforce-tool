/**
 * Default API Key Configuration
 * Provides a default API key for demonstration purposes
 */

// Set up default environment variables if not already defined
window.ENV = window.ENV || {};

// Set a default API key for testing and demos
window.ENV.VITE_COGNIS_API_KEY = window.ENV.VITE_COGNIS_API_KEY || 'sk-cognis-workforce-prod-valid-key-45678';
window.ENV.VITE_API_URL = window.ENV.VITE_API_URL || 'https://api.cognisdigital.com/v1';
window.ENV.VITE_COGNIS_DEFAULT_MODEL = window.ENV.VITE_COGNIS_DEFAULT_MODEL || 'Cognis-Zenith-4.0';

console.log('Default API configuration loaded');
