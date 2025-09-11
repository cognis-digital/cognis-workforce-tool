import { Request, Response, NextFunction } from 'express';
import { ApiError, asyncHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Verifies API key from Authorization header
 */
export const apiKeyAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization required. Please provide a valid API key.');
  }
  
  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Handle development mode API key
  if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
    req.app.locals.user = { id: 'dev', role: 'developer', isDevMode: true };
    return next();
  }
  
  // TODO: In production implementation, validate API key against database
  // For now, we'll use a simple check against environment variables
  try {
    // Basic validation
    if (!apiKey.startsWith('sk-cognis-')) {
      throw new ApiError(403, 'Invalid API key format');
    }
    
    // Store user info in request for downstream handlers
    req.app.locals.user = { id: 'api', role: 'user', apiKey };
    next();
  } catch (error) {
    logger.warn({ error }, 'API key validation failed');
    throw new ApiError(403, 'Invalid API key');
  }
});

/**
 * Verifies JWT token from Authorization header
 */
export const jwtAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization required. Please provide a valid token.');
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    
    // Store user info in request for downstream handlers
    req.app.locals.user = {
      id: decoded.id || decoded.owner,
      role: decoded.role || 'user',
    };
    
    next();
  } catch (error) {
    logger.warn({ error }, 'JWT validation failed');
    throw new ApiError(403, 'Invalid or expired token');
  }
});

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.app.locals.user;
    
    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    if (!roles.includes(user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    
    next();
  };
};

/**
 * Basic request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        throw new ApiError(400, 'Invalid request data', true, JSON.stringify(result.error.format()));
      }
      
      // Replace request body with validated data
      req.body = result.data;
      next();
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(400, `Validation error: ${error.message}`);
    }
  };
};
