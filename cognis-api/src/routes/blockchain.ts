import express, { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain-service.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';

// Create router
const router = express.Router();

/**
 * GET /blockchain/status
 * Get blockchain connection status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await blockchainService.getStatus();
    res.json({
      status: 'success',
      data: status
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting blockchain status');
    res.status(500).json({
      status: 'error',
      error: {
        message: 'Failed to get blockchain status',
        details: error.message
      }
    });
  }
});

/**
 * POST /blockchain/log-interaction
 * Log an AI agent interaction to the blockchain
 */
router.post('/log-interaction', async (req: Request, res: Response) => {
  try {
    const { agentId, action, metadata } = req.body;
    
    if (!agentId || !action) {
      throw new ApiError(400, 'agentId and action are required fields');
    }
    
    const txHash = await blockchainService.logAgentInteraction(
      Number(agentId),
      action,
      metadata || ''
    );
    
    if (txHash) {
      res.json({
        status: 'success',
        data: {
          transactionHash: txHash,
          message: 'Agent interaction logged to blockchain'
        }
      });
    } else {
      throw new ApiError(500, 'Failed to log interaction to blockchain');
    }
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    logger.error({ error: error.message }, 'Error logging agent interaction');
    
    res.status(statusCode).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to log interaction to blockchain',
        type: 'blockchain_error'
      }
    });
  }
});

/**
 * POST /blockchain/log-knowledge-update
 * Log a knowledge base update to the blockchain
 */
router.post('/log-knowledge-update', async (req: Request, res: Response) => {
  try {
    const { kbId, action, metadata } = req.body;
    
    if (!kbId || !action) {
      throw new ApiError(400, 'kbId and action are required fields');
    }
    
    const txHash = await blockchainService.logKnowledgeUpdate(
      Number(kbId),
      action,
      metadata || ''
    );
    
    if (txHash) {
      res.json({
        status: 'success',
        data: {
          transactionHash: txHash,
          message: 'Knowledge update logged to blockchain'
        }
      });
    } else {
      throw new ApiError(500, 'Failed to log knowledge update to blockchain');
    }
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    logger.error({ error: error.message }, 'Error logging knowledge update');
    
    res.status(statusCode).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to log knowledge update to blockchain',
        type: 'blockchain_error'
      }
    });
  }
});

/**
 * GET /blockchain/user-stats/:address
 * Get user stats from blockchain
 */
router.get('/user-stats/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Basic Ethereum address validation
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ApiError(400, 'Invalid Ethereum address');
    }
    
    const stats = await blockchainService.getUserStats(address);
    
    if (stats) {
      res.json({
        status: 'success',
        data: stats
      });
    } else {
      throw new ApiError(500, 'Failed to get user stats from blockchain');
    }
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    logger.error({ error: error.message }, 'Error getting user stats');
    
    res.status(statusCode).json({
      status: 'error',
      error: {
        message: error.message || 'Failed to get user stats from blockchain',
        type: 'blockchain_error'
      }
    });
  }
});

export default router;
