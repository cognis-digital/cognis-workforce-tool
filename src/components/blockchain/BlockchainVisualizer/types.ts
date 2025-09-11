/**
 * Types for blockchain data visualization component
 */

/**
 * Transaction type from CognisLogger contract
 */
export type TransactionType = 
  | 'agent_interaction' 
  | 'knowledge_update' 
  | 'lead_generation'
  | 'subscription_update';

/**
 * Transaction status
 */
export type TransactionStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'failed';

/**
 * Transaction data
 */
export interface BlockchainTransaction {
  hash: string;
  timestamp: number;
  blockNumber: number;
  from: string;
  type: TransactionType;
  status: TransactionStatus;
  gasUsed: number;
  metadata?: Record<string, any>;
}

/**
 * Block data
 */
export interface BlockData {
  number: number;
  timestamp: number;
  hash: string;
  parentHash: string;
  transactionCount: number;
  gasUsed: number;
}

/**
 * User activity data
 */
export interface UserActivity {
  address: string;
  interactions: number;
  knowledgeUpdates: number;
  lastActive: number;
  transactionCount: number;
}

/**
 * Network health data
 */
export interface NetworkHealth {
  isConnected: boolean;
  blockTime: number; // Average time between blocks
  lastBlock: number;
  peers: number;
  transactionsPerSecond: number;
  gasPrice: string;
}

/**
 * Time-series data point
 */
export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

/**
 * Historical chart data
 */
export interface HistoricalChartData {
  transactions: TimeSeriesPoint[];
  interactions: TimeSeriesPoint[];
  knowledgeUpdates: TimeSeriesPoint[];
  uniqueUsers: TimeSeriesPoint[];
}

/**
 * Blockchain visualizer props
 */
export interface BlockchainVisualizerProps {
  contractAddress?: string;
  showTransactions?: boolean;
  showNetworkHealth?: boolean;
  showUserActivity?: boolean;
  showHistoricalCharts?: boolean;
  refreshInterval?: number;
  maxTransactions?: number;
  theme?: 'light' | 'dark' | 'auto';
  onTransactionClick?: (tx: BlockchainTransaction) => void;
  onUserClick?: (user: UserActivity) => void;
  className?: string;
}
