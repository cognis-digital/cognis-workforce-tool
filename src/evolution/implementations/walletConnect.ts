import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';
import { withAdaptiveEvolution } from '../core/adaptiveUI';
import { generateUUID } from '../utils/uuidUtils';

/**
 * Wallet connection state types
 */
export interface WalletTransaction {
  id: string;
  hash?: string;
  timestamp: number;
  type: 'verification' | 'logging' | 'interaction' | 'storage';
  status: 'pending' | 'confirmed' | 'failed';
  data: {
    action: string;
    resourceId?: string;
    contentHash?: string;
  };
  confirmations?: number;
  network: string;
  error?: string;
}

export interface WalletAccount {
  address: string;
  displayAddress: string; // Truncated for display
  ensName?: string;
  balance?: string;
  network: string;
  connected: boolean;
  lastActive: number;
}

export interface WalletState {
  connected: boolean;
  accounts: WalletAccount[];
  activeAccount?: string;
  provider?: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | string;
  transactions: WalletTransaction[];
  pendingRequests: number;
  connectionHistory: Array<{
    timestamp: number;
    action: 'connect' | 'disconnect' | 'switch_network' | 'switch_account';
    provider?: string;
    account?: string;
    network?: string;
  }>;
  verifiedResources: Record<string, {
    resourceId: string;
    contentHash: string;
    verifiedAt: number;
    transactionHash: string;
  }>;
  features: {
    loggingEnabled: boolean;
    verificationEnabled: boolean;
    networkTracking: boolean;
    storageEnabled: boolean;
  };
}

// Initial wallet state
const initialWalletState: WalletState = {
  connected: false,
  accounts: [],
  transactions: [],
  pendingRequests: 0,
  connectionHistory: [],
  verifiedResources: {},
  features: {
    loggingEnabled: true,
    verificationEnabled: true,
    networkTracking: true,
    storageEnabled: false
  }
};

// Create time-series store for wallet state
export const walletStore = createTimeSeriesStore(initialWalletState, {
  maxHistory: 50,
  autoSnapshot: true
});

// Register with evolution manager
evolutionManager.registerStateEvolution('walletConnect', initialWalletState);

/**
 * Connect to wallet
 * @param provider Wallet provider name
 * @returns Promise resolving with connected account
 */
export const connectWallet = async (
  provider: WalletState['provider'] = 'metamask'
): Promise<WalletAccount | null> => {
  const { current } = walletStore.getState();
  
  // Set pending request
  walletStore.getState().update({
    pendingRequests: current.pendingRequests + 1
  });
  
  try {
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock address based on provider
    const mockAddress = generateMockAddress(provider);
    const displayAddress = `${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`;
    
    // Create new account
    const newAccount: WalletAccount = {
      address: mockAddress,
      displayAddress,
      network: 'ethereum',
      connected: true,
      lastActive: Date.now()
    };
    
    // Update state
    walletStore.getState().update({
      connected: true,
      accounts: [newAccount],
      activeAccount: mockAddress,
      provider,
      pendingRequests: walletStore.getState().current.pendingRequests - 1,
      connectionHistory: [
        {
          timestamp: Date.now(),
          action: 'connect',
          provider,
          account: mockAddress,
          network: 'ethereum'
        },
        ...current.connectionHistory
      ]
    });
    
    // Create snapshot on successful connection
    walletStore.getState().createSnapshot(`wallet-connected-${provider}`);
    
    // Record for state analysis
    stateAnalysisEngine.recordTransition(
      { connected: false },
      { connected: true },
      'connect_wallet'
    );
    
    return newAccount;
  } catch (error) {
    // Update state with error
    walletStore.getState().update({
      pendingRequests: walletStore.getState().current.pendingRequests - 1
    });
    
    console.error('Wallet connection failed:', error);
    return null;
  }
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  const { current } = walletStore.getState();
  
  if (!current.connected) return;
  
  // Update state
  walletStore.getState().update({
    connected: false,
    connectionHistory: [
      {
        timestamp: Date.now(),
        action: 'disconnect',
        provider: current.provider,
        account: current.activeAccount
      },
      ...current.connectionHistory
    ]
  });
  
  // Record for state analysis
  stateAnalysisEngine.recordTransition(
    { connected: true },
    { connected: false },
    'disconnect_wallet'
  );
};

/**
 * Log AI interaction to blockchain
 * @param action Action description
 * @param resourceId Resource identifier
 * @param contentHash Content hash
 * @returns Promise with transaction
 */
export const logToBlockchain = async (
  action: string,
  resourceId?: string,
  contentHash?: string
): Promise<WalletTransaction> => {
  const { current } = walletStore.getState();
  
  // Check if connected and logging enabled
  if (!current.connected) {
    throw new Error('Wallet not connected');
  }
  
  if (!current.features.loggingEnabled) {
    throw new Error('Blockchain logging not enabled');
  }
  
  // Create transaction
  const transactionId = generateUUID();
  const transaction: WalletTransaction = {
    id: transactionId,
    timestamp: Date.now(),
    type: 'logging',
    status: 'pending',
    data: {
      action,
      resourceId,
      contentHash
    },
    network: current.accounts[0]?.network || 'ethereum'
  };
  
  // Update state with pending transaction
  walletStore.getState().update({
    transactions: [transaction, ...current.transactions],
    pendingRequests: current.pendingRequests + 1
  });
  
  try {
    // Simulate blockchain interaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock transaction hash
    const txHash = `0x${Array.from({length: 64}, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    
    // Update transaction as confirmed
    const updatedTransaction: WalletTransaction = {
      ...transaction,
      hash: txHash,
      status: 'confirmed',
      confirmations: 1
    };
    
    // Update state
    walletStore.getState().update({
      transactions: walletStore.getState().current.transactions.map(tx => 
        tx.id === transactionId ? updatedTransaction : tx
      ),
      pendingRequests: walletStore.getState().current.pendingRequests - 1
    });
    
    return updatedTransaction;
  } catch (error) {
    // Update transaction as failed
    const failedTransaction: WalletTransaction = {
      ...transaction,
      status: 'failed',
      error: error.message
    };
    
    // Update state
    walletStore.getState().update({
      transactions: walletStore.getState().current.transactions.map(tx => 
        tx.id === transactionId ? failedTransaction : tx
      ),
      pendingRequests: walletStore.getState().current.pendingRequests - 1
    });
    
    throw error;
  }
};

/**
 * Verify resource authenticity on blockchain
 * @param resourceId Resource to verify
 * @param contentHash Content hash
 * @returns Promise with verification result
 */
export const verifyResourceOnBlockchain = async (
  resourceId: string,
  contentHash: string
): Promise<boolean> => {
  const { current } = walletStore.getState();
  
  // Check if connected and verification enabled
  if (!current.connected) {
    throw new Error('Wallet not connected');
  }
  
  if (!current.features.verificationEnabled) {
    throw new Error('Blockchain verification not enabled');
  }
  
  // Create transaction for verification
  const transaction = await logToBlockchain(
    'verify_resource',
    resourceId,
    contentHash
  );
  
  if (transaction.status !== 'confirmed') {
    return false;
  }
  
  // Store verification record
  walletStore.getState().update({
    verifiedResources: {
      ...walletStore.getState().current.verifiedResources,
      [resourceId]: {
        resourceId,
        contentHash,
        verifiedAt: Date.now(),
        transactionHash: transaction.hash || ''
      }
    }
  });
  
  return true;
};

/**
 * Check if resource is verified
 * @param resourceId Resource identifier
 * @returns Whether resource is verified
 */
export const isResourceVerified = (resourceId: string): boolean => {
  const { verifiedResources } = walletStore.getState().current;
  return !!verifiedResources[resourceId];
};

/**
 * Toggle blockchain feature
 * @param feature Feature to toggle
 * @param enabled Whether feature should be enabled
 */
export const toggleBlockchainFeature = (
  feature: keyof WalletState['features'],
  enabled: boolean
): void => {
  walletStore.getState().update({
    features: {
      ...walletStore.getState().current.features,
      [feature]: enabled
    }
  });
};

/**
 * Helper functions
 */

// Generate mock wallet address
function generateMockAddress(provider: WalletState['provider'] = 'metamask'): string {
  // Create prefix based on provider
  const prefix = provider === 'metamask' ? '0xmeta' :
                provider === 'coinbase' ? '0xcoin' :
                provider === 'walletconnect' ? '0xconn' :
                provider === 'trust' ? '0xtrus' : '0x';
  
  // Generate random hex string
  const randomHex = Array.from({length: 34}, () => 
    '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  
  return `${prefix}${randomHex}`.slice(0, 42).toLowerCase();
}

/**
 * Create adaptive wallet connect component
 * @param WalletConnectComponent Component to enhance
 * @returns Enhanced component with evolution capabilities
 */
export const createAdaptiveWalletConnect = (WalletConnectComponent: React.ComponentType<any>) => {
  return withAdaptiveEvolution(
    WalletConnectComponent,
    'walletConnect',
    evolutionManager,
    true
  );
};
