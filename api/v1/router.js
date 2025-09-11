/**
 * API Router
 * This module provides client-side API routing for the Cognis Workforce Tool
 * It intercepts API requests and handles them appropriately
 */

(function() {
  // Initialize API router
  console.log('Initializing API router...');
  
  // API routes configuration
  const apiRoutes = {
    '/api/v1/health': { response: { status: 'ok', message: 'API is operational' }, status: 200 },
    '/api/v1/chat/completions': { handler: handleChatCompletions, status: 200 },
    '/api/v1/embeddings': { handler: handleEmbeddings, status: 200 }
  };
  
  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
    const urlPath = urlObj.pathname;
    
    // Check if this is an API request we should handle
    const apiRoute = Object.keys(apiRoutes).find(route => urlPath.includes(route));
    if (apiRoute) {
      console.log(`API router intercepting request to ${urlPath}`);
      
      // Get route config
      const routeConfig = apiRoutes[apiRoute];
      
      // Handle request
      if (routeConfig.handler) {
        return routeConfig.handler(url, options);
      } else {
        // Return static response
        return Promise.resolve(new Response(
          JSON.stringify(routeConfig.response || { status: 'ok' }),
          { 
            status: routeConfig.status || 200,
            headers: { 'Content-Type': 'application/json' }
          }
        ));
      }
    }
    
    // Pass through to original fetch for non-API requests
    return originalFetch.apply(this, arguments);
  };
  
  // Handler for chat completions endpoint
  async function handleChatCompletions(url, options) {
    try {
      // Parse request body
      const body = JSON.parse(options.body);
      const messages = body.messages || [];
      const lastMessage = messages[messages.length - 1]?.content || '';
      
      // Generate a simple response
      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: `This is a demo response. In production, this would process: "${lastMessage.substring(0, 50)}..."`
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: lastMessage.length / 4,
          completion_tokens: 20,
          total_tokens: (lastMessage.length / 4) + 20
        }
      };
      
      // Return a successful response
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response(
            JSON.stringify(response),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          ));
        }, 500); // Add a delay to simulate API call
      });
    } catch (error) {
      console.error('Error handling chat completions:', error);
      return new Response(
        JSON.stringify({ error: { message: 'Failed to process request' } }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // Handler for embeddings endpoint
  async function handleEmbeddings(url, options) {
    try {
      // Parse request body
      const body = JSON.parse(options.body);
      const input = body.input || '';
      
      // Generate mock embeddings
      const mockEmbedding = Array(384).fill(0).map(() => Math.random() * 2 - 1);
      
      // Create response
      const response = {
        data: Array.isArray(input) 
          ? input.map((_, i) => ({ embedding: mockEmbedding, index: i }))
          : [{ embedding: mockEmbedding, index: 0 }],
        usage: {
          prompt_tokens: typeof input === 'string' ? input.length / 4 : input.join(' ').length / 4,
          total_tokens: typeof input === 'string' ? input.length / 4 : input.join(' ').length / 4
        }
      };
      
      // Return a successful response
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(new Response(
            JSON.stringify(response),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          ));
        }, 300); // Add a delay to simulate API call
      });
    } catch (error) {
      console.error('Error handling embeddings:', error);
      return new Response(
        JSON.stringify({ error: { message: 'Failed to process embeddings request' } }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  console.log('API router initialized');
})();
