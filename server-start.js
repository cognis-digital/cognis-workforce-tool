#!/usr/bin/env node

/**
 * Custom server starter script that works around TypeScript compatibility issues
 * This allows us to run the server with proper TypeScript support regardless of
 * Node.js version or module system configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const serverDir = path.join(__dirname, 'server');
const entryPoint = path.join(serverDir, 'index.ts');
const port = process.env.PORT || 3030;

// Check if TypeScript files exist
if (!fs.existsSync(entryPoint)) {
  console.error(`\x1b[31mError: Server entry point not found at ${entryPoint}\x1b[0m`);
  process.exit(1);
}

console.log('\x1b[34m🚀 Starting Cognis API Backend Server...\x1b[0m');
console.log(`\x1b[32m✅ Using port ${port}\x1b[0m`);

// Start the server with ts-node
const tsNode = spawn('npx', [
  'ts-node',
  '--transpile-only',
  '--prefer-ts-exts',
  '--project', path.join(serverDir, 'tsconfig.json'),
  entryPoint
], {
  env: { 
    ...process.env,
    PORT: port,
    NODE_ENV: 'development'
  },
  stdio: 'inherit'
});

// Handle server process events
tsNode.on('error', (err) => {
  console.error(`\x1b[31m❌ Failed to start server: ${err.message}\x1b[0m`);
  process.exit(1);
});

tsNode.on('close', (code) => {
  if (code !== 0) {
    console.error(`\x1b[31m❌ Server exited with code ${code}\x1b[0m`);
    process.exit(code);
  }
});

// Handle signals to properly shut down the server
process.on('SIGINT', () => {
  console.log('\n\x1b[33m⚠️ Shutting down server...\x1b[0m');
  tsNode.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n\x1b[33m⚠️ Shutting down server...\x1b[0m');
  tsNode.kill('SIGTERM');
});
