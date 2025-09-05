import { ethers } from 'ethers';
import { getContractAddress, isChainSupported } from '../config/contracts';

// Contract ABI for CognisLogger
const COGNIS_LOGGER_ABI = [
  "function logAgentInteraction(uint256 agentId, string calldata action, string calldata metadata) external payable",
  "function logKnowledgeUpdate(uint256 kbId, string calldata action, string calldata metadata) external payable",
  "function logLeadGeneration(uint256 leadId, string calldata company, uint256 score) external payable",
  "function logSubscriptionUpdate(string calldata tier) external payable",
  "function batchLogInteractions(uint256[] calldata agentIds, string[] calldata actions, string[] calldata metadataArray) external payable",
  "function getInteraction(uint256 interactionId) external view returns (tuple(address user, uint256 agentId, string action, string metadata, uint256 timestamp, uint256 blockNumber))",
  "function getUserStats(address user) external view returns (uint256 interactions, uint256 knowledgeUpdates)",
  "function totalInteractions() external view returns (uint256)",
  "function logFee() external view returns (uint256)",
  "event AgentInteraction(address indexed user, uint256 indexed agentId, string action, string metadata, uint256 timestamp)",
  "event KnowledgeBaseUpdate(address indexed user, uint256 indexed kbId, string action, string metadata, uint256 timestamp)",
  "event LeadGeneration(address indexed user, uint256 indexed leadId, string company, uint256 score, uint256 timestamp)"
];

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private chainId: number | null = null;

  async initialize(provider: any) {
    try {
      this.provider = new ethers.BrowserProvider(provider);
      this.signer = await this.provider.getSigner();
      
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      if (!isChainSupported(this.chainId)) {
        throw new Error(`Chain ${this.chainId} is not supported`);
      }

      const contractAddress = getContractAddress(this.chainId);
      if (!contractAddress) {
        throw new Error(`No contract deployed on chain ${this.chainId}`);
      }

      this.contract = new ethers.Contract(contractAddress, COGNIS_LOGGER_ABI, this.signer);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  async logAgentInteraction(agentId: string, action: string, metadata: any): Promise<string | null> {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const fee = await this.contract.logFee();
      const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
      
      const tx = await this.contract.logAgentInteraction(
        agentId,
        action,
        metadataString,
        { value: fee }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to log agent interaction:', error);
      return null;
    }
  }

  async logKnowledgeUpdate(kbId: string, action: string, metadata: any): Promise<string | null> {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const fee = await this.contract.logFee();
      const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
      
      const tx = await this.contract.logKnowledgeUpdate(
        kbId,
        action,
        metadataString,
        { value: fee }
      );

      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to log knowledge update:', error);
      return null;
    }
  }

  async logLeadGeneration(leadId: string, company: string, score: number): Promise<string | null> {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const fee = await this.contract.logFee();
      
      const tx = await this.contract.logLeadGeneration(
        leadId,
        company,
        score,
        { value: fee }
      );

      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to log lead generation:', error);
      return null;
    }
  }

  async logSubscriptionUpdate(tier: string): Promise<string | null> {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const fee = await this.contract.logFee();
      
      const tx = await this.contract.logSubscriptionUpdate(tier, { value: fee });
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to log subscription update:', error);
      return null;
    }
  }

  async getUserStats(userAddress: string): Promise<{ interactions: number; knowledgeUpdates: number } | null> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const [interactions, knowledgeUpdates] = await this.contract.getUserStats(userAddress);
      return {
        interactions: Number(interactions),
        knowledgeUpdates: Number(knowledgeUpdates)
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  async getLogFee(): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const fee = await this.contract.logFee();
      return ethers.formatEther(fee);
    } catch (error) {
      console.error('Failed to get log fee:', error);
      return '0.001';
    }
  }

  getCurrentChainId(): number | null {
    return this.chainId;
  }

  isInitialized(): boolean {
    return this.contract !== null && this.signer !== null;
  }
}

export const blockchainService = new BlockchainService();