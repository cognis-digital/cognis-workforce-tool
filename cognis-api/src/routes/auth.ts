import express, { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../utils/errorHandler.js';
import { JWT_SECRET } from '../config/env.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock storage for API keys (replace with database in production)
const apiKeys = new Map<string, { owner: string, createdAt: Date }>();

/**
 * Generate a secure API key
 */
const generateApiKey = (): string => {
  return `sk-cognis-${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * POST /auth/api-keys
 * Generate a new API key
 */
router.post('/api-keys', asyncHandler(async (req: Request, res: Response) => {
  const { owner } = req.body;

  if (!owner) {
    throw new ApiError(400, 'Owner name is required');
  }

  // Generate a new API key
  const apiKey = generateApiKey();
  
  // Store the API key (in memory for now, should use database in production)
  apiKeys.set(apiKey, {
    owner,
    createdAt: new Date(),
  });
  
  logger.info({ owner }, 'New API key generated');
  
  res.status(201).json({
    status: 'success',
    data: {
      apiKey,
      owner,
      createdAt: new Date().toISOString(),
    },
  });
}));

/**
 * GET /auth/verify
 * Verify an API key
 */
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'API key not provided');
  }
  
  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Check if the API key exists in our storage
  const keyInfo = apiKeys.get(apiKey);
  
  // For development, accept the development key
  if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
    return res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        owner: 'development',
        createdAt: new Date().toISOString(),
      },
    });
  }
  
  if (!keyInfo) {
    throw new ApiError(403, 'Invalid API key');
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      valid: true,
      owner: keyInfo.owner,
      createdAt: keyInfo.createdAt.toISOString(),
    },
  });
}));

/**
 * DELETE /auth/revoke
 * Revoke an existing API key
 */
router.delete('/revoke', asyncHandler(async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    throw new ApiError(400, 'API key is required');
  }
  
  // Check if the API key exists
  if (!apiKeys.has(apiKey)) {
    throw new ApiError(404, 'API key not found');
  }
  
  // Remove the API key
  apiKeys.delete(apiKey);
  
  logger.info('API key revoked');
  
  res.status(200).json({
    status: 'success',
    message: 'API key revoked successfully',
  });
}));

/**
 * POST /auth/token
 * Generate a JWT token for API access (for frontend integration)
 */
router.post('/token', asyncHandler(async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    throw new ApiError(400, 'API key is required');
  }
  
  // Check if the API key exists
  const keyInfo = apiKeys.get(apiKey);
  
  // For development, accept the development key
  if (apiKey === 'sk-cognis-workforce-tool-dev-key-12345') {
    const token = jwt.sign(
      { owner: 'development', type: 'api_key' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.status(200).json({
      status: 'success',
      data: {
        token,
        expiresIn: '24h',
      },
    });
  }
  
  if (!keyInfo) {
    throw new ApiError(403, 'Invalid API key');
  }
  
  // Generate a JWT token
  const token = jwt.sign(
    { owner: keyInfo.owner, type: 'api_key' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      token,
      expiresIn: '24h',
    },
  });
}));

export default router;
