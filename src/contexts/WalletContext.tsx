import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Network {
  chainId: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
}

interface WalletContextType {
  account: string | null;
  chainId: string | null;
  network: Network | null;
  isConnected: boolean;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  supportedNetworks: Network[];
}

const SUPPORTED_NETWORKS: Network[] = [
  {
    chainId: '0xaa36a7',
    name: 'Sepolia Testnet',
    symbol: 'SEP',
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  {
    chainId: '0x13881',
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mumbai.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://mumbai.polygonscan.com'
  },
  {
    chainId: '0x61',
    name: 'BSC Testnet',
    symbol: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com'
  },
  {
    chainId: '0xa869',
    name: 'Avalanche Fuji',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io'
  },
  {
    chainId: '0x66eed',
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io'
  }
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      checkConnection();

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (chainId) {
      const foundNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === chainId);
      setNetwork(foundNetwork || null);
    }
  }, [chainId]);

  const checkConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChainId);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
      
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(currentChainId);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setNetwork(null);
  };

  const switchNetwork = async (targetChainId: string) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }]
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        const targetNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === targetChainId);
        if (targetNetwork) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetNetwork.chainId,
                chainName: targetNetwork.name,
                nativeCurrency: {
                  name: targetNetwork.symbol,
                  symbol: targetNetwork.symbol,
                  decimals: 18
                },
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorer]
              }]
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
          }
        }
      }
    }
  };

  const value = {
    account,
    chainId,
    network,
    isConnected: !!account,
    connecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    supportedNetworks: SUPPORTED_NETWORKS
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}