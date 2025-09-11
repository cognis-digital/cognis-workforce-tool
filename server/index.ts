import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ENV } from './util/env';
import chatRoute from './api/chat';
import cognisRoute from './api/cognis';
import { LocalAdapter } from './llm/local';
import { CognisAdapter } from './llm/cognis';
import { loggerMiddleware, authMiddleware } from './middleware/auth';
import path from 'path';

// Initialize express app
const app = express();

// Apply middleware
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(loggerMiddleware);

// Use authentication middleware for API routes
app.use('/api/v1', authMiddleware);

// Mount API routes
app.use('/api', chatRoute);

// Mount Cognis API routes - these handle our self-hosted API implementation
app.use('/api/v1', cognisRoute);

// Serve built frontend files from the web directory
app.use(express.static(path.join(__dirname, '../web')));

// Pre-warm the model on server start for faster first inference
async function prewarmModel() {
  try {
    console.log('Pre-warming the LLM model...');
    const adapter = new LocalAdapter();
    await adapter.chat({
      model: ENV.MODEL_ID,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    console.log('Model pre-warming complete! Ready for inference.');
  } catch (error) {
    console.error('Model pre-warming failed:', error);
  }
}

// Set up fallback route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

// Start server
app.listen(ENV.PORT, async () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis Workforce Tool - API Server            │
│                                                 │
│   Server running at:    http://localhost:${ENV.PORT}  │
│   API endpoint:         /api/v1                 │
│   Health check:         /api/v1/health          │
│   Backend mode:         ${ENV.BACKEND.padEnd(18)}│
│                                                 │
└─────────────────────────────────────────────────┘
`);
  
  // Pre-warm the model if using local backend
  if (ENV.BACKEND === 'local') {
    prewarmModel();
  } else if (ENV.BACKEND === 'cognis') {
    // Test Cognis API connection
    try {
      const cognisAdapter = new CognisAdapter();
      const healthCheck = await fetch(`${ENV.COGNIS_API_URL}/health`, {
        headers: { 'Authorization': `Bearer ${ENV.COGNIS_API_KEY}` }
      });
      
      if (healthCheck.ok) {
        console.log('✅ Cognis API connection successful!');
      } else {
        console.warn('⚠️ Cognis API health check failed. Check your API key and URL.');
      }
    } catch (error) {
      console.error('❌ Failed to connect to Cognis API:', error);
    }
  }
});
