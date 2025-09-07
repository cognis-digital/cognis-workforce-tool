/**
 * Default API key for demo purposes
 * This ensures basic functionality when no API key is provided
 */

(function() {
  if (typeof window !== 'undefined') {
    // Initialize ENV object if not already present
    if (!window.ENV) {
      window.ENV = {};
    }
    
    // Only set default API key if none is present
    if (!window.ENV.VITE_COGNIS_API_KEY) {
      // Demo API key for GitHub Pages deployment
      window.ENV.VITE_COGNIS_API_KEY = 'cg-demo-28fDJSkwL9TmRzX5pHvN6qyYaGc3E';
      
      console.log('Using demo API key for basic functionality');
    }
  }
})();
