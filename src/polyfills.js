/**
 * Polyfills for Cognis Workforce Tool
 * This file should be loaded before any other JavaScript in the application
 */

// crypto.randomUUID polyfill
export function initPolyfills() {
  if (typeof window !== 'undefined' && window.crypto) {
    if (typeof window.crypto.randomUUID !== 'function') {
      window.crypto.randomUUID = function() {
        // Simple UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      console.info('crypto.randomUUID polyfill installed');
    }
  }

  // Runtime error handler for message channel errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(event) {
      if (event && event.error && event.error.message && 
          (event.error.message.includes('message channel closed') || 
           event.error.message.includes('runtime.lastError'))) {
        // Prevent the uncaught error from appearing in the console
        event.preventDefault();
        return true;
      }
    }, true);
  }

  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', function(event) {
      if (event && event.reason && event.reason.message && 
          (event.reason.message.includes('message channel closed') || 
           event.reason.message.includes('runtime.lastError'))) {
        // Prevent the rejection from appearing in the console
        event.preventDefault();
        return true;
      }
    });
  }
}

// Auto-initialize polyfills
initPolyfills();
