/**
 * Browser polyfills for Cognis Workforce Tool
 * Provides compatibility fixes for all browser environments
 */

// Add crypto.randomUUID polyfill
export function installCryptoPolyfill() {
  if (typeof window !== 'undefined' && window.crypto) {
    if (typeof window.crypto.randomUUID !== 'function') {
      window.crypto.randomUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      console.info('Installed crypto.randomUUID polyfill');
    }
  }
}

// Install message channel error handlers
export function installErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle error events
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          (event.error.message.includes('message channel closed') || 
           event.error.message.includes('runtime.lastError'))) {
        event.preventDefault();
        return true;
      }
    }, true);

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      if (event && event.reason && event.reason.message && 
          (event.reason.message.includes('message channel closed') || 
           event.reason.message.includes('runtime.lastError'))) {
        event.preventDefault();
        return true;
      }
    });
  }
}

// Initialize all polyfills
export function initPolyfills() {
  installCryptoPolyfill();
  installErrorHandlers();
  return true;
}

// Auto-initialize when imported
initPolyfills();
