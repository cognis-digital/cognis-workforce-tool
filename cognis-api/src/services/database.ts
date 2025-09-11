import { DB_CONFIG } from '../config/env.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// This is a simplified in-memory database for development
// In production, you would use a real database like PostgreSQL

// API keys storage
interface ApiKey {
  id: string;
  key: string;
  owner: string;
  description?: string;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

// Usage log storage
interface UsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: Date;
}

// In-memory database
const db = {
  apiKeys: new Map<string, ApiKey>(),
  usageLogs: new Array<UsageLog>()
};

/**
 * Database service for API key management and usage tracking
 */
export class DatabaseService {
  /**
   * Initialize database connection
   */
  async initialize() {
    logger.info('Initializing database service');
    
    // For demo purposes, add a default development API key
    const devApiKey: ApiKey = {
      id: 'dev-key-id',
      key: 'sk-cognis-workforce-tool-dev-key-12345',
      owner: 'Development',
      description: 'Default development API key',
      createdAt: new Date(),
      isActive: true
    };
    
    db.apiKeys.set(devApiKey.key, devApiKey);
    logger.info('Database service initialized');
    
    return this;
  }
  
  /**
   * Generate a new API key
   */
  async createApiKey(owner: string, description?: string): Promise<ApiKey> {
    const id = `key_${crypto.randomUUID()}`;
    const key = `sk-cognis-${crypto.randomBytes(24).toString('hex')}`;
    
    const apiKey: ApiKey = {
      id,
      key,
      owner,
      description,
      createdAt: new Date(),
      isActive: true
    };
    
    db.apiKeys.set(key, apiKey);
    logger.info({ id, owner }, 'Created new API key');
    
    return apiKey;
  }
  
  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    const apiKey = db.apiKeys.get(key);
    
    if (!apiKey || !apiKey.isActive) {
      return null;
    }
    
    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    db.apiKeys.set(key, apiKey);
    
    return apiKey;
  }
  
  /**
   * Revoke an API key
   */
  async revokeApiKey(key: string): Promise<boolean> {
    const apiKey = db.apiKeys.get(key);
    
    if (!apiKey) {
      return false;
    }
    
    apiKey.isActive = false;
    db.apiKeys.set(key, apiKey);
    logger.info({ id: apiKey.id }, 'Revoked API key');
    
    return true;
  }
  
  /**
   * List API keys for an owner
   */
  async listApiKeys(owner: string): Promise<ApiKey[]> {
    const keys: ApiKey[] = [];
    
    for (const apiKey of db.apiKeys.values()) {
      if (apiKey.owner === owner) {
        // Don't expose the actual key in listings for security
        const sanitizedKey = {
          ...apiKey,
          key: `${apiKey.key.substring(0, 10)}...${apiKey.key.substring(apiKey.key.length - 4)}`
        };
        keys.push(sanitizedKey);
      }
    }
    
    return keys;
  }
  
  /**
   * Log API usage
   */
  async logUsage(apiKeyId: string, endpoint: string, tokens: { prompt: number, completion: number, total: number }, model: string): Promise<void> {
    const usageLog: UsageLog = {
      id: `usage_${crypto.randomUUID()}`,
      apiKeyId,
      endpoint,
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      totalTokens: tokens.total,
      model,
      timestamp: new Date()
    };
    
    db.usageLogs.push(usageLog);
    
    // In a real implementation, we might batch these logs or use a queue
    logger.debug({ usageLog }, 'Logged API usage');
  }
  
  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(apiKeyId: string, startDate?: Date, endDate?: Date): Promise<{ totalTokens: number, totalCalls: number, usageByEndpoint: Record<string, number>, usageByModel: Record<string, number> }> {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate || now;
    
    const logs = db.usageLogs.filter(log => 
      log.apiKeyId === apiKeyId && 
      log.timestamp >= start && 
      log.timestamp <= end
    );
    
    const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);
    const totalCalls = logs.length;
    
    const usageByEndpoint: Record<string, number> = {};
    const usageByModel: Record<string, number> = {};
    
    for (const log of logs) {
      usageByEndpoint[log.endpoint] = (usageByEndpoint[log.endpoint] || 0) + log.totalTokens;
      usageByModel[log.model] = (usageByModel[log.model] || 0) + log.totalTokens;
    }
    
    return {
      totalTokens,
      totalCalls,
      usageByEndpoint,
      usageByModel
    };
  }
}

// Export singleton instance
export const dbService = new DatabaseService();

// Initialize on import
dbService.initialize().catch(err => {
  logger.error({ err }, 'Failed to initialize database service');
});
