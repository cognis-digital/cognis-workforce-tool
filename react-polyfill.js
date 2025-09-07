/**
 * Enhanced React Hooks Polyfill v2
 * This aggressively ensures React hooks are available in all contexts, even in minified code
 */

(function() {
  console.log('Initializing enhanced React hooks polyfill...');
  
  function initPolyfill() {
    // If React is already available
    if (typeof window.React !== 'undefined') {
      applyPolyfill(window.React);
      return true;
    }
    
    // If ReactDOM is available but React isn't directly
    if (typeof window.ReactDOM !== 'undefined' && window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED && 
        window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner) {
      // Extract React from ReactDOM's internals
      const React = { 
        useState: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useState,
        useEffect: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useEffect,
        useContext: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useContext,
        useReducer: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useReducer,
        useCallback: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useCallback,
        useMemo: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useMemo,
        useRef: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useRef,
        useImperativeHandle: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useImperativeHandle,
        useLayoutEffect: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useLayoutEffect,
        useDebugValue: window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useDebugValue,
      };
      
      window.React = React;
      applyPolyfill(React);
      return true;
    }
    
    // Search for React in all available properties
    for (const key in window) {
      try {
        const obj = window[key];
        if (obj && typeof obj === 'object' && obj.useState && obj.useEffect && obj.useContext) {
          console.log('Found React-like object in window.' + key);
          window.React = obj;
          applyPolyfill(obj);
          return true;
        }
      } catch (e) {
        // Ignore errors from cross-origin objects
      }
    }
    
    // Create mock hooks as last resort
    if (!window.useState) {
      console.warn('Creating mock React hooks...');
      // Simple mock implementations for useState and other hooks
      window.useState = function(initialValue) { return [initialValue, function() {}]; };
      window.useEffect = function() {};
      window.useContext = function() { return {}; };
      window.useReducer = function(reducer, initialState) { return [initialState, function() {}]; };
      window.useCallback = function(callback) { return callback; };
      window.useMemo = function(factory) { return factory(); };
      window.useRef = function(initialValue) { return { current: initialValue }; };
      window.useImperativeHandle = function() {};
      window.useLayoutEffect = function() {};
      window.useDebugValue = function() {};
    }
    
    return false;
  }
  
  function applyPolyfill(reactObj) {
    // Make hooks available globally
    window.useState = reactObj.useState;
    window.useEffect = reactObj.useEffect;
    window.useContext = reactObj.useContext;
    window.useReducer = reactObj.useReducer;
    window.useCallback = reactObj.useCallback;
    window.useMemo = reactObj.useMemo;
    window.useRef = reactObj.useRef;
    window.useImperativeHandle = reactObj.useImperativeHandle;
    window.useLayoutEffect = reactObj.useLayoutEffect;
    window.useDebugValue = reactObj.useDebugValue;
    
    // Also expose hooks as global variables without window prefix
    if (typeof globalThis !== 'undefined') {
      globalThis.useState = reactObj.useState;
      globalThis.useEffect = reactObj.useEffect;
      globalThis.useContext = reactObj.useContext;
    }
    
    console.log('React hooks polyfill applied successfully');
  }
  
  // If document is still loading, wait for it to complete
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPolyfill);
  } else {
    initPolyfill();
  }
  
  // Also attempt to apply after all resources load
  window.addEventListener('load', function() {
    if (!window.useState) {
      console.log('Retrying React hooks polyfill after page load...');
      initPolyfill();
    }
  });

})();
