import React, { useState } from 'react';
import { Wallet, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function WalletStatus() {
  const { account, isConnected, connecting, connectWallet, disconnectWallet, network } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="flex items-center gap-2 primary-button px-4 py-2 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-xl">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">{formatAddress(account!)}</span>
      </div>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-64 bg-background-primary border border-white/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-heading font-medium">Wallet Connected</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-text-body text-xs mb-1">Address</p>
              <div className="flex items-center gap-2">
                <p className="text-text-heading text-sm font-mono">{formatAddress(account!)}</p>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-text-body" />
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-xs mt-1">Copied!</p>
              )}
            </div>

            {network && (
              <div>
                <p className="text-text-body text-xs mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <p className="text-text-heading text-sm">{network.name}</p>
                  <ExternalLink className="w-3 h-3 text-text-body" />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={disconnectWallet}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}