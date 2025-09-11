import { Router } from 'express';
import { z } from 'zod';
import { ENV } from '../util/env';
import { LocalAdapter } from '../llm/local';
import { OpenAIAdapter } from '../llm/openai';

// Request validation schema
const ChatSchema = z.object({
  model: z.string().default(ENV.MODEL_ID),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional()
});

const router = Router();

// Select the appropriate adapter based on environment config
const adapter = ENV.BACKEND === 'openai' ? new OpenAIAdapter() : new LocalAdapter();

// OpenAI-compatible chat completions endpoint
router.post('/v1/chat/completions', async (req, res) => {
  try {
    // Validate request payload
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
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
      await adapter.chat(payload, (token) => {
        const chunk = {
          id: 'chunk',
          object: 'chat.completion.chunk',
          choices: [{
            delta: {
              content: token
            }
          }]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      });
      
      // End the stream
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    
    // Handle regular non-streaming requests
    const response = await adapter.chat(payload);
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

export default router;
