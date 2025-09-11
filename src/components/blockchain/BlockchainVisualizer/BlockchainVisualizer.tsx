import React, { useState, useCallback } from 'react';
import { 
  BlockchainVisualizerProps, 
  BlockchainTransaction,
  UserActivity 
} from './types';
import { 
  useTransactions, 
  useNetworkHealth, 
  useUserActivity,
  useHistoricalData
} from './hooks';

// Import Chart.js for visualizations
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Blockchain Visualizer Component
 * 
 * Displays real-time and historical blockchain data visualizations
 */
const BlockchainVisualizer: React.FC<BlockchainVisualizerProps> = ({
  contractAddress,
  showTransactions = true,
  showNetworkHealth = true,
  showUserActivity = true,
  showHistoricalCharts = true,
  refreshInterval = 10000,
  maxTransactions = 10,
  theme = 'light',
  onTransactionClick,
  onUserClick,
  className = ''
}) => {
  // Active tab state
  // Add state for various actions
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'charts' | 'network'>(

    showTransactions ? 'transactions' : showUserActivity ? 'users' : 'charts'
  );

  // Fetch blockchain data
  const { 
    transactions, 
    loading: txLoading,
    error: txError,
    refresh: refreshTransactions 
  } = useTransactions(contractAddress, maxTransactions, refreshInterval);
  
  const { 
    health, 
    loading: healthLoading,
    error: healthError 
  } = useNetworkHealth(refreshInterval);
  
  const { 
    users, 
    loading: usersLoading,
    error: usersError 
  } = useUserActivity(contractAddress, refreshInterval);
  
  const { 
    chartData, 
    loading: chartLoading,
    error: chartError 
  } = useHistoricalData(contractAddress);

  // Add state for transaction filtering and actions
  const [txFilter, setTxFilter] = useState<string>('all');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Get theme-based CSS classes
  const getThemeClasses = () => {
    const baseClasses = 'rounded-lg shadow-lg overflow-hidden';
    
    if (theme === 'dark') {
      return `${baseClasses} bg-gray-800 text-white`;
    } else {
      return `${baseClasses} bg-white`;
    }
  };

  // Format timestamp as date string
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format address to shortened form
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Render transaction list
  const renderTransactions = () => {
    // Use filtered transactions instead of all transactions
    const displayedTransactions = filteredTransactions();
    if (txLoading) {
      return <div className="p-4 text-center">Loading transactions...</div>;
    }

    if (txError) {
      return <div className="p-4 text-center text-red-500">Error: {txError.message}</div>;
    }

    if (!displayedTransactions || displayedTransactions.length === 0) {
      return <div className="p-4 text-center">No transactions found</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedTransactions.map((tx) => (
              <tr 
                key={tx.hash}
                className={`${
                  onTransactionClick ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                onClick={() => onTransactionClick && onTransactionClick(tx)}
              >
                <td className="px-6 py-4 text-sm font-mono">
                  {formatAddress(tx.hash)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${tx.type === 'agent_interaction' ? 'bg-blue-100 text-blue-800' : ''}
                    ${tx.type === 'knowledge_update' ? 'bg-green-100 text-green-800' : ''}
                    ${tx.type === 'lead_generation' ? 'bg-purple-100 text-purple-800' : ''}
                    ${tx.type === 'subscription_update' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {tx.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono">
                  {formatAddress(tx.from)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    ${tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${tx.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatTimestamp(tx.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render network health panel
  const renderNetworkHealth = () => {
    if (healthLoading) {
      return <div className="p-4 text-center">Loading network health data...</div>;
    }

    if (healthError) {
      return <div className="p-4 text-center text-red-500">Error: {healthError.message}</div>;
    }

    if (!health) {
      return <div className="p-4 text-center">No network health data available</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-sm font-medium text-gray-500">Network Status</div>
          <div className="mt-1 flex items-center">
            <span className={`h-3 w-3 rounded-full ${health.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="ml-2 text-2xl font-semibold">
              {health.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-sm font-medium text-gray-500">Latest Block</div>
          <div className="mt-1 text-2xl font-semibold">{health.lastBlock.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Block time: {health.blockTime.toFixed(1)}s</div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-sm font-medium text-gray-500">Gas Price</div>
          <div className="mt-1 text-2xl font-semibold">{health.gasPrice} gwei</div>
          <div className="text-sm text-gray-500">Connected peers: {health.peers}</div>
        </div>
        
        <div className={`p-4 rounded-lg col-span-1 md:col-span-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="text-sm font-medium text-gray-500">Transaction Rate</div>
          <div className="mt-1 text-2xl font-semibold">
            {health.transactionsPerSecond.toFixed(2)} tx/sec
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full" 
              style={{ width: `${Math.min(health.transactionsPerSecond / 10 * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Render user activity
  const renderUserActivity = () => {
    if (usersLoading) {
      return <div className="p-4 text-center">Loading user activity data...</div>;
    }

    if (usersError) {
      return <div className="p-4 text-center text-red-500">Error: {usersError.message}</div>;
    }

    if (!users || users.length === 0) {
      return <div className="p-4 text-center">No user activity found</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                User Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Interactions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Knowledge Updates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Transactions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr 
                key={user.address}
                className={`${
                  onUserClick ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                onClick={() => onUserClick && onUserClick(user)}
              >
                <td className="px-6 py-4 text-sm font-mono">
                  {formatAddress(user.address)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.interactions}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.knowledgeUpdates}
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatTimestamp(user.lastActive)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.transactionCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render historical charts
  const renderHistoricalCharts = () => {
    if (chartLoading) {
      return <div className="p-4 text-center">Loading chart data...</div>;
    }

    if (chartError) {
      return <div className="p-4 text-center text-red-500">Error: {chartError.message}</div>;
    }

    if (!chartData) {
      return <div className="p-4 text-center">No chart data available</div>;
    }

    // Prepare data for charts
    const dates = chartData.transactions.map(point => 
      new Date(point.timestamp).toLocaleDateString()
    );

    const lineChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Transactions',
          data: chartData.transactions.map(point => point.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Interactions',
          data: chartData.interactions.map(point => point.value),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.3,
        }
      ],
    };

    const barChartData = {
      labels: dates,
      datasets: [
        {
          label: 'Knowledge Updates',
          data: chartData.knowledgeUpdates.map(point => point.value),
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1,
        },
        {
          label: 'Unique Users',
          data: chartData.uniqueUsers.map(point => point.value),
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        }
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className="text-lg font-semibold mb-2">Transaction Activity</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className="text-lg font-semibold mb-2">Usage Metrics</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    );
  };

  // Render tabs
  const renderTabs = () => {
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          {showTransactions && (
            <button
              onClick={() => setActiveTab('transactions')}
              className={`${
                activeTab === 'transactions'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Transactions
            </button>
          )}
          
          {showNetworkHealth && (
            <button
              onClick={() => setActiveTab('network')}
              className={`${
                activeTab === 'network'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Network
            </button>
          )}
          
          {showUserActivity && (
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
          )}
          
          {showHistoricalCharts && (
            <button
              onClick={() => setActiveTab('charts')}
              className={`${
                activeTab === 'charts'
                  ? theme === 'dark'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-blue-500 text-blue-600'
                  : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Analytics
            </button>
          )}
        </nav>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'transactions':
        return renderTransactions();
      case 'network':
        return renderNetworkHealth();
      case 'users':
        return renderUserActivity();
      case 'charts':
        return renderHistoricalCharts();
      default:
        return null;
    }
  };

  // Handle exporting data
  const handleExportData = useCallback(() => {
    let dataToExport;
    let filename;
    
    switch (activeTab) {
      case 'transactions':
        dataToExport = transactions;
        filename = 'blockchain-transactions';
        break;
      case 'users':
        dataToExport = users;
        filename = 'blockchain-users';
        break;
      case 'charts':
        dataToExport = chartData;
        filename = 'blockchain-analytics';
        break;
      case 'network':
        dataToExport = health;
        filename = 'network-health';
        break;
      default:
        dataToExport = {};
        filename = 'blockchain-data';
    }
    
    if (exportFormat === 'json') {
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Handle CSV export
      let csvContent = '';
      
      // Simple conversion to CSV
      if (Array.isArray(dataToExport)) {
        // Get headers
        const headers = Object.keys(dataToExport[0] || {}).join(',');
        csvContent = headers + '\n';
        
        // Get values
        csvContent += dataToExport.map(item => 
          Object.values(item).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : value
          ).join(',')
        ).join('\n');
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    setIsExportModalOpen(false);
  }, [activeTab, transactions, users, chartData, health, exportFormat]);
  
  // Filter transactions based on selected criteria
  const filteredTransactions = useCallback(() => {
    if (!transactions) return [];
    
    if (txFilter === 'all') return transactions;
    
    return transactions.filter(tx => {
      if (txFilter === 'confirmed') return tx.status === 'confirmed';
      if (txFilter === 'pending') return tx.status === 'pending';
      if (txFilter === 'failed') return tx.status === 'failed';
      if (txFilter === 'address' && selectedAddress) {
        return tx.from.toLowerCase().includes(selectedAddress.toLowerCase());
      }
      return true;
    });
  }, [transactions, txFilter, selectedAddress]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setTxFilter('all');
    setSelectedAddress('');
    setIsFilterModalOpen(false);
  }, []);

  return (
    <div className={`${getThemeClasses()} ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Cognis Blockchain Dashboard</h2>
          <div className="flex space-x-2">
            {activeTab === 'transactions' && (
              <>
                <button
                  onClick={refreshTransactions}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Refresh
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Filter
                </button>
              </>
            )}
            {activeTab === 'network' && (
              <button
                onClick={() => alert('Network diagnostics started. Check console for results.')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-purple-700 text-gray-200 hover:bg-purple-600'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Run Diagnostics
              </button>
            )}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-green-700 text-gray-200 hover:bg-green-600'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Export Data
            </button>
          </div>
        </div>
        {contractAddress && (
          <div className="mt-1 text-sm text-gray-500 font-mono">
            Contract: {formatAddress(contractAddress)}
          </div>
        )}
      </div>
      
      {renderTabs()}
      
      <div className="bg-white dark:bg-gray-800">
        {renderTabContent()}
      </div>
      
      {/* Export Data Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Export Data</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="mr-2"
                  />
                  JSON
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="mr-2"
                  />
                  CSV
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Filter Transactions</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="address">By Address</option>
              </select>
            </div>
            {txFilter === 'address' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedAddress}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  placeholder="Enter address..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVisualizer;
