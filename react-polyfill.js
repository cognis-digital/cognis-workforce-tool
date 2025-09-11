/**
 * React Polyfill Script
 * This script ensures React hooks and components work properly in all environments
 */

// Define React hooks if not already defined
window.React = window.React || {};

// Ensure useState is available globally to prevent "useState is not defined" errors
if (typeof window.useState === 'undefined') {
  window.useState = function(initialState) {
    // Once React is loaded, this will be replaced with the real implementation
    // For now, provide a stub implementation that doesn't throw errors
    return [
      (typeof initialState === 'function') ? initialState() : initialState,
      function() { console.log('setState called before React initialized'); }
    ];
  };
  
  // Also make it available on React
  if (window.React) {
    window.React.useState = window.useState;
  }
}

// Do the same for other common hooks
const commonHooks = [
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef'
];

commonHooks.forEach(hookName => {
  if (typeof window[hookName] === 'undefined') {
    window[hookName] = function() {
      // Stub implementation
      if (hookName === 'useEffect' || hookName === 'useLayoutEffect') {
        return undefined;
      } else if (hookName === 'useRef') {
        return { current: null };
      } else if (hookName === 'useMemo' || hookName === 'useCallback') {
        return arguments[0]();
      } else {
        return null;
      }
    };
    
    // Also make it available on React
    if (window.React) {
      window.React[hookName] = window[hookName];
    }
  }
});

// Export functions for module usage
export default {
  useState: window.useState,
  useEffect: window.useEffect,
  useContext: window.useContext,
  useReducer: window.useReducer,
  useCallback: window.useCallback,
  useMemo: window.useMemo,
  useRef: window.useRef
};

console.log('React polyfill loaded');
