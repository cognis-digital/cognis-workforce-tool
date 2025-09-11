#!/usr/bin/env node

/**
 * Cognis Workforce Tool - Server Startup Script
 * 
 * This script starts the backend server that provides:
 * 1. The self-hosted API implementation
 * 2. Proxies to Cognis API while keeping API key secure
 * 3. Serves the frontend application
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile = fs.existsSync('.env') 
  ? '.env' 
  : (fs.existsSync('.env.development') 
      ? '.env.development' 
      : '.env.example');

console.log(`Loading environment from ${envFile}`);
dotenv.config({ path: envFile });

const serverDir = path.join(__dirname, 'server');
const tsNodePath = path.join(__dirname, 'node_modules/.bin/ts-node');

// Set up environment variables for the server
const env = { ...process.env };

// Start the server
console.log('Starting Cognis Workforce Tool server...');
const server = spawn(tsNodePath, [path.join(serverDir, 'index.ts')], {
  env,
  stdio: 'inherit'
});

// Handle server process events
server.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle termination signals
function handleSignal(signal) {
  console.log(`\nReceived ${signal}, shutting down server...`);
  server.kill(signal);
}

process.on('SIGINT', () => handleSignal('SIGINT'));
process.on('SIGTERM', () => handleSignal('SIGTERM'));

console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis Workforce Tool - Backend Server        │
│                                                 │
│   API server running at: http://localhost:${process.env.PORT || 8080}  │
│   API health check:      /api/v1/health         │
│                                                 │
└─────────────────────────────────────────────────┘
`);
