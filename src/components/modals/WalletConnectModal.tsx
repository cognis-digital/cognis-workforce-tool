import React, { useState, useEffect } from 'react';
import { Wallet, ExternalLink, AlertCircle, CheckCircle, Loader2, Gem, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { useWallet } from '../../contexts/WalletContext';
import { useNotificationActions } from '../../store/appStore';
import { useUserProfile } from '../../store/authStore';
import { walletSubscriptionService } from '../../services/walletSubscriptionService';
import { SubscriptionTier } from '../../models/subscriptionTiers';

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
  const userProfile = useUserProfile();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletSubscription, setWalletSubscription] = useState<{
    tier: SubscriptionTier,
    active: boolean,
    expiresAt: Date | null
  } | null>(null);
  const [showSubscriptionOptions, setShowSubscriptionOptions] = useState(false);
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null);

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

  // Check wallet subscription on connect
  useEffect(() => {
    if (isConnected && account) {
      checkWalletSubscription(account);
    }
  }, [isConnected, account]);
  
  const checkWalletSubscription = async (walletAddress: string) => {
    try {
      const status = await walletSubscriptionService.checkWalletSubscriptionStatus(walletAddress);
      setWalletSubscription(status);
    } catch (error) {
      console.error('Error checking wallet subscription:', error);
    }
  };
  
  const handleSubscribeWithWallet = async (tier: SubscriptionTier) => {
    if (!account) return;
    
    setProcessingTier(tier);
    try {
      const result = await walletSubscriptionService.processWalletPayment(tier);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Subscription Successful',
          message: result.message
        });
        
        // Update the subscription info
        await checkWalletSubscription(account);
        setShowSubscriptionOptions(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Subscription Failed',
        message: error.message || 'Failed to process subscription'
      });
    } finally {
      setProcessingTier(null);
    }
  };
  
  if (isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Wallet Connected" size="sm" className="">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Wallet Connected</h3>
          <p className="text-white/60 mb-4">
            Your wallet is successfully connected to Cognis Digital
          </p>
          
          <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-4">
            <p className="text-white/60 text-sm mb-1">Connected Address</p>
            <p className="text-white font-mono text-sm">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Unknown'}
            </p>
          </div>
          
          {/* Subscription Status */}
          <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white/60 text-sm">Subscription</p>
              {walletSubscription?.active && (
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                  Active
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {walletSubscription?.tier === 'free' ? (
                <p className="text-white">Free Plan</p>
              ) : walletSubscription?.tier === 'basic' ? (
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <p className="text-blue-400 font-medium">Basic Plan</p>
                </div>
              ) : walletSubscription?.tier === 'pro' ? (
                <div className="flex items-center gap-1">
                  <Gem className="w-4 h-4 text-purple-400" />
                  <p className="text-purple-400 font-medium">Pro Plan</p>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Gem className="w-4 h-4 text-amber-400" />
                  <p className="text-amber-400 font-medium">Enterprise Plan</p>
                </div>
              )}
            </div>
            
            {walletSubscription?.expiresAt && (
              <p className="text-white/60 text-xs mt-1">
                Expires: {new Date(walletSubscription.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            {!showSubscriptionOptions ? (
              <button
                onClick={() => setShowSubscriptionOptions(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Manage Subscription
              </button>
            ) : (
              <div className="space-y-3">
                <h4 className="text-white font-medium">Subscribe with Wallet</h4>
                
                <button
                  onClick={() => handleSubscribeWithWallet('basic')}
                  disabled={processingTier === 'basic'}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingTier === 'basic' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Basic Plan - $20/month
                </button>
                
                <button
                  onClick={() => handleSubscribeWithWallet('pro')}
                  disabled={processingTier === 'pro'}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingTier === 'pro' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Gem className="w-4 h-4" />
                  )}
                  Pro Plan - $50/month
                </button>
                
                <button
                  onClick={() => handleSubscribeWithWallet('enterprise')}
                  disabled={processingTier === 'enterprise'}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingTier === 'enterprise' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Gem className="w-4 h-4" />
                  )}
                  Enterprise Plan - $100/month
                </button>
                
                <button
                  onClick={() => setShowSubscriptionOptions(false)}
                  className="w-full bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full bg-white/5 border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet" size="md" className="">
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