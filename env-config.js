/**
 * Environment Configuration
 * Sets up global environment variables for the application
 */

// Initialize environment object
window.ENV = window.ENV || {};

// Default environment values for production
window.ENV.VITE_APP_NAME = "Cognis Digital";
window.ENV.VITE_API_URL = "https://api.cognisdigital.com/v1";
window.ENV.VITE_COGNIS_API_KEY = window.ENV.VITE_COGNIS_API_KEY || "sk-cognis-workforce-prod-valid-key-45678";
window.ENV.VITE_COGNIS_DEFAULT_MODEL = "Cognis-Zenith-4.0";
window.ENV.VITE_APP_VERSION = "1.0.0";
window.ENV.VITE_SELF_HOSTED = "true";

// Allow local overrides from localStorage if present
try {
  const storedEnv = localStorage.getItem('cognis_env_config');
  if (storedEnv) {
    const parsedEnv = JSON.parse(storedEnv);
    Object.assign(window.ENV, parsedEnv);
    console.log("Loaded environment configuration from localStorage");
  }
} catch (e) {
  console.warn("Failed to load environment from localStorage", e);
}

console.log("Environment configuration loaded");
