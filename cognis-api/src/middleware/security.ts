import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Basic security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

/**
 * Configure API rate limiting
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // Default: 15 minutes
  max: RATE_LIMIT_MAX, // Default: 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later',
      type: 'rate_limit_error',
    }
  },
  // Store information about rate limiting
  handler: (req, res, next, options) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      headers: req.headers,
    }, 'Rate limit exceeded');
    
    res.status(429).json(options.message);
  }
});

/**
 * Validates origin of requests
 */
export const validateOrigin = (allowedOrigins: string[] = ['*']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    // Skip origin check if no origin is provided or if all origins are allowed
    if (!origin || allowedOrigins.includes('*')) {
      return next();
    }
    
    // Check if the origin is allowed
    if (!allowedOrigins.includes(origin)) {
      logger.warn({ origin, allowedOrigins }, 'Request from unauthorized origin');
      return res.status(403).json({
        error: {
          message: 'Unauthorized origin',
          type: 'forbidden',
        }
      });
    }
    
    next();
  };
};

/**
 * Add request ID to each request for tracking
 */
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  req.app.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Log API request details
 */
export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const requestId = req.app.locals.requestId || 'unknown';
  
  // Log request start
  logger.debug({
    requestId,
    method,
    url: originalUrl,
    ip,
    userAgent: req.headers['user-agent'],
  }, `API Request started: ${method} ${originalUrl}`);
  
  // Log on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    if (statusCode >= 400) {
      logger.warn({
        requestId,
        method,
        url: originalUrl,
        statusCode,
        duration,
      }, `API Request failed: ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else {
      logger.debug({
        requestId,
        method,
        url: originalUrl,
        statusCode,
        duration,
      }, `API Request completed: ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

/**
 * Set response timeout
 */
export const responseTimeout = (timeout = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(timeout, () => {
      logger.error({
        method: req.method,
        url: req.originalUrl,
      }, 'Request timeout');
      
      res.status(408).json({
        error: {
          message: 'Request timeout',
          type: 'timeout_error',
        }
      });
    });
    
    next();
  };
};
