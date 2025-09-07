/**
 * Error handling utilities for Cognis Workforce Tool
 * Handles common browser and extension-related errors
 */

/**
 * Wraps a message channel response in a try-catch block to gracefully handle channel closures
 * @param callback Function to execute that may return a Promise
 * @returns A Promise that resolves with the result or silently catches channel closure errors
 */
export function safeMessageChannelResponse<T>(callback: () => Promise<T> | T): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      const result = callback();
      
      if (result instanceof Promise) {
        result
          .then(resolve)
          .catch(error => {
            // Check if it's a channel closure error
            if (error && 
                (error.message?.includes('message channel closed') || 
                 error.message?.includes('extension port'))) {
              console.debug('Ignoring message channel closure:', error.message);
              resolve(undefined);
            } else {
              // For other errors, log but don't crash
              console.error('Error in message channel:', error);
              resolve(undefined);
            }
          });
      } else {
        resolve(result);
      }
    } catch (error) {
      console.error('Error executing callback:', error);
      resolve(undefined);
    }
  });
}

/**
 * Add global error handler for runtime.lastError
 * Call this early in your application
 */
export function setupRuntimeErrorHandlers(): void {
  // Handle uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's a runtime.lastError or message channel error
    const error = event.reason;
    if (error && 
        (error.message?.includes('message channel closed') || 
         error.message?.includes('extension port') ||
         error.message?.includes('runtime.lastError'))) {
      // Prevent the default handler from running
      event.preventDefault();
      console.debug('Suppressed uncaught rejection:', error.message);
    }
  });

  // Patch console.error to filter certain errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out runtime.lastError messages
    if (args.length > 0 && 
        typeof args[0] === 'string' && 
        (args[0].includes('runtime.lastError') || 
         args[0].includes('message channel closed') ||
         args[0].includes('extension port'))) {
      console.debug('Suppressed error log:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

/**
 * Utility to safely access browser extension APIs
 * @param callback Function to execute that may trigger runtime.lastError
 * @returns The result of the callback or undefined if an error occurred
 */
export function safeExtensionCall<T>(callback: () => T): T | undefined {
  try {
    const result = callback();
    
    // Check for runtime.lastError which some browsers set after the call
    const chromeApi = window['chrome'];
    if (typeof chromeApi !== 'undefined' && chromeApi.runtime && chromeApi.runtime.lastError) {
      console.debug('Extension API error:', chromeApi.runtime.lastError.message);
      return undefined;
    }
    
    return result;
  } catch (error) {
    console.debug('Error in extension call:', error);
    return undefined;
  }
}
