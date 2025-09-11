import express, { Request, Response, NextFunction } from 'express';
import { asyncHandler, ApiError } from '../utils/errorHandler.js';
import { COGNIS_API_KEY, COGNIS_DEFAULT_MODEL } from '../config/env.js';
import logger from '../utils/logger.js';

// Create a minimal CognisService class in case the actual one isn't available
class MinimalCognisService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
    logger.info('Using minimal Cognis service implementation');
  }
  
  // Handle mock responses for development
  handleMockChatCompletion(req: Request, res: Response): void {
    const { messages } = req.body;
    const lastUserMessage = messages.filter((msg: any) => msg.role === 'user').pop();
    const userContent = lastUserMessage?.content || 'Hello';
    
    // Generate a mock response following OpenAI's format
    const mockResponse = {
      id: `chatcmpl-${Date.now().toString(36)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: req.body.model || COGNIS_DEFAULT_MODEL,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: `I'm a mock Cognis AI response. You said: "${userContent}". This is a development mode response.`
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: userContent.length,
        completion_tokens: 50,
        total_tokens: userContent.length + 50
      }
    };
    
    res.json(mockResponse);
  }
  
  // Mock implementation for embeddings
  handleMockEmbeddings(req: Request, res: Response): void {
    const { input } = req.body;
    const texts = Array.isArray(input) ? input : [input];
    
    // Create mock embeddings (128-dimensional vectors)
    const embeddings = texts.map((text, index) => ({
      embedding: Array(128).fill(0).map((_, i) => Math.sin(i * 0.1 + index)),
      index
    }));
    
    res.json({
      object: 'list',
      data: embeddings,
      model: req.body.model || 'text-embedding-ada-002',
      usage: {
        prompt_tokens: texts.join('').length,
        total_tokens: texts.join('').length
      }
    });
  }
  
  // Mock implementations for other methods
  handleMockImageGeneration(req: Request, res: Response): void {
    res.json({
      created: Math.floor(Date.now() / 1000),
      data: [{ url: 'https://via.placeholder.com/512x512?text=Mock+Image' }]
    });
  }
  
  // Stream chat completion - not implemented in mock version
  streamChatCompletion(req: Request, res: Response): void {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send a simple mock stream
    const message = "This is a mock streaming response from the Cognis API backend.";
    const words = message.split(' ');
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        const chunk = {
          id: `chatcmpl-${Date.now().toString(36)}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: req.body.model || COGNIS_DEFAULT_MODEL,
          choices: [{
            index: 0,
            delta: { content: i === 0 ? words[i] : ' ' + words[i] },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        i++;
      } else {
        // End the stream
        res.write(`data: {"id":"chatcmpl-${Date.now().toString(36)}","object":"chat.completion.chunk","created":${Math.floor(Date.now()/1000)},"model":"${req.body.model || COGNIS_DEFAULT_MODEL}","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n`);
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 100);
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
  }
}

// Use the real service if available, otherwise use our minimal implementation
let CognisService: any;
try {
  const importedService = require('../services/cognis.js');
  CognisService = importedService.CognisService;
} catch (error) {
  logger.warn('Cognis service module not available, using minimal implementation');
  CognisService = MinimalCognisService;
}

const router = express.Router();
const cognisService = new CognisService();

/**
 * Authentication middleware for Cognis API routes
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for health endpoint
  if (req.path === '/health') {
    return next();
  }

  // Get the API key from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please provide a valid API key.');
  }
  
  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // For development, accept the development key
  if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
    req.app.locals.isDevMode = true;
    return next();
  }
  
  // TODO: In production, validate the API key against database
  // For now, we'll check against the configured API key or in-memory storage
  if (apiKey !== COGNIS_API_KEY) {
    throw new ApiError(403, 'Invalid API key.');
  }
  
  next();
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/health
 * Health check endpoint for the Cognis API
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const hasApiKey = !!COGNIS_API_KEY;
  
  res.status(200).json({
    status: 'ok',
    service: 'Cognis API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: hasApiKey,
  });
}));

/**
 * POST /api/v1/chat/completions
 * Chat completions endpoint
 */
router.post('/chat/completions', asyncHandler(async (req: Request, res: Response) => {
  const { model = COGNIS_DEFAULT_MODEL, messages, temperature = 0.7, max_tokens = 1000, stream = false } = req.body;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, 'Messages array is required and must not be empty.');
  }
  
  // Check if using development mode to provide mock responses
  if (req.app.locals.isDevMode) {
    logger.debug('Using development mode - providing mock response');
    return cognisService.handleMockChatCompletion(req, res);
  }
  
  // Forward to the actual Cognis API
  try {
    if (stream) {
      // Handle streaming response
      return await cognisService.streamChatCompletion(req, res);
    } else {
      // Handle regular response
      const response = await cognisService.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens,
        stream
      });
      
      res.status(200).json(response);
    }
  } catch (error: any) {
    logger.error({ error }, 'Error from Cognis API');
    throw new ApiError(error.statusCode || 500, error.message || 'Error from Cognis API');
  }
}));

/**
 * POST /api/v1/embeddings
 * Embeddings endpoint
 */
router.post('/embeddings', asyncHandler(async (req: Request, res: Response) => {
  const { model = 'Cognis-Nova-3.0', input } = req.body;
  
  if (!input) {
    throw new ApiError(400, 'Input is required.');
  }
  
  if (typeof input !== 'string' && (!Array.isArray(input) || input.length === 0)) {
    throw new ApiError(400, 'Input must be a string or a non-empty array of strings.');
  }
  
  // Check if using development mode to provide mock responses
  if (req.app.locals.isDevMode) {
    logger.debug('Using development mode - providing mock response');
    return cognisService.handleMockEmbeddings(req, res);
  }
  
  // Forward to the actual Cognis API
  try {
    const response = await cognisService.createEmbeddings({
      model,
      input
    });
    
    res.status(200).json(response);
  } catch (error: any) {
    logger.error({ error }, 'Error from Cognis API');
    throw new ApiError(error.statusCode || 500, error.message || 'Error from Cognis API');
  }
}));

/**
 * POST /api/v1/images/generate
 * Image generation endpoint
 */
router.post('/images/generate', asyncHandler(async (req: Request, res: Response) => {
  const { prompt, n = 1, size = '1024x1024', response_format = 'url' } = req.body;
  
  if (!prompt) {
    throw new ApiError(400, 'Prompt is required.');
  }
  
  // Check if using development mode to provide mock responses
  if (req.app.locals.isDevMode) {
    logger.debug('Using development mode - providing mock response');
    return cognisService.handleMockImageGeneration(req, res);
  }
  
  // Forward to the actual Cognis API
  try {
    const response = await cognisService.generateImage({
      prompt,
      n,
      size,
      response_format
    });
    
    res.status(200).json(response);
  } catch (error: any) {
    logger.error({ error }, 'Error from Cognis API');
    throw new ApiError(error.statusCode || 500, error.message || 'Error from Cognis API');
  }
}));

/**
 * POST /api/v1/audio/speech
 * Text-to-speech endpoint
 */
router.post('/audio/speech', asyncHandler(async (req: Request, res: Response) => {
  const { input, voice = 'alloy', response_format = 'mp3', speed = 1.0 } = req.body;
  
  if (!input) {
    throw new ApiError(400, 'Input text is required.');
  }
  
  // Check if using development mode to provide mock responses
  if (req.app.locals.isDevMode) {
    logger.debug('Using development mode - providing mock response');
    return cognisService.handleMockSpeech(req, res);
  }
  
  // Forward to the actual Cognis API
  try {
    const audioBuffer = await cognisService.createSpeech({
      input,
      voice,
      response_format,
      speed
    });
    
    // Set content type based on response format
    const contentType = response_format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="speech.${response_format}"`);
    
    res.status(200).send(audioBuffer);
  } catch (error: any) {
    logger.error({ error }, 'Error from Cognis API');
    throw new ApiError(error.statusCode || 500, error.message || 'Error from Cognis API');
  }
}));

/**
 * POST /api/v1/audio/transcriptions
 * Speech-to-text endpoint
 */
router.post('/audio/transcriptions', asyncHandler(async (req: Request, res: Response) => {
  // This would normally be multipart/form-data for file uploads
  // For simplicity in this implementation, we'll assume the audio content is already available
  const { file, language = 'en', prompt = '' } = req.body;
  
  if (!file) {
    throw new ApiError(400, 'Audio file is required.');
  }
  
  // Check if using development mode to provide mock responses
  if (req.app.locals.isDevMode) {
    logger.debug('Using development mode - providing mock response');
    return cognisService.handleMockTranscription(req, res);
  }
  
  // Forward to the actual Cognis API
  try {
    const response = await cognisService.createTranscription({
      file,
      language,
      prompt
    });
    
    res.status(200).json(response);
  } catch (error: any) {
    logger.error({ error }, 'Error from Cognis API');
    throw new ApiError(error.statusCode || 500, error.message || 'Error from Cognis API');
  }
}));

export default router;
