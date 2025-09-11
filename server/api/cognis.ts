import { Router } from 'express';
import { z } from 'zod';
import { ENV } from '../util/env';
import { CognisAdapter } from '../llm/cognis';

// Request validation schemas
const ChatSchema = z.object({
  model: z.string().optional().default(ENV.COGNIS_DEFAULT_MODEL),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional()
});

const EmbeddingSchema = z.object({
  model: z.string().optional(),
  input: z.union([z.string(), z.array(z.string())])
});

const router = Router();
const cognisAdapter = new CognisAdapter();

// Health check endpoint
router.get('/health', (req, res) => {
  const hasApiKey = !!ENV.COGNIS_API_KEY;
  
  res.json({
    status: 'ok',
    server: 'Cognis API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: hasApiKey,
    backend: ENV.BACKEND
  });
});

// OpenAI-compatible chat completions endpoint
router.post('/chat/completions', async (req, res) => {
  try {
    // Validate request payload
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: { 
          message: 'Invalid request payload',
          details: parsed.error.flatten() 
        }
      });
    }
    
    const payload = parsed.data;
    
    // Handle streaming requests
    if (payload.stream) {
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Stream tokens as they're generated
      await cognisAdapter.chat(payload, (token) => {
        const chunk = {
          id: `chunk-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: payload.model,
          choices: [{
            index: 0,
            delta: {
              content: token
            },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      });
      
      // End the stream
      res.write(`data: ${JSON.stringify({ id: 'done', object: 'chat.completion.chunk', choices: [{ finish_reason: 'stop' }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    
    // Handle regular non-streaming requests
    const response = await cognisAdapter.chat(payload);
    res.json(response);
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'An unexpected error occurred',
        type: 'server_error'
      }
    });
  }
});

// Embeddings endpoint
router.post('/embeddings', async (req, res) => {
  try {
    // Validate request payload
    const parsed = EmbeddingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: { 
          message: 'Invalid request payload',
          details: parsed.error.flatten() 
        } 
      });
    }
    
    const { model, input } = parsed.data;
    
    // Generate embeddings
    const embeddings = await cognisAdapter.embeddings(input, model);
    res.json(embeddings);
  } catch (error: any) {
    console.error('Embeddings API error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'An unexpected error occurred',
        type: 'server_error'
      }
    });
  }
});

// API key management endpoints
router.get('/key-info', (req, res) => {
  const hasKey = !!ENV.COGNIS_API_KEY;
  const keyLength = ENV.COGNIS_API_KEY.length;
  
  // Only return minimal info about the API key
  res.json({
    configured: hasKey,
    // Show obfuscated version if key exists
    key: hasKey ? 
      `sk-...${ENV.COGNIS_API_KEY.substring(keyLength - 4)}` : 
      null
  });
});

// Set API key (requires admin authorization in production)
router.post('/set-key', (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Invalid API key provided'
      }
    });
  }
  
  // In a real implementation, we'd securely store this
  // For demo purposes, we'll just set it in environment
  process.env.COGNIS_API_KEY = apiKey;
  
  // Force adapter to refresh API key
  const adapter = new CognisAdapter();
  
  res.json({
    success: true,
    message: 'API key updated successfully'
  });
});

export default router;
