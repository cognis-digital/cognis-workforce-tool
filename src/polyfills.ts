/**
 * Global polyfills for the Cognis Workforce Tool
 * This file should be imported before any other code in the application
 */

// UUID Polyfill
if (typeof crypto !== 'undefined') {
  if (typeof crypto.randomUUID !== 'function') {
    Object.defineProperty(crypto, 'randomUUID', {
      value: function() {
        // Simple UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      enumerable: false,
      configurable: true
    });
    console.info('crypto.randomUUID polyfill installed');
  }
}

// Export a dummy function to ensure this file is not tree-shaken
export function ensurePolyfills() {
  return true;
}
