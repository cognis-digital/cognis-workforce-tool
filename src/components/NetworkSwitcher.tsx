import React, { useState } from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function NetworkSwitcher() {
  const { network, supportedNetworks, switchNetwork, isConnected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 card-bg hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
      >
        <Wifi className="w-4 h-4 text-green-400" />
        <span className="text-text-heading text-sm">{network?.name || 'Unknown'}</span>
        <ChevronDown className="w-3 h-3 text-text-body" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background-primary border border-white/20 rounded-xl shadow-xl z-50">
          <div className="p-2">
            <h3 className="text-text-heading font-medium text-sm px-3 py-2 border-b border-white/10 mb-2">
              Switch Network
            </h3>
            
            <div className="space-y-1">
              {supportedNetworks.map((net) => (
                <button
                  key={net.chainId}
                  onClick={() => {
                    switchNetwork(net.chainId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    network?.chainId === net.chainId
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-text-body hover:text-text-heading hover:bg-white/5'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{net.name}</p>
                    <p className="text-xs opacity-60">{net.symbol}</p>
                  </div>
                  {network?.chainId === net.chainId && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}