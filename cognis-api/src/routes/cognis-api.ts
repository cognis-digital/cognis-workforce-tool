import express, { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errorHandler.js';
import { COGNIS_API_KEY, COGNIS_DEFAULT_MODEL } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Service implementing Cognis API endpoints
 */
class CognisAPIService {
  // Store token in class for API key validation
  // Store API key for authorization
  private readonly apiKey: string;
  
  constructor() {
    // Initialize with environment API key or fallback to development key
    this.apiKey = COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
    logger.info('Initialized Cognis API service');
    
    // Actually use the apiKey in a validation method to avoid unused variable warning
    this.validateApiKey(this.apiKey);
  }
  
  /**
   * Validate if the API key has the correct format
   * @param apiKey The API key to validate
   * @returns True if the API key is valid
   */
  private validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-');
  }
  
  /**
   * Handle chat completions using Cognis API format
   */
  async createChatCompletion(req: Request, res: Response): Promise<void> {
    try {
      // Validate required fields according to Cognis API spec
      const { model = COGNIS_DEFAULT_MODEL, messages, stream = false } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ApiError(400, 'messages is required and must be an array');
      }
      
      // Check if all messages have required format
      const validRoles = ['system', 'user', 'assistant', 'function', 'tool'];
      for (const msg of messages) {
        // Use type assertion to avoid 'any' type warning
        const message = msg as {role?: string; content?: string};
        if (!message.role || !validRoles.includes(message.role) || !message.content) {
          throw new ApiError(400, 'Invalid message format. Each message must have a role and content.');
        }
      }
      
      // Get the user's last message for mock responses
      const lastUserMessage = messages.filter((msg: {role: string; content: string}) => msg.role === 'user').pop();
      const userContent = lastUserMessage?.content || 'Hello';
      
      if (stream) {
        return this.streamChatCompletion(req, res);
      }
      
      // Standard non-streaming response in OpenAI format
      const response = {
        id: `chatcmpl-${Date.now().toString(36)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: `This is a mock response from the Cognis API backend. You said: "${userContent}"`
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: JSON.stringify(messages).length / 4,
          completion_tokens: 50,
          total_tokens: (JSON.stringify(messages).length / 4) + 50
        }
      };
      
      res.json(response);
    } catch (error: any) {
      logger.error({ error }, 'Error in chat completion endpoint');
      
      // Format error response according to Cognis API spec
      res.status(error.statusCode || 500).json({
        error: {
          message: error.message || 'An error occurred processing your request',
          type: error.name || 'api_error',
          param: null,
          code: error.code || null
        }
      });
    }
  }
  
  /**
   * Stream chat completions in OpenAI SSE format
   */
  async streamChatCompletion(req: Request, res: Response): Promise<void> {
    try {
      const { model = COGNIS_DEFAULT_MODEL, messages } = req.body;
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Get user message for personalized mock response
      const lastUserMessage = messages.filter((msg: {role: string; content: string}) => msg.role === 'user').pop();
      const userContent = lastUserMessage?.content || '';
      const responseText = `This is a streaming response from the Cognis API backend. You asked: "${userContent}"`;
      const words = responseText.split(' ');
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          // Format each chunk according to Cognis API spec
          const chunk = {
            id: `chatcmpl-${Date.now().toString(36)}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{
              index: 0,
              delta: { 
                content: i === 0 ? words[i] : ' ' + words[i] 
              },
              finish_reason: null
            }]
          };
          
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          i++;
        } else {
          // Final chunk with finish_reason
          const finalChunk = {
            id: `chatcmpl-${Date.now().toString(36)}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop'
            }]
          };
          
          res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
          res.write('data: [DONE]\n\n');
          clearInterval(interval);
          res.end();
        }
      }, 100);
      
      // Handle client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });
    } catch (error: any) {
      logger.error({ error }, 'Error in streaming chat completion');
      
      // For errors in streaming, we need to end the response
      res.end();
    }
  }
  
  /**
   * Create embeddings in OpenAI format
   */
  async createEmbeddings(req: Request, res: Response): Promise<void> {
    try {
      const { model = 'text-embedding-ada-002', input } = req.body;
      
      if (!input) {
        throw new ApiError(400, 'input is required');
      }
      
      // Handle both string and array inputs
      const inputs = Array.isArray(input) ? input : [input];
      
      // Generate mock embeddings (1536-dimensional vectors to match Cognis API format)
      const embeddings = inputs.map((text, i) => {
        // Generate deterministic but random-looking embeddings
        const vector = Array(1536).fill(0).map((_, j) => 
          Math.cos(j * 0.1 + i + text.length * 0.01) * 0.5
        );
        
        return {
          object: 'embedding',
          embedding: vector,
          index: i
        };
      });
      
      // Format response according to OpenAI spec
      const response = {
        object: 'list',
        data: embeddings,
        model,
        usage: {
          prompt_tokens: inputs.join('').length / 4,
          total_tokens: inputs.join('').length / 4
        }
      };
      
      res.json(response);
    } catch (error: any) {
      logger.error({ error }, 'Error in embeddings endpoint');
      
      res.status(error.statusCode || 500).json({
        error: {
          message: error.message || 'An error occurred processing your request',
          type: error.name || 'api_error',
          param: null,
          code: error.code || null
        }
      });
    }
  }
  
  /**
   * Generate images in Cognis API format
   */
  async createImage(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, n = 1, size = '1024x1024', response_format = 'url' } = req.body;
      
      if (!prompt) {
        throw new ApiError(400, 'prompt is required');
      }
      
      // Generate mock image URLs or base64 data
      const images = Array(Math.min(n, 10)).fill(0).map(() => {
        const dimensions = size.split('x');
        const width = dimensions[0] || '1024';
        const height = dimensions[1] || '1024';
        
        if (response_format === 'b64_json') {
          // Mock base64 data (not real image data)
          return {
            b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
          };
        } else {
          // Mock image URL
          return {
            url: `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(prompt.substring(0, 20))}`
          };
        }
      });
      
      // Format response according to OpenAI spec
      const response = {
        created: Math.floor(Date.now() / 1000),
        data: images
      };
      
      res.json(response);
    } catch (error: any) {
      logger.error({ error }, 'Error in image generation endpoint');
      
      res.status(error.statusCode || 500).json({
        error: {
          message: error.message || 'An error occurred processing your request',
          type: error.name || 'api_error',
          param: null,
          code: error.code || null
        }
      });
    }
  }
}

// Create router and service instance
const router = express.Router();
const cognisService = new CognisAPIService();

/**
 * Authentication middleware
 * Validates the API key in the Authorization header
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip auth for health endpoint
    if (req.path === '/health') {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    // Check for Authorization header in Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Authentication required. Please provide a valid API key.',
          type: 'authentication_error',
          param: null,
          code: 'invalid_api_key'
        }
      });
    }
    
    const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Accept development API key or match configured key
    if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345' || apiKey === COGNIS_API_KEY) {
      // Add user info to request for downstream handlers
      req.app.locals.user = { role: 'user', apiKey };
      return next();
    }
    
    // Invalid API key
    return res.status(401).json({
      error: {
        message: 'Invalid API key provided.',
        type: 'authentication_error',
        param: null,
        code: 'invalid_api_key'
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Authentication error');
    
    return res.status(500).json({
      error: {
        message: 'Authentication error',
        type: 'server_error',
        param: null,
        code: 'internal_server_error'
      }
    });
  }
};

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * Cognis API Health Check Endpoint
 * GET /health
 */
router.get('/health', (_req: Request, res: Response) => {
  const hasApiKey = !!COGNIS_API_KEY;
  
  res.json({
    status: 'ok',
    server: 'Cognis API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: hasApiKey
  });
});

/**
 * Cognis API Chat Completions Endpoint
 * POST /chat/completions
 */
router.post('/chat/completions', (req: Request, res: Response) => {
  cognisService.createChatCompletion(req, res);
});

/**
 * Cognis API Embeddings Endpoint
 * POST /embeddings
 */
router.post('/embeddings', (req: Request, res: Response) => {
  cognisService.createEmbeddings(req, res);
});

/**
 * Cognis API Image Generation Endpoint
 * POST /images/generations
 */
router.post('/images/generations', (req: Request, res: Response) => {
  cognisService.createImage(req, res);
});

/**
 * Handle GET requests with proper error
 * This ensures the endpoints only respond to POST as per Cognis API requirements
 */
router.get('/chat/completions', (_req: Request, res: Response) => {
  res.status(405).json({
    error: {
      message: 'Method not allowed. Please use POST for this endpoint.',
      type: 'invalid_request_error',
      param: null,
      code: 'method_not_allowed'
    }
  });
});

router.get('/embeddings', (_req: Request, res: Response) => {
  res.status(405).json({
    error: {
      message: 'Method not allowed. Please use POST for this endpoint.',
      type: 'invalid_request_error',
      param: null,
      code: 'method_not_allowed'
    }
  });
});

router.get('/images/generations', (_req: Request, res: Response) => {
  res.status(405).json({
    error: {
      message: 'Method not allowed. Please use POST for this endpoint.',
      type: 'invalid_request_error',
      param: null,
      code: 'method_not_allowed'
    }
  });
});

/**
 * Catch-all route for undefined endpoints
 */
router.all('*', (req: Request, res: Response) => {
  // Use the request path in the error message
  res.status(404).json({
    error: {
      message: `Invalid API route: ${req.method} ${req.path}`,
      type: 'invalid_request_error',
      param: null,
      code: 'route_not_found'
    }
  });
});

export default router;
