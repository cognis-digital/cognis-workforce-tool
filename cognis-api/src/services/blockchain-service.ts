import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

interface ContractAddresses {
  [chainId: number]: {
    name: string;
    cognisLogger: string;
  };
}

/**
 * Service to interact with the local blockchain
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private cognisLoggerContract: ethers.Contract | null = null;
  private contractAddresses: ContractAddresses = {};
  private abi: any;
  private isConnected = false;
  
  constructor() {
    try {
      // Connect to local blockchain
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      
      // Load contract ABI and addresses
      this.loadContractInfo();
      
      logger.info('BlockchainService initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize BlockchainService');
    }
  }
  
  /**
   * Load contract ABI and addresses
   */
  private loadContractInfo() {
    try {
      // Get project root directory
      const rootDir = path.resolve(__dirname, '..', '..', '..');
      
      // Load contract addresses
      const contractAddressesPath = path.join(rootDir, 'src', 'config', 'contracts.ts');
      if (fs.existsSync(contractAddressesPath)) {
        const contractsFile = fs.readFileSync(contractAddressesPath, 'utf8');
        const addressesMatch = contractsFile.match(/export const CONTRACT_ADDRESSES = ({[\s\S]*?});/);
        if (addressesMatch) {
          this.contractAddresses = eval(`(${addressesMatch[1]})`);
        }
      }
      
      // Load contract ABI
      const artifactsPath = path.join(rootDir, 'artifacts', 'contracts', 'CognisLogger.sol', 'CognisLogger.json');
      if (fs.existsSync(artifactsPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
        this.abi = artifact.abi;
      } else {
        logger.warn('CognisLogger artifact not found');
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to load contract information');
    }
  }
  
  /**
   * Connect to the blockchain
   */
  async connect(): Promise<boolean> {
    try {
      // Check if provider is available
      const blockNumber = await this.provider.getBlockNumber();
      logger.info({ blockNumber: Number(blockNumber) }, 'Connected to blockchain node');
      
      // Get network information
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      logger.info({ chainId, networkName: network.name }, 'Network information retrieved');
      
      // Get contract address for this network
      const contractAddress = this.contractAddresses[chainId]?.cognisLogger;
      
      if (!contractAddress || !this.abi) {
        logger.warn('Contract address or ABI not available');
        return false;
      }
      
      // Get signer
      try {
        this.signer = await this.provider.getSigner();
        
        // Create contract instance
        this.cognisLoggerContract = new ethers.Contract(
          contractAddress,
          this.abi,
          this.signer
        );
        
        this.isConnected = true;
        logger.info({ contractAddress }, 'CognisLogger contract connected');
        
        return true;
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to get signer');
        return false;
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to connect to blockchain');
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Log an AI agent interaction to the blockchain
   */
  async logAgentInteraction(
    agentId: number,
    action: string,
    metadata: string
  ): Promise<string | null> {
    if (!this.isConnected || !this.cognisLoggerContract) {
      const connected = await this.connect();
      if (!connected) {
        logger.error('Failed to connect to blockchain');
        return null;
      }
    }
    
    try {
      if (!this.cognisLoggerContract) {
        throw new Error('Contract not initialized');
      }
      
      const tx = await this.cognisLoggerContract.logAgentInteraction(
        agentId,
        action,
        metadata,
        { value: ethers.parseEther('0.001') }
      );
      
      logger.info({ txHash: tx.hash }, 'Agent interaction logged to blockchain');
      
      return tx.hash;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to log agent interaction to blockchain');
      return null;
    }
  }
  
  /**
   * Log a knowledge base update to the blockchain
   */
  async logKnowledgeUpdate(
    kbId: number,
    action: string,
    metadata: string
  ): Promise<string | null> {
    if (!this.isConnected || !this.cognisLoggerContract) {
      const connected = await this.connect();
      if (!connected) {
        logger.error('Failed to connect to blockchain');
        return null;
      }
    }
    
    try {
      if (!this.cognisLoggerContract) {
        throw new Error('Contract not initialized');
      }
      
      const tx = await this.cognisLoggerContract.logKnowledgeUpdate(
        kbId,
        action,
        metadata,
        { value: ethers.parseEther('0.001') }
      );
      
      logger.info({ txHash: tx.hash }, 'Knowledge update logged to blockchain');
      
      return tx.hash;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to log knowledge update to blockchain');
      return null;
    }
  }
  
  /**
   * Get blockchain status
   */
  async getStatus(): Promise<{
    connected: boolean;
    blockNumber: number;
    chainId: number;
    networkName: string;
    contractAddress?: string;
  }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      const contractAddress = this.contractAddresses[chainId]?.cognisLogger;
      
      return {
        connected: this.isConnected,
        blockNumber: Number(blockNumber),
        chainId,
        networkName: network.name,
        contractAddress
      };
    } catch (error) {
      return {
        connected: false,
        blockNumber: 0,
        chainId: 0,
        networkName: 'unknown'
      };
    }
  }
  
  /**
   * Get user interaction stats
   */
  async getUserStats(userAddress: string): Promise<{
    interactions: number;
    knowledgeUpdates: number;
  } | null> {
    if (!this.isConnected || !this.cognisLoggerContract) {
      const connected = await this.connect();
      if (!connected) {
        logger.error('Failed to connect to blockchain');
        return null;
      }
    }
    
    try {
      if (!this.cognisLoggerContract) {
        throw new Error('Contract not initialized');
      }
      
      const stats = await this.cognisLoggerContract.getUserStats(userAddress);
      
      return {
        interactions: Number(stats[0]),
        knowledgeUpdates: Number(stats[1])
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to get user stats from blockchain');
      return null;
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService();
