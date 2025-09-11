#!/usr/bin/env node

/**
 * Cognis API Backend Server - Entrypoint
 * 
 * This script starts the TypeScript server properly with ESM support
 */

// Import required modules
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Cognis API Backend Server...');

// Determine the environment
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`🔧 Environment: ${NODE_ENV}`);

// Instead of using TypeScript directly, we'll use the Express server implemented in server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// In ESM we can't directly import TypeScript files, so we'll define simplified versions
// of the middleware functions directly in this file

// Logger middleware
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - Request received from ${ip || 'unknown'}`);
  
  // Process request
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log request completion
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`
    );
  });
  
  next();
};

// Auth middleware - simplified version
const authMiddleware = (req, res, next) => {
  // Skip authentication for health check endpoints
  if (req.path === '/health') {
    return next();
  }
  
  // Allow local requests without auth
  const clientIp = req.ip || req.socket.remoteAddress || ''; 
  if ((process.env.BACKEND === 'cognis' || !process.env.BACKEND) && 
      (clientIp.includes('127.0.0.1') || clientIp.includes('::1'))) {
    return next();
  }
  
  // For simplicity, allow all requests in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Get the API key from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Authentication required. Please provide a valid API key.',
        type: 'auth_error'
      }
    });
  }
  
  // Accept any non-empty API key for now
  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  if (!apiKey) {
    return res.status(403).json({
      error: {
        message: 'Invalid API key provided.',
        type: 'auth_error'
      }
    });
  }
  
  next();
};

// Initialize express app
const app = express();

// Apply middleware
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(loggerMiddleware);

// Use authentication middleware for API routes
app.use('/api/v1', authMiddleware);

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
    const apiKey = process.env.COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345';
    const apiUrl = process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
    
    // Forward the request to Cognis API
    const response = await fetch(`${apiUrl}/chat/completions`, {
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

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000; // Use port 3000 to avoid conflicts
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis Workforce Tool - API Server            │
│                                                 │
│   Server running at:    http://localhost:${PORT}  │
│   API endpoint:         /api/v1                 │
│   Health check:         /api/v1/health          │
│   Backend mode:         ${process.env.BACKEND || 'cognis'}${' '.repeat(18 - (process.env.BACKEND || 'cognis').length)}│
│                                                 │
└─────────────────────────────────────────────────┘
`);
});

