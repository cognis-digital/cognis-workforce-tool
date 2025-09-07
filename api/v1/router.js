/**
 * Self-hosted API router for Cognis Workforce Tool
 * This router intercepts API requests and serves appropriate responses 
 * from static files when running in GitHub Pages or other static hosts
 */

(function() {
  // Check if we should activate the router
  const isSelfHosted = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('selfHosted') === 'true' || 
           urlParams.get('local') === 'true' ||
           (window.ENV && window.ENV.VITE_SELF_HOSTED === 'true');
  };
  
  if (!isSelfHosted()) {
    console.log('Self-hosted mode not enabled, API router not activated');
    return;
  }
  
  console.log('Self-hosted API router activated');
  
  // API endpoint mappings to static files
  const staticEndpoints = {
    '/api/v1/health': '/api/v1/health',
    '/api/v1/chat/completions': '/api/v1/chat/completions',
    '/api/health': '/api/health.json',
    '/api/models': '/api/models.json'
  };
  
  // Mock response data for dynamic endpoints
  const mockResponses = {
    '/api/v1/embeddings': {
      data: [
        {
          embedding: Array(768).fill(0).map(() => Math.random() * 2 - 1),
          index: 0
        }
      ],
      usage: {
        prompt_tokens: 8,
        total_tokens: 8
      }
    }
  };
  
  // Intercept fetch requests
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    // Get the URL from input
    const url = typeof input === 'string' ? input : input.url;
    
    // Check if this is an API request we should intercept
    if (url.includes('/api/')) {
      console.log(`Intercepting API request to: ${url}`);
      
      // Check for static endpoints
      for (const [endpoint, staticPath] of Object.entries(staticEndpoints)) {
        if (url.includes(endpoint)) {
          console.log(`Serving from static file: ${staticPath}`);
          return originalFetch(staticPath, init);
        }
      }
      
      // Check for mock response endpoints
      for (const [endpoint, mockData] of Object.entries(mockResponses)) {
        if (url.includes(endpoint)) {
          console.log(`Serving mock data for: ${endpoint}`);
          
          // For POST requests, modify the mock response based on the request body
          if (init && init.method === 'POST' && init.body) {
            try {
              const requestBody = JSON.parse(init.body);
              
              // For embeddings endpoint, adjust the response based on input
              if (endpoint.includes('/embeddings') && requestBody.input) {
                const inputLength = Array.isArray(requestBody.input) 
                  ? requestBody.input.join(' ').length 
                  : requestBody.input.length;
                
                mockData.usage.prompt_tokens = Math.ceil(inputLength / 4);
                mockData.usage.total_tokens = mockData.usage.prompt_tokens;
              }
            } catch (e) {
              console.warn('Error parsing request body:', e);
            }
          }
          
          // Return mock response as JSON
          return new Response(JSON.stringify(mockData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      console.warn(`No mock or static handler found for: ${url}`);
    }
    
    // Pass through to original fetch for non-API requests
    return originalFetch(input, init);
  };
})();
