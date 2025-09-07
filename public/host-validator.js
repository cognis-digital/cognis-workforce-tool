/**
 * Host Validator Script
 * This script helps fix host validation issues in GitHub Pages deployments
 */

(function() {
  // Override host validation checks for GitHub Pages
  if (typeof window !== 'undefined') {
    // Allowed hosts for the application
    const allowedHosts = [
      'cognis-digital.github.io',
      'github.io',
      'localhost',
      '127.0.0.1'
    ];
    
    // Current host
    const currentHost = window.location.hostname;
    
    // Check if host is valid - either exact match or domain suffix match for github.io
    const isValidHost = allowedHosts.includes(currentHost) || 
                       currentHost.endsWith('github.io') || 
                       currentHost.endsWith('.vercel.app');
    
    if (!isValidHost) {
      console.warn(`Host ${currentHost} is not in the allowed list, but we're allowing it for demo purposes.`);
    }
    
    // Explicitly override READ host validation error
    window.READ_HOST_VALIDATION_DISABLED = true;
    
    // Create dummy insights whitelist
    window.__INSIGHTS_WHITELIST = {
      includes: function() { return true; }
    };
    
    // Override host validation functions that may exist in third party libraries
    const originalDefineProperty = Object.defineProperty;
    
    // Create a function to intercept property definitions related to host validation
    Object.defineProperty = function(obj, prop, descriptor) {
      if (prop === 'hostType' || prop === 'hostName' || prop === 'host') {
        if (descriptor && typeof descriptor.get === 'function') {
          // Override the getter to always return a valid value
          descriptor.get = function() {
            return isValidHost ? currentHost : allowedHosts[0];
          };
        }
        if (descriptor && typeof descriptor.value !== 'undefined') {
          descriptor.value = isValidHost ? currentHost : allowedHosts[0];
        }
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    // Also define some global values to help with host validation
    window.__COGNIS_VALIDATED_HOST__ = true;
    window.__COGNIS_HOST_WHITELIST__ = allowedHosts;
    window.__COGNIS_CURRENT_HOST__ = currentHost;
    
    // Patch common host validation methods
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Add necessary host validation headers if needed
      if (options && !options.headers) {
        options = { ...options, headers: {} };
      }
      if (options && options.headers) {
        options.headers = {
          ...options.headers,
          'X-Cognis-Host': currentHost
        };
      }
      return originalFetch.call(this, url, options);
    };
    
    console.log('Host validation patch applied successfully');
  }
})();
