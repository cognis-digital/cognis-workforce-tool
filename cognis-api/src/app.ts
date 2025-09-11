import express, { Express } from 'express';
import cors from 'cors';
// Import using require for compatibility until TypeScript issues are resolved
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

import { CORS_ORIGIN, IS_DEVELOPMENT } from './config/env.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import logger from './utils/logger.js';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from './config/env.js';

// Import routes
import cognisAPIRoutes from './routes/cognis-api.js';
import blockchainRoutes from './routes/blockchain.js';

// Create simple health route handler directly
const healthRoute = express.Router();
healthRoute.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Initialize express app
const app: Express = express();

// Apply global middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Request logging
app.use(morgan(IS_DEVELOPMENT ? 'dev' : 'combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Rate limiting
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      type: 'rate_limit_error',
    }
  }
}));

// Mount routes
app.use('/health', healthRoute);
// Mount the Cognis API routes under /api/v1
app.use('/api/v1', cognisAPIRoutes);
// Mount blockchain routes under /api/v1/blockchain
app.use('/api/v1/blockchain', blockchainRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
