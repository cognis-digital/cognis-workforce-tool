import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './util/env.js';
import chatRoute from './api/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', chatRoute);

// Serve static files from web directory
app.use(express.static(path.join(__dirname, '../web')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

const port = ENV.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 AI Agent Server running on http://localhost:${port}`);
  console.log(`📊 Backend: ${ENV.BACKEND}`);
  console.log(`🧠 Model: ${ENV.MODEL_ID}`);
  console.log(`⚙️  Threads: ${ENV.WASM_THREADS}, Context: ${ENV.CTX_WINDOW}`);
});