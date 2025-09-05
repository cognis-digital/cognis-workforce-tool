import { Router } from 'express';
import { z } from 'zod';
import { ENV } from '../util/env.js';
import { LocalAdapter } from '../llm/local.js';

const router = Router();
const adapter = new LocalAdapter();

// Zod schema for chat completions
const ChatRequestSchema = z.object({
  model: z.string().default(ENV.MODEL_ID),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(4000).optional(),
  stream: z.boolean().default(false)
});

router.post('/v1/chat/completions', async (req, res) => {
  try {
    const payload = ChatRequestSchema.parse(req.body);
    
    if (payload.stream) {
      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Stream handler
      const onToken = (token: string) => {
        const chunk = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: payload.model,
          choices: [{
            index: 0,
            delta: { content: token },
            finish_reason: null
          }]
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      };
      
      const response = await adapter.chat(payload, onToken);
      
      // Send final chunk
      const finalChunk = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: payload.model,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop'
        }]
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await adapter.chat(payload);
      res.json(response);
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error'
      }
    });
  }
});

export default router;