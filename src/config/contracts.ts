// Auto-generated contract addresses
// This file will be updated after contract deployment

export const CONTRACT_ADDRESSES: Record<number, {
  name: string;
  cognisLogger: string;
}> = {
  // Will be populated after deployment
  11155111: {
    name: 'sepolia',
    cognisLogger: '', // Will be set after deployment
  },
  80001: {
    name: 'mumbai',
    cognisLogger: '', // Will be set after deployment
  },
  97: {
    name: 'bscTestnet',
    cognisLogger: '', // Will be set after deployment
  },
  43113: {
    name: 'fuji',
    cognisLogger: '', // Will be set after deployment
  },
  421614: {
    name: 'arbitrumSepolia',
    cognisLogger: '', // Will be set after deployment
  },
};

export const SUPPORTED_CHAINS = Object.keys(CONTRACT_ADDRESSES).map(Number);

export function getContractAddress(chainId: number): string | undefined {
  return CONTRACT_ADDRESSES[chainId]?.cognisLogger;
}

export function isChainSupported(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}