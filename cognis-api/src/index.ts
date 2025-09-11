import app from './app.js';
import { PORT, NODE_ENV } from './config/env.js';
import logger from './utils/logger.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  }, 'Uncaught Exception. Shutting down...');
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({
    reason,
    promise,
  }, 'Unhandled Promise Rejection. Shutting down...');
  
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   Cognis API Backend Server                     │
│                                                 │
│   Environment:  ${NODE_ENV.padEnd(30)}│
│   Port:         ${PORT.toString().padEnd(30)}│
│   Status:       Running                         │
│                                                 │
└─────────────────────────────────────────────────┘
  `);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
  
  // Force shutdown if it takes too long
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout...');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server;
