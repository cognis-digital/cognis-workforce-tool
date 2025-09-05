import React from 'react';
import { Wifi, WifiOff, Server, ServerOff, Globe } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'online' | 'offline' | 'degraded' | 'local';
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  // Define status configurations
  const statusConfig = {
    online: {
      icon: Server,
      label: 'Self-hosted Server Online',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    offline: {
      icon: ServerOff,
      label: 'Self-hosted Server Offline',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30'
    },
    degraded: {
      icon: Server,
      label: 'Limited Connectivity',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    },
    local: {
      icon: Wifi,
      label: 'Local Mode',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 py-1 px-3 rounded-full ${config.bgColor} ${config.borderColor} border w-fit`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}
