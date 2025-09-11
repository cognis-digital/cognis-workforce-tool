#!/usr/bin/env node

/**
 * Cognis API Backend Server - Simplified Express Implementation
 * This script sets up a simple Express server that proxies requests to Cognis API
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config({ path: '.env.development' });

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger middleware
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - Request from ${ip || 'unknown'}`);
  
  // Process request
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

// Initialize express app
const app = express();

// Apply middleware
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(loggerMiddleware);

// Setup health check endpoint
app.get('/api/v1/health', (req, res) => {
  const hasApiKey = !!process.env.COGNIS_API_KEY;
  
  res.json({
    status: 'ok',
    server: 'Cognis API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: hasApiKey,
    backend: process.env.BACKEND || 'cognis'
  });
});

// Setup Cognis API proxy endpoints
app.post('/api/v1/chat/completions', async (req, res) => {
  try {
    // Fallback to a development key if none provided
    const apiKey = process.env.COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
    const apiUrl = process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
    
    // Check if using development key - provide mock response in this case
    if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
      console.log('Using development key - providing mock response');
      
      // Handle streaming responses with mocks
      if (req.body.stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        // Generate a mock streaming response
        const message = req.body.messages[req.body.messages.length - 1].content;
        const mockResponse = `Hello! I received your message: "${message}". This is a mock response from the Cognis API backend server since you're using a development key.`;
        
        // Break the message into chunks
        const chunks = mockResponse.split(' ');
        let i = 0;
        
        // Stream the chunks
        const interval = setInterval(() => {
          if (i < chunks.length) {
            const chunk = {
              id: `chunk-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: req.body.model || 'Cognis-Zenith-4.0',
              choices: [{
                index: 0,
                delta: {
                  content: chunks[i] + ' '
                },
                finish_reason: null
              }]
            };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            i++;
          } else {
            // End the stream
            res.write(`data: ${JSON.stringify({ id: 'done', object: 'chat.completion.chunk', choices: [{ finish_reason: 'stop' }] })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            clearInterval(interval);
          }
        }, 100);
        
        return;
      }
      
      // Regular non-streaming mock response
      const message = req.body.messages[req.body.messages.length - 1].content;
      res.json({
        id: `mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: req.body.model || 'Cognis-Zenith-4.0',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: `Hello! I received your message: "${message}". This is a mock response from the Cognis API backend server since you're using a development key.`
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: message.length,
          completion_tokens: 50,
          total_tokens: message.length + 50
        }
      });
      return;
    }
    
    // Forward the request to actual Cognis API if using a real key
    console.log(`Proxying request to ${apiUrl}/chat/completions`);
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    // For streaming responses
    if (req.body.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      response.body.pipe(res);
      return;
    }
    
    // For regular responses
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'An unexpected error occurred',
        type: 'server_error'
      }
    });
  }
});

// Setup embeddings endpoint
app.post('/api/v1/embeddings', async (req, res) => {
  try {
    const apiKey = process.env.COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
    const apiUrl = process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
    
    console.log(`Proxying request to ${apiUrl}/embeddings`);
    
    // Forward the request to Cognis API
    const response = await fetch(`${apiUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });
    
    // Forward the response
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Embeddings API error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'An unexpected error occurred',
        type: 'server_error'
      }
    });
  }
});

// Attempt to start the server on the specified port,
// or try different ports if the specified one is already in use
const tryStartServer = async (initialPort) => {
  let port = initialPort;
  let maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis Workforce Tool - API Server            │
│                                                 │
│   Server running at:    http://localhost:${port}  │
│   API endpoint:         /api/v1                 │
│   Health check:         /api/v1/health          │
│   Backend mode:         ${process.env.BACKEND || 'cognis'}${' '.repeat(18 - (process.env.BACKEND || 'cognis').length)}│
│                                                 │
└─────────────────────────────────────────────────┘
`);
          resolve(server);
        });
        
        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying port ${port + 1}...`);
            port++;
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      
      // If we get here, the server started successfully
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.error(`Failed to start server after ${maxAttempts} attempts`);
        throw error;
      }
    }
  }
};

// Start the server with automatic port detection
const PORT = parseInt(process.env.PORT || '3000', 10);
tryStartServer(PORT)
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
