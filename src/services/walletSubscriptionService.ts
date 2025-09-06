import { useWallet } from '../contexts/WalletContext';
import { subscriptionService } from './subscriptionService';
import { SubscriptionTier } from '../models/subscriptionTiers';
import { database } from './database';

interface WalletSubscriptionResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
}

export class WalletSubscriptionService {
  async verifyWalletForSubscription(tier: SubscriptionTier): Promise<WalletSubscriptionResponse> {
    const wallet = useWallet.getState();
    
    if (!wallet.isConnected || !wallet.account) {
      return {
        success: false,
        message: 'Please connect your wallet first'
      };
    }
    
    try {
      // Get subscription price in wei based on tier
      const tierPrices = {
        free: '0',
        basic: '20000000000000000000', // 20 ETH in wei
        pro: '50000000000000000000',   // 50 ETH in wei
        enterprise: '100000000000000000000' // 100 ETH in wei
      };
      
      const price = tierPrices[tier];
      
      // Create a payment record
      const paymentIntent = await database.functions.invoke('create-wallet-payment', {
        body: {
          wallet_address: wallet.account,
          tier,
          price,
          chainId: wallet.chainId
        }
      });
      
      if (paymentIntent.error) {
        throw new Error(paymentIntent.error.message);
      }
      
      // For a real implementation, we would send the transaction on-chain
      // This is a simplified version that just logs the request
      console.log(`Subscription payment request created for ${wallet.account} at tier ${tier}`);
      
      return {
        success: true,
        message: 'Wallet verified for subscription',
        transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      };
    } catch (error: any) {
      console.error('Wallet subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify wallet'
      };
    }
  }
  
  async processWalletPayment(tier: SubscriptionTier): Promise<WalletSubscriptionResponse> {
    const wallet = useWallet.getState();
    
    if (!wallet.isConnected || !wallet.account) {
      return {
        success: false,
        message: 'Please connect your wallet first'
      };
    }
    
    try {
      // Simulated blockchain transaction process
      // In a real implementation, this would use ethers.js or web3.js to create a transaction
      const simulatedTransaction = {
        from: wallet.account,
        to: '0xCognisSubscriptionContract',
        value: tier === 'basic' ? '20000000000000000000' : 
               tier === 'pro' ? '50000000000000000000' : 
               '100000000000000000000',
        chainId: wallet.chainId
      };
      
      // Simulate transaction success
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Update subscription in database
      const result = await database.functions.invoke('update-wallet-subscription', {
        body: {
          wallet_address: wallet.account,
          tier,
          transaction_hash: txHash
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return {
        success: true,
        message: `Successfully processed ${tier} subscription payment`,
        transactionHash: txHash
      };
    } catch (error: any) {
      console.error('Wallet payment error:', error);
      return {
        success: false,
        message: error.message || 'Failed to process payment'
      };
    }
  }
  
  async checkWalletSubscriptionStatus(walletAddress: string): Promise<{
    tier: SubscriptionTier,
    active: boolean,
    expiresAt: Date | null
  }> {
    try {
      // Check subscription status from database
      const { data, error } = await database.from('wallet_subscriptions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return {
          tier: 'free',
          active: false,
          expiresAt: null
        };
      }
      
      return {
        tier: data.tier as SubscriptionTier,
        active: data.active,
        expiresAt: new Date(data.expires_at)
      };
    } catch (error) {
      console.error('Error checking wallet subscription:', error);
      return {
        tier: 'free',
        active: false,
        expiresAt: null
      };
    }
  }
}

export const walletSubscriptionService = new WalletSubscriptionService();
