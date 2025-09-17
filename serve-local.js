#!/usr/bin/env node
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8090;

// Check if the dist directory exists
const distPath = path.join(__dirname, 'dist/web');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist/web directory not found. Please build the application first.');
  process.exit(1);
}

// Serve static files from the dist/web directory under the /cognis-workforce-tool path
app.use('/cognis-workforce-tool', express.static(path.join(__dirname, 'dist/web')));

// Redirect root to /cognis-workforce-tool
app.get('/', (req, res) => {
  res.redirect('/cognis-workforce-tool');
});

// Serve index.html for any routes under /cognis-workforce-tool
app.get('/cognis-workforce-tool/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/web/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Cognis Workforce Tool running at:
📁 http://localhost:${PORT}/cognis-workforce-tool

The application was built with base path: /cognis-workforce-tool/
Server started: ${new Date().toLocaleString()}
`);
});
