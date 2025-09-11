/**
 * Blockchain configuration for Cognis Workforce Tool
 */

// Get environment variables with TypeScript support
interface ImportMetaEnv {
  VITE_BLOCKCHAIN_ENABLED?: string;
  VITE_BLOCKCHAIN_PROVIDER_URL?: string;
  VITE_SMART_CONTRACT_ADDRESS?: string;
  VITE_CHAIN_ID?: string;
  VITE_BLOCKCHAIN_TIMEOUT?: string;
  PROD?: boolean;
}

// Access environment variables safely
const env = typeof import.meta !== 'undefined' ? 
  (import.meta as any).env as ImportMetaEnv : 
  {};

// Get environment variables
const isProduction = env.PROD || process.env.NODE_ENV === 'production';

// Default blockchain provider URLs
const DEFAULT_PROVIDER_URL = isProduction 
  ? 'https://ethereum.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // Default infura key for production
  : 'http://localhost:8545'; // Local blockchain for development

// Environment variables take precedence
export const BLOCKCHAIN_CONFIG = {
  // Whether blockchain features are enabled
  enabled: (env.VITE_BLOCKCHAIN_ENABLED || process.env.BLOCKCHAIN_ENABLED || 'true') === 'true',
  
  // Provider URL
  providerUrl: env.VITE_BLOCKCHAIN_PROVIDER_URL || 
               process.env.BLOCKCHAIN_PROVIDER_URL || 
               DEFAULT_PROVIDER_URL,
  
  // Smart contract address for Cognis Logger
  contractAddress: env.VITE_SMART_CONTRACT_ADDRESS || 
                   process.env.SMART_CONTRACT_ADDRESS || 
                   '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default contract address
  
  // Chain ID
  chainId: parseInt(env.VITE_CHAIN_ID || process.env.CHAIN_ID || '1'), // Default to Ethereum mainnet
  
  // Blockchain connection timeout in ms
  timeout: parseInt(env.VITE_BLOCKCHAIN_TIMEOUT || process.env.BLOCKCHAIN_TIMEOUT || '10000'),
  
  // Whether to use real blockchain in production
  useRealBlockchain: isProduction,
  
  // Network name
  networkName: isProduction ? 'Ethereum Mainnet' : 'Local Development Network',
};

// Export functions to interact with blockchain
export const getBlockchainConfig = () => BLOCKCHAIN_CONFIG;

export const isBlockchainEnabled = () => BLOCKCHAIN_CONFIG.enabled;

export const getRpcUrl = () => BLOCKCHAIN_CONFIG.providerUrl;
