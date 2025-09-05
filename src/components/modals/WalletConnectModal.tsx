import React, { useState } from 'react';
import { Wallet, ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useWallet } from '../../contexts/WalletContext';
import { useNotificationActions } from '../../store/appStore';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isInstalled: boolean;
  downloadUrl?: string;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connectWallet, isConnected, connecting, account } = useWallet();
  const { addNotification } = useNotificationActions();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using browser extension',
      isInstalled: typeof window !== 'undefined' && !!window.ethereum,
      downloadUrl: 'https://metamask.io/download/'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱',
      description: 'Connect using QR code',
      isInstalled: true // Always available
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet',
      isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
      downloadUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isTrust,
      downloadUrl: 'https://trustwallet.com/'
    }
  ];

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    
    try {
      if (walletId === 'metamask' || walletId === 'coinbase' || walletId === 'trust') {
        await connectWallet();
        
        addNotification({
          type: 'success',
          title: 'Wallet Connected',
          message: `Successfully connected to ${walletOptions.find(w => w.id === walletId)?.name}`
        });
        
        onClose();
      } else if (walletId === 'walletconnect') {
        // Simulate WalletConnect flow
        addNotification({
          type: 'info',
          title: 'WalletConnect',
          message: 'WalletConnect integration coming soon. Use MetaMask for now.'
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error.message || 'Failed to connect wallet'
      });
    } finally {
      setSelectedWallet(null);
    }
  };

  const handleInstallWallet = (wallet: WalletOption) => {
    if (wallet.downloadUrl) {
      window.open(wallet.downloadUrl, '_blank');
    }
  };

  if (isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Wallet Connected" size="sm">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Wallet Connected</h3>
          <p className="text-white/60 mb-4">
            Your wallet is successfully connected to Cognis Digital
          </p>
          
          <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-6">
            <p className="text-white/60 text-sm mb-1">Connected Address</p>
            <p className="text-white font-mono text-sm">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Unknown'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet" size="md">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-white/60">
            Connect a wallet to enable blockchain features and transaction logging
          </p>
        </div>

        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">{wallet.name}</h4>
                    <p className="text-white/60 text-sm">{wallet.description}</p>
                  </div>
                </div>

                {wallet.isInstalled ? (
                  <button
                    onClick={() => handleConnect(wallet.id)}
                    disabled={connecting && selectedWallet === wallet.id}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {connecting && selectedWallet === wallet.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallWallet(wallet)}
                    className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <h4 className="text-blue-400 font-medium">Why Connect a Wallet?</h4>
          </div>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Log AI interactions on blockchain</li>
            <li>• Verify knowledge base authenticity</li>
            <li>• Track usage across networks</li>
            <li>• Enable decentralized features</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </Modal>
  );
}