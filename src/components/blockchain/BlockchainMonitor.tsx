import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface BlockchainStatus {
  connected: boolean;
  blockNumber: number;
  chainId: number;
  networkName: string;
  contractAddress?: string;
}

interface UserStats {
  interactions: number;
  knowledgeUpdates: number;
}

const BlockchainMonitor: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logData, setLogData] = useState({
    agentId: '1',
    action: 'view',
    metadata: '{}'
  });
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Fetch blockchain status on component mount
  useEffect(() => {
    fetchBlockchainStatus();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchBlockchainStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchBlockchainStatus = async () => {
    try {
      const response = await fetch('/api/v1/blockchain/status');
      const data = await response.json();
      
      if (data.status === 'success') {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to get blockchain status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blockchain status');
    }
  };
  
  const fetchUserStats = async () => {
    if (!userAddress || !ethers.utils.isAddress(userAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/v1/blockchain/user-stats/${userAddress}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setUserStats(data.data);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to get user stats');
        setUserStats(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user stats');
      setUserStats(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'userAddress') {
      setUserAddress(value);
    } else {
      setLogData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const logInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/blockchain/log-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: parseInt(logData.agentId),
          action: logData.action,
          metadata: logData.metadata
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTxHash(data.data.transactionHash);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to log interaction');
        setTxHash(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log interaction');
      setTxHash(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Blockchain Monitor</h2>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-2">Blockchain Status</h3>
        {status ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <span className={`${status.connected ? 'text-green-600' : 'text-red-600'}`}>
                {status.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div>
              <span className="font-semibold">Block Number:</span> {status.blockNumber}
            </div>
            <div>
              <span className="font-semibold">Chain ID:</span> {status.chainId}
            </div>
            <div>
              <span className="font-semibold">Network:</span> {status.networkName}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Contract:</span>{' '}
              {status.contractAddress ? (
                <span className="font-mono text-sm break-all">{status.contractAddress}</span>
              ) : (
                <span className="text-red-600">Not deployed</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading blockchain status...</p>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">User Stats</h3>
        <div className="flex items-end space-x-2 mb-3">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ethereum Address
            </label>
            <input
              type="text"
              name="userAddress"
              value={userAddress}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0x..."
            />
          </div>
          <button
            onClick={fetchUserStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Stats'}
          </button>
        </div>
        
        {userStats ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Interactions:</span> {userStats.interactions}
              </div>
              <div>
                <span className="font-semibold">Knowledge Updates:</span> {userStats.knowledgeUpdates}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Enter an address and click "Get Stats" to view user statistics</p>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Log Interaction</h3>
        <form onSubmit={logInteraction} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent ID
            </label>
            <input
              type="number"
              name="agentId"
              value={logData.agentId}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              name="action"
              value={logData.action}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata (JSON)
            </label>
            <input
              type="text"
              name="metadata"
              value={logData.metadata}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Interaction'}
          </button>
        </form>
        
        {txHash && (
          <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-md">
            <p className="font-medium">Transaction successful!</p>
            <p className="font-mono text-sm break-all">{txHash}</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default BlockchainMonitor;
