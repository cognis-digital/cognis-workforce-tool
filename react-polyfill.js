/**
 * React Hooks Polyfill
 * This ensures React hooks are always accessible, even in minified code
 */

(function() {
  // Ensure window.React is available
  if (typeof window !== 'undefined' && window.React) {
    // Create global hooks in window for minified code to use
    window.useState = window.React.useState;
    window.useEffect = window.React.useEffect;
    window.useContext = window.React.useContext;
    window.useReducer = window.React.useReducer;
    window.useCallback = window.React.useCallback;
    window.useMemo = window.React.useMemo;
    window.useRef = window.React.useRef;
    window.useImperativeHandle = window.React.useImperativeHandle;
    window.useLayoutEffect = window.React.useLayoutEffect;
    window.useDebugValue = window.React.useDebugValue;
    
    console.log('React hooks polyfill applied successfully');
  } else {
    console.warn('React hooks polyfill could not be applied - React not found');
  }
})();
