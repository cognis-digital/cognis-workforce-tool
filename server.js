// Simple Express server for Cognis API backend
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Initialize environment
dotenv.config({ path: '.env.development' });

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Configuration
const PORT = process.env.PORT || 8080;
const COGNIS_API_KEY = process.env.COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
const COGNIS_API_URL = process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
const COGNIS_DEFAULT_MODEL = process.env.COGNIS_DEFAULT_MODEL || 'Cognis-Zenith-4.0';

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  const hasApiKey = !!COGNIS_API_KEY;
  
  res.json({
    status: 'ok',
    server: 'Cognis API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configured: hasApiKey
  });
});

// Chat completions endpoint
app.post('/api/v1/chat/completions', async (req, res) => {
  try {
    const { model = COGNIS_DEFAULT_MODEL, messages, temperature = 0.7, max_tokens = 1000, stream = false } = req.body;
    
    // Prepare API request
    const payload = {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    };

    // Forward request to Cognis API
    const response = await fetch(`${COGNIS_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COGNIS_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (stream) {
      // Set SSE headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Forward stream from Cognis API to client
      response.body.pipe(res);
      return;
    }

    // Handle regular JSON response
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

// Embeddings endpoint
app.post('/api/v1/embeddings', async (req, res) => {
  try {
    const { model = 'Cognis-Nova-3.0', input } = req.body;
    
    // Forward request to Cognis API
    const response = await fetch(`${COGNIS_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COGNIS_API_KEY}`
      },
      body: JSON.stringify({ model, input })
    });

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

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// Start server
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis Workforce Tool - Backend Server        │
│                                                 │
│   API server running at: http://localhost:${PORT}  │
│   API health check:      /api/v1/health         │
│                                                 │
└─────────────────────────────────────────────────┘
`);
});
