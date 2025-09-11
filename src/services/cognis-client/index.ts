/**
 * Cognis API Client Module
 * 
 * This module provides a comprehensive TypeScript interface to the Cognis API with
 * streaming support, error handling, and integration with the Evolution Architecture.
 */

export * from './types';
export * from './client';
export * from './evolution-integration';

// Create and export default instance
import { CognisApiClient } from './client';

// Read API key from environment if available
const apiKey = typeof process !== 'undefined' && process.env 
  ? process.env.COGNIS_API_KEY 
  : undefined;

// Create singleton instance with default config
export const cognisClient = new CognisApiClient({
  baseUrl: '/api/v1',  // Relative URL that will be resolved by the browser
  apiKey,
  defaultModel: 'Cognis-Zenith-4.0',
  maxRetries: 2,
  timeout: 60000
});

// Export default for convenience
export default cognisClient;
