import { Request, Response, NextFunction } from 'express';
import logger from './logger.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle 404 not found errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

/**
 * Global error handler
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Don't expose stack trace in production
  const error = {
    message,
    type: err.name || 'Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log error
  if (statusCode >= 500) {
    logger.error({
      err: {
        message: err.message,
        name: err.name,
        stack: err.stack,
      },
      req: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
      },
    }, 'Server error');
  } else {
    logger.warn({
      err: {
        message: err.message,
        name: err.name,
      },
      req: {
        method: req.method,
        url: req.originalUrl,
      },
    }, 'Client error');
  }

  // Send error response
  res.status(statusCode).json({
    error,
  });
};

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
