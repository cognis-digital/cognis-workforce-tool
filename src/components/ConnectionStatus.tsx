import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, ServerOff, Globe, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cognisService } from '../services/cognis';

interface ConnectionStatusProps {
  status?: 'connected' | 'disconnected' | 'connecting';
  showDetails?: boolean;
}

export default function ConnectionStatus({ status: propsStatus, showDetails = false }: ConnectionStatusProps) {
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'connecting'>(propsStatus || 'connecting');
  const [isSelfHosted, setIsSelfHosted] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  
  // Set up event listeners for API connection status
  useEffect(() => {
    // Initialize from current service state if props status is not provided
    if (!propsStatus) {
      setApiStatus(cognisService.getConnectionStatus());
      setIsSelfHosted(cognisService.isSelfHosted());
      setBaseUrl(cognisService.getBaseUrl());
    }
    
    // Listen for connection status changes
    const handleConnected = () => {
      setApiStatus('connected');
      setBaseUrl(cognisService.getBaseUrl());
    };
    
    const handleDisconnected = () => {
      setApiStatus('disconnected');
    };
    
    const handleConnecting = () => {
      setApiStatus('connecting');
    };
    
    // Register event listeners
    cognisService.addEventListener('connected', handleConnected);
    cognisService.addEventListener('disconnected', handleDisconnected);
    cognisService.addEventListener('connecting', handleConnecting);
    
    // Cleanup
    return () => {
      cognisService.removeEventListener('connected', handleConnected);
      cognisService.removeEventListener('disconnected', handleDisconnected);
      cognisService.removeEventListener('connecting', handleConnecting);
    };
  }, [propsStatus]);
  
  // Define the type for status config
  type StatusConfig = {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    animation?: string;
  };
  
  // Status configuration for display
  const statusConfig: Record<'connected' | 'disconnected' | 'connecting', StatusConfig> = {
    connected: isSelfHosted ? {
      icon: Server,
      label: 'Self-hosted Server Connected',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      animation: ''
    } : {
      icon: Cloud,
      label: 'Cognis API Connected',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      animation: ''
    },
    disconnected: isSelfHosted ? {
      icon: ServerOff,
      label: 'Self-hosted Server Offline',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      animation: ''
    } : {
      icon: CloudOff,
      label: 'API Disconnected',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      animation: ''
    },
    connecting: {
      icon: Loader2,
      label: 'Connecting...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      animation: 'animate-spin'
    }
  };

  // Get status from props or state
  const effectiveStatus = propsStatus || apiStatus;
  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;

  const handleReconnect = () => {
    cognisService.reconnect();
  };

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-2 py-1 px-3 rounded-full 
                   ${config.bgColor} ${config.borderColor} border w-fit
                   cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={handleReconnect}
        title="Click to reconnect"
      >
        <Icon className={`w-4 h-4 ${config.color} ${config.animation || ''}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      {showDetails && effectiveStatus === 'connected' && (
        <div className="mt-2 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <span>Mode:</span>
            <span className="font-medium">{isSelfHosted ? 'Self-hosted' : 'Cloud API'}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 break-all">
            <span>Endpoint:</span>
            <span className="font-medium">{baseUrl}</span>
          </div>
        </div>
      )}
    </div>
  );
}
