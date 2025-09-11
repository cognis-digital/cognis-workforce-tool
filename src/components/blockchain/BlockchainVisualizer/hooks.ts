import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  BlockchainTransaction, 
  BlockData, 
  UserActivity, 
  NetworkHealth,
  HistoricalChartData,
  TimeSeriesPoint
} from './types';

// ABI fragment for CognisLogger events
const EVENTS_ABI = [
  "event AgentInteraction(address indexed user, uint256 indexed agentId, string action, string metadata, uint256 timestamp)",
  "event KnowledgeBaseUpdate(address indexed user, uint256 indexed kbId, string action, string metadata, uint256 timestamp)",
  "event LeadGeneration(address indexed user, uint256 indexed leadId, string company, uint256 score, uint256 timestamp)",
  "event SubscriptionUpdate(address indexed user, string tier, uint256 timestamp)"
];

// Mock data generator for development mode
const generateMockData = (): { 
  transactions: BlockchainTransaction[],
  blocks: BlockData[],
  userActivity: UserActivity[],
  networkHealth: NetworkHealth
} => {
  const now = Date.now();
  const mockUsers = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
  ];
  
  // Generate mock transactions
  const transactions: BlockchainTransaction[] = Array(10).fill(0).map((_, i) => ({
    hash: `0x${Math.random().toString(16).substring(2, 42)}`,
    timestamp: now - (i * 60000),
    blockNumber: 1000000 - i,
    from: mockUsers[Math.floor(Math.random() * mockUsers.length)],
    type: ['agent_interaction', 'knowledge_update', 'lead_generation', 'subscription_update'][Math.floor(Math.random() * 4)] as any,
    status: Math.random() > 0.1 ? 'confirmed' : (Math.random() > 0.5 ? 'pending' : 'failed'),
    gasUsed: Math.floor(Math.random() * 200000) + 50000,
    metadata: { 
      data: `Mock transaction ${i}`,
      details: `Additional details for transaction ${i}`
    }
  }));
  
  // Generate mock blocks
  const blocks: BlockData[] = Array(5).fill(0).map((_, i) => ({
    number: 1000000 - i,
    timestamp: now - (i * 120000),
    hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    parentHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    transactionCount: Math.floor(Math.random() * 10) + 1,
    gasUsed: Math.floor(Math.random() * 2000000) + 500000
  }));
  
  // Generate mock user activity
  const userActivity: UserActivity[] = mockUsers.map((address, i) => ({
    address,
    interactions: Math.floor(Math.random() * 50) + 10,
    knowledgeUpdates: Math.floor(Math.random() * 20) + 5,
    lastActive: now - (Math.floor(Math.random() * 86400000)),
    transactionCount: Math.floor(Math.random() * 100) + 20
  }));
  
  // Generate mock network health
  const networkHealth: NetworkHealth = {
    isConnected: true,
    blockTime: 12.5,
    lastBlock: 1000000,
    peers: Math.floor(Math.random() * 20) + 5,
    transactionsPerSecond: Math.random() * 5 + 0.5,
    gasPrice: ethers.utils.formatUnits(Math.floor(Math.random() * 50) + 10, 'gwei')
  };
  
  return { transactions, blocks, userActivity, networkHealth };
};

/**
 * Hook for fetching recent transactions from the blockchain
 */
export function useTransactions(
  contractAddress?: string,
  maxTransactions: number = 10,
  refreshInterval: number = 10000
): {
  transactions: BlockchainTransaction[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // In a real app, this would connect to the blockchain
      // and fetch real transaction data
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        const { transactions: mockTransactions } = generateMockData();
        setTransactions(mockTransactions.slice(0, maxTransactions));
        setError(null);
      } else {
        // In production, we would fetch real blockchain data
        // Implementation would use ethers.js to connect to a provider
        // and fetch transactions from the CognisLogger contract
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        const contract = new ethers.Contract(
          contractAddress || '',
          EVENTS_ABI,
          provider
        );
        
        // Fetch latest block number
        const blockNumber = await provider.getBlockNumber();
        
        // Fetch events from the last 1000 blocks (or fewer if not available)
        const fromBlock = Math.max(0, blockNumber - 1000);
        
        // Get agent interaction events
        const agentEvents = await contract.queryFilter(
          contract.filters.AgentInteraction(),
          fromBlock,
          'latest'
        );
        
        // Get knowledge base update events
        const knowledgeEvents = await contract.queryFilter(
          contract.filters.KnowledgeBaseUpdate(),
          fromBlock,
          'latest'
        );
        
        // Convert events to transactions
        const txs: BlockchainTransaction[] = [
          ...agentEvents.map(event => ({
            hash: event.transactionHash,
            timestamp: event.args?.timestamp.toNumber() * 1000 || Date.now(),
            blockNumber: event.blockNumber,
            from: event.args?.user,
            type: 'agent_interaction' as const,
            status: 'confirmed' as const,
            gasUsed: 0, // Would need to fetch tx receipt to get this
            metadata: {
              agentId: event.args?.agentId.toString(),
              action: event.args?.action,
              metadata: event.args?.metadata
            }
          })),
          ...knowledgeEvents.map(event => ({
            hash: event.transactionHash,
            timestamp: event.args?.timestamp.toNumber() * 1000 || Date.now(),
            blockNumber: event.blockNumber,
            from: event.args?.user,
            type: 'knowledge_update' as const,
            status: 'confirmed' as const,
            gasUsed: 0,
            metadata: {
              kbId: event.args?.kbId.toString(),
              action: event.args?.action,
              metadata: event.args?.metadata
            }
          }))
        ];
        
        // Sort by block number (descending) and limit to max transactions
        txs.sort((a, b) => b.blockNumber - a.blockNumber);
        setTransactions(txs.slice(0, maxTransactions));
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setLoading(false);
    }
  }, [contractAddress, maxTransactions]);
  
  // Fetch data on mount and at interval
  useEffect(() => {
    fetchTransactions();
    
    // Set up refresh interval
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchTransactions, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchTransactions, refreshInterval]);
  
  return { transactions, loading, error, refresh: fetchTransactions };
}

/**
 * Hook for fetching network health data
 */
export function useNetworkHealth(
  refreshInterval: number = 10000
): {
  health: NetworkHealth | null;
  loading: boolean;
  error: Error | null;
} {
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchNetworkHealth = useCallback(async () => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        const { networkHealth } = generateMockData();
        setHealth(networkHealth);
        setError(null);
      } else {
        // Real implementation would connect to the network
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        
        // Get current block
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const previousBlock = await provider.getBlock(blockNumber - 1);
        
        // Calculate block time
        const blockTime = (block.timestamp - previousBlock.timestamp);
        
        // Get network info
        const network = await provider.getNetwork();
        const gasPrice = await provider.getGasPrice();
        
        setHealth({
          isConnected: true,
          blockTime,
          lastBlock: blockNumber,
          // In a real implementation, we would get this from a network stats endpoint
          peers: 1,
          // Estimate TPS from recent blocks
          transactionsPerSecond: block.transactions.length / blockTime,
          gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching network health:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch network health'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch data on mount and at interval
  useEffect(() => {
    fetchNetworkHealth();
    
    // Set up refresh interval
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchNetworkHealth, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchNetworkHealth, refreshInterval]);
  
  return { health, loading, error };
}

/**
 * Hook for fetching user activity data
 */
export function useUserActivity(
  contractAddress?: string,
  refreshInterval: number = 30000
): {
  users: UserActivity[];
  loading: boolean;
  error: Error | null;
} {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchUserActivity = useCallback(async () => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        const { userActivity } = generateMockData();
        setUsers(userActivity);
        setError(null);
      } else {
        // Real implementation would fetch user stats from the contract
        // Implementation details would depend on contract methods
        setUsers([]);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user activity'));
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);
  
  // Fetch data on mount and at interval
  useEffect(() => {
    fetchUserActivity();
    
    // Set up refresh interval
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchUserActivity, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchUserActivity, refreshInterval]);
  
  return { users, loading, error };
}

/**
 * Hook for fetching historical chart data
 */
export function useHistoricalData(
  contractAddress?: string,
  days: number = 7
): {
  chartData: HistoricalChartData | null;
  loading: boolean;
  error: Error | null;
} {
  const [chartData, setChartData] = useState<HistoricalChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        // Generate mock time series data
        const now = Date.now();
        const dayMs = 86400000; // 24 hours in milliseconds
        
        const generateTimeSeries = (maxValue: number, variance: number): TimeSeriesPoint[] => {
          return Array(days).fill(0).map((_, i) => {
            const timestamp = now - ((days - i - 1) * dayMs);
            // Generate some realistic-looking data with day-to-day variance
            let value = maxValue * 0.3; // Base value
            // Add trend (growing over time)
            value += (i / days) * maxValue * 0.3;
            // Add day-specific variance
            value += (Math.random() * variance * 2) - variance;
            // Ensure non-negative
            value = Math.max(0, value);
            return { timestamp, value: Math.round(value) };
          });
        };
        
        setChartData({
          transactions: generateTimeSeries(120, 20),
          interactions: generateTimeSeries(80, 15),
          knowledgeUpdates: generateTimeSeries(40, 10),
          uniqueUsers: generateTimeSeries(25, 5)
        });
        setError(null);
      } else {
        // Real implementation would aggregate events from the contract by day
        setChartData(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch historical data'));
    } finally {
      setLoading(false);
    }
  }, [contractAddress, days]);
  
  // Fetch data on mount
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);
  
  return { chartData, loading, error };
}
