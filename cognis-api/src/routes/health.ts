import express, { Request, Response } from 'express';
import { NODE_ENV } from '../config/env.js';
import { asyncHandler } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(healthcheck);
}));

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    system: {
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    }
  };

  res.status(200).json(healthcheck);
}));

export default router;
