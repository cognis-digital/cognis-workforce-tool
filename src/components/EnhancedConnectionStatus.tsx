import React, { useEffect } from 'react';
import { Wifi, WifiOff, Server, ServerOff, Globe } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';
import { evolutionManager, withAdaptiveEvolution, createTimeSeriesStore } from '../evolution';

// Define time-series state for connection status
interface ConnectionState {
  status: 'online' | 'offline' | 'degraded' | 'local';
  lastChecked: number;
  responseTime: number;
  reliability: number; // 0-1 score
  connectionHistory: Array<{
    timestamp: number;
    status: 'online' | 'offline' | 'degraded' | 'local';
    duration: number;
  }>;
}

const initialState: ConnectionState = {
  status: 'online',
  lastChecked: Date.now(),
  responseTime: 0,
  reliability: 1,
  connectionHistory: []
};

// Create time-series store for connection status
export const connectionStore = createTimeSeriesStore(initialState, {
  maxHistory: 50,
  autoSnapshot: true
});

// Register this state with the evolution manager
evolutionManager.registerStateEvolution('connectionStatus', initialState);

// Create adaptive version of ConnectionStatus
const EnhancedConnectionStatus = withAdaptiveEvolution(
  ConnectionStatus,
  'connectionStatus',
  evolutionManager
);

export default EnhancedConnectionStatus;
