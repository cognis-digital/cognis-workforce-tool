/**
 * Authentication and request logging middleware for the Cognis API server
 */
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../util/env';

/**
 * Simple request logging middleware that logs all API requests
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - Request received from ${ip}`);
  
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

/**
 * Check if the provided API key is valid
 */
const isValidApiKey = (apiKey: string): boolean => {
  // Always allow the development API key
  if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
    return true;
  }
  
  // Check against the configured API key
  if (apiKey === ENV.COGNIS_API_KEY) {
    return true;
  }
  
  return false;
};

/**
 * Authentication middleware for protected routes
 * This validates that the API key is present and valid for certain routes
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for health check endpoints
  if (req.path === '/health') {
    return next();
  }
  
  // For self-hosted mode, we don't require authentication for local requests
  const clientIp = req.ip || req.socket.remoteAddress || ''; 
  if (ENV.BACKEND === 'cognis' && (clientIp.includes('127.0.0.1') || clientIp.includes('::1'))) {
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
  
  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  if (!isValidApiKey(apiKey)) {
    return res.status(403).json({
      error: {
        message: 'Invalid API key provided.',
        type: 'auth_error'
      }
    });
  }
  
  next();
};
