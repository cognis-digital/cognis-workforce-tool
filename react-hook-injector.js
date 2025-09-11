/**
 * React Hooks Injector
 * This script ensures React hooks are properly available in production build
 * It helps fix the "useState is not defined" error
 */

// Make React hooks globally available
window.React = window.React || {};
window.ReactHooks = window.ReactHooks || {};

// Export common React hooks to global scope to avoid 'not defined' errors
const hooks = [
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue'
];

// Handle dynamic hook imports when React becomes available
const injectHooks = () => {
  if (window.React) {
    hooks.forEach(hookName => {
      if (window.React[hookName]) {
        window.ReactHooks[hookName] = window.React[hookName];
        // Ensure global availability
        if (typeof window[hookName] === 'undefined') {
          window[hookName] = window.React[hookName];
        }
      }
    });
    console.log('React hooks successfully injected');
  }
};

// Try to inject hooks immediately if React is already loaded
injectHooks();

// Otherwise wait for React to load
document.addEventListener('DOMContentLoaded', () => {
  // Try again when the DOM is loaded
  setTimeout(injectHooks, 100);
});

// Inject hooks when React is dynamically imported
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, desc) {
  const result = originalDefineProperty.call(this, obj, prop, desc);
  if (prop === 'useState' && obj === window.React) {
    injectHooks();
  }
  return result;
};

// Export for module usage
export const ReactHooksInjector = {
  injectHooks
};

console.log('React hook injector loaded');
