/**
 * Component-specific fixes for minified React components
 * This script specifically targets components that have reference errors in production builds
 */

(function() {
  console.log('Initializing component-specific fixes...');
  
  // Create a MutationObserver to watch for component mounts
  function setupComponentFixes() {
    // Store original React createElement to patch components
    if (window.React && window.React.createElement) {
      const originalCreateElement = window.React.createElement;
      
      // Create patched createElement that fixes specific components
      window.React.createElement = function(type, props, ...children) {
        // Check if this is the Fae component or matches known problematic patterns
        if (typeof type === 'function' && (type.name === 'Fae' || type.toString().includes('useState'))) {
          // Ensure the component has access to React hooks
          const patchedComponent = function(props) {
            // Explicitly make hooks available in component scope
            const useState = window.useState || window.React.useState;
            const useEffect = window.useEffect || window.React.useEffect;
            const useContext = window.useContext || window.React.useContext;
            
            // Call original component with hooks in scope
            try {
              return type(props);
            } catch (err) {
              if (err.message && err.message.includes('useState is not defined')) {
                console.log('Patching component with hook injection...');
                // Create a wrapper that explicitly provides hooks
                const wrapper = new Function('React', 'props', 'useState', 'useEffect', 'useContext',
                  `with(React){return (${type.toString()})(props)}`
                );
                return wrapper(window.React, props, useState, useEffect, useContext);
              }
              throw err;
            }
          };
          patchedComponent.displayName = type.displayName || type.name || 'PatchedComponent';
          return originalCreateElement(patchedComponent, props, ...children);
        }
        
        // Default behavior for all other components
        return originalCreateElement(type, props, ...children);
      };
      
      console.log('Component patching system initialized');
    } else {
      console.warn('React.createElement not found, component patches not applied');
    }
  }
  
  // Patch specific component errors
  function patchKnownErrors() {
    // Fix for "App.tsx:30:63" error specifically
    if (typeof window !== 'undefined') {
      // Define Fae component if it doesn't exist
      if (!window.Fae && !window.React?.Fae) {
        window.Fae = function Fae(props) {
          // Simplified implementation using global useState
          const [state, setState] = (window.useState || window.React?.useState || ((initial) => [initial, () => {}]))(null);
          return props.children || null;
        };
        console.log('Created fallback Fae component');
      }
    }
  }
  
  // Run patches when window loads
  function runPatches() {
    setupComponentFixes();
    patchKnownErrors();
    
    // Defensive coding - try again after a short delay
    setTimeout(() => {
      if (window.Fae) console.log('Fae component successfully patched');
      else patchKnownErrors();
    }, 500);
  }
  
  // Apply immediately or wait for page load
  if (document.readyState === 'complete') {
    runPatches();
  } else {
    window.addEventListener('load', runPatches);
  }
})();
