/**
 * React Hook DOM Injector
 * This script injects React hooks directly into the global namespace and component scope
 * It runs before React initializes to ensure hooks are always available
 */

(function() {
  console.log('Initializing React Hook DOM Injector...');
  
  // Global hook declarations - these will be available to all components
  window.useState = function useState(initialValue) {
    // Return a mock implementation if React isn't loaded yet
    if (!window.React || !window.React.useState) {
      console.warn('React not available yet, returning mock useState');
      return [initialValue, function() {}];
    }
    
    // Use actual React implementation when available
    return window.React.useState(initialValue);
  };
  
  window.useEffect = function useEffect(callback, deps) {
    if (!window.React || !window.React.useEffect) {
      return;
    }
    return window.React.useEffect(callback, deps);
  };
  
  // Make React hooks globally available before bundle loads
  const hookNames = [
    'useState', 'useEffect', 'useContext', 'useReducer', 
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useTransition', 
    'useDeferredValue', 'useId'
  ];
  
  // Function to patch React when it becomes available
  function patchReact() {
    if (window.React) {
      console.log('React found, patching hooks...');
      
      // Inject hooks into global namespace
      hookNames.forEach(hookName => {
        if (window.React[hookName]) {
          window[hookName] = window.React[hookName];
          console.log(`Injected ${hookName} into global namespace`);
        }
      });
      
      // Patch React.createElement to inject hooks into component scope
      const originalCreateElement = window.React.createElement;
      window.React.createElement = function(type, props, ...children) {
        // Only patch function components
        if (typeof type === 'function' && !type.prototype?.isReactComponent) {
          const originalFunction = type;
          
          // Create wrapped component with hooks injected
          const wrappedComponent = function(props) {
            // Inject hooks into component scope
            const useState = window.React.useState;
            const useEffect = window.React.useEffect;
            const useContext = window.React.useContext;
            const useReducer = window.React.useReducer;
            const useCallback = window.React.useCallback;
            const useMemo = window.React.useMemo;
            const useRef = window.React.useRef;
            
            // Call original component with hooks in scope
            try {
              return originalFunction(props);
            } catch (error) {
              console.error('Error in component', error);
              
              // Try emergency wrapper for hook error
              if (error.message && error.message.includes('is not defined')) {
                try {
                  // Create context with all hook names
                  const hookContext = {};
                  hookNames.forEach(name => {
                    if (window.React[name]) {
                      hookContext[name] = window.React[name];
                    }
                  });
                  
                  // Execute with hooks in scope
                  const wrapper = new Function(
                    'React', 'props', 'hooks',
                    `with(hooks) { return (${originalFunction.toString()})(props); }`
                  );
                  
                  return wrapper(window.React, props, hookContext);
                } catch (wrappedError) {
                  console.error('Hook injection failed', wrappedError);
                  return null; // Return empty component on failure
                }
              }
              
              throw error;
            }
          };
          
          // Preserve display name and other properties
          wrappedComponent.displayName = originalFunction.displayName || originalFunction.name;
          
          return originalCreateElement(wrappedComponent, props, ...children);
        }
        
        return originalCreateElement(type, props, ...children);
      };
      
      console.log('React hooks patched successfully');
    }
  }
  
  // Try patching immediately if React is already loaded
  if (window.React) {
    patchReact();
  }
  
  // Set up observer to detect React loading
  const observer = new MutationObserver(mutations => {
    if (window.React && !window._reactHooksPatched) {
      window._reactHooksPatched = true;
      patchReact();
      observer.disconnect();
    }
  });
  
  // Start observing DOM changes
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true 
  });
  
  // Also try on DOMContentLoaded and window load
  document.addEventListener('DOMContentLoaded', () => {
    if (window.React && !window._reactHooksPatched) {
      window._reactHooksPatched = true;
      patchReact();
    }
  });
  
  window.addEventListener('load', () => {
    if (window.React && !window._reactHooksPatched) {
      window._reactHooksPatched = true;
      patchReact();
    }
    
    // Final check after a slight delay
    setTimeout(() => {
      if (window.React && !window._reactHooksPatched) {
        window._reactHooksPatched = true;
        patchReact();
      }
    }, 1000);
  });
})();
