#!/usr/bin/env node
/**
 * Production server for Cognis Workforce Tool
 * This script serves the application with proper base path handling
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import compression from 'compression';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 8090;
const BASE_PATH = '/cognis-workforce-tool';
const DIST_PATH = path.join(__dirname, 'dist/web');

// Create Express app
const app = express();

// Enable compression for all responses
app.use(compression());

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// Check if the dist directory exists
if (!fs.existsSync(DIST_PATH)) {
  console.error('❌ Error: dist/web directory not found. Please build the application first.');
  console.error('   Run: npm run build');
  process.exit(1);
}

// Log server version information
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
console.log(`🚀 Cognis Workforce Tool v${packageJson.version}`);
console.log(`📅 Deployment Date: ${new Date().toISOString()}`);

// Serve static files from the dist/web directory under the /cognis-workforce-tool path
app.use(`${BASE_PATH}`, express.static(DIST_PATH, {
  maxAge: '1d' // Cache static assets for 1 day
}));

// Redirect root to /cognis-workforce-tool
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: packageJson.version });
});

// Serve index.html for any routes under BASE_PATH for SPA routing
app.get(`${BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Cognis Workforce Tool running at:
📁 http://localhost:${PORT}${BASE_PATH}

The application is served from the base path: ${BASE_PATH}
Server started: ${new Date().toLocaleString()}
`);
});
