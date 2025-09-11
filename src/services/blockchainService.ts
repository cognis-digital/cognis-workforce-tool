import { ethers } from 'ethers';
import { getBlockchainConfig } from '../config/blockchain-config';

// ABI for Cognis Logger contract
const COGNIS_LOGGER_ABI = [
  // Events
  "event AgentInteraction(address indexed user, uint256 indexed agentId, string action, string metadata, uint256 timestamp)",
  "event KnowledgeBaseUpdate(address indexed user, uint256 indexed kbId, string action, string metadata, uint256 timestamp)",
  "event LeadGeneration(address indexed user, uint256 indexed leadId, string company, uint256 score, uint256 timestamp)",
  "event SubscriptionUpdate(address indexed user, string tier, uint256 timestamp)",
  
  // Functions
  "function logAgentInteraction(uint256 agentId, string calldata action, string calldata metadata) external",
  "function logKnowledgeBaseUpdate(uint256 kbId, string calldata action, string calldata metadata) external",
  "function logLeadGeneration(uint256 leadId, string calldata company, uint256 score) external",
  "function logSubscriptionUpdate(string calldata tier) external",
  "function getStats() external view returns (uint256 totalInteractions, uint256 totalKBUpdates, uint256 totalLeads)"
];

// BlockchainService class for interacting with Ethereum blockchain
export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  private isConnected: boolean = false;
  
  constructor() {
    this.initializeProvider();
  }
  
  // Initialize the provider based on configuration
  private async initializeProvider() {
    try {
      const config = getBlockchainConfig();
      
      if (!config.enabled) {
        console.log('Blockchain integration is disabled');
        return;
      }
      
      // Initialize provider based on environment
      if (config.useRealBlockchain) {
        // Production: Use real blockchain provider
        this.provider = new ethers.JsonRpcProvider(config.providerUrl);
      } else {
        // Development: Use local blockchain
        this.provider = new ethers.JsonRpcProvider(config.providerUrl);
      }
      
      // Create a random wallet for interactions (should be replaced with real wallet in production)
      // In real production, you'd use a secure key management solution
      const privateKey = localStorage.getItem('blockchain_private_key') || ethers.Wallet.createRandom().privateKey;
      if (!localStorage.getItem('blockchain_private_key')) {
        localStorage.setItem('blockchain_private_key', privateKey);
      }
      
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Initialize the contract
      this.contract = new ethers.Contract(config.contractAddress, COGNIS_LOGGER_ABI, this.wallet);
      
      // Check connection
      await this.provider.getBlockNumber();
      this.isConnected = true;
      console.log(`Connected to blockchain: ${config.networkName}`);
    } catch (error) {
      console.error('Failed to initialize blockchain provider:', error);
      this.isConnected = false;
    }
  }
  
  // Check if blockchain is connected
  public async isBlockchainConnected(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }
    
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.error('Blockchain connection check failed:', error);
      return false;
    }
  }
  
  // Log agent interaction to blockchain
  public async logAgentInteraction(agentId: number, action: string, metadata: string): Promise<boolean> {
    if (!this.isConnected || !this.contract) {
      return false;
    }
    
    try {
      const tx = await this.contract.logAgentInteraction(agentId, action, metadata);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log agent interaction:', error);
      return false;
    }
  }
  
  // Log knowledge base update to blockchain
  public async logKnowledgeBaseUpdate(kbId: number, action: string, metadata: string): Promise<boolean> {
    if (!this.isConnected || !this.contract) {
      return false;
    }
    
    try {
      const tx = await this.contract.logKnowledgeBaseUpdate(kbId, action, metadata);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log knowledge base update:', error);
      return false;
    }
  }
  
  // Log lead generation to blockchain
  public async logLeadGeneration(leadId: number, company: string, score: number): Promise<boolean> {
    if (!this.isConnected || !this.contract) {
      return false;
    }
    
    try {
      const tx = await this.contract.logLeadGeneration(leadId, company, score);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log lead generation:', error);
      return false;
    }
  }
  
  // Log subscription update to blockchain
  public async logSubscriptionUpdate(tier: string): Promise<boolean> {
    if (!this.isConnected || !this.contract) {
      return false;
    }
    
    try {
      const tx = await this.contract.logSubscriptionUpdate(tier);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log subscription update:', error);
      return false;
    }
  }
  
  // Get blockchain statistics
  public async getStats(): Promise<{totalInteractions: number, totalKBUpdates: number, totalLeads: number} | null> {
    if (!this.isConnected || !this.contract) {
      return null;
    }
    
    try {
      const stats = await this.contract.getStats();
      return {
        totalInteractions: Number(stats[0]),
        totalKBUpdates: Number(stats[1]),
        totalLeads: Number(stats[2])
      };
    } catch (error) {
      console.error('Failed to get blockchain stats:', error);
      return null;
    }
  }
  
  // Get latest block information
  public async getLatestBlock(): Promise<any | null> {
    if (!this.isConnected || !this.provider) {
      return null;
    }
    
    try {
      return await this.provider.getBlock('latest');
    } catch (error) {
      console.error('Failed to get latest block:', error);
      return null;
    }
  }
  
  // Get network information
  public async getNetworkInfo(): Promise<{chainId: number, blockNumber: number, gasPrice: string} | null> {
    if (!this.isConnected || !this.provider) {
      return null;
    }
    
    try {
      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.provider.getFeeData()
      ]);
      
      return {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService();
