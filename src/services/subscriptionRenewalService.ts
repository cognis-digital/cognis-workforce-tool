import { database } from './database';
import { notificationService } from './notificationService';
import { walletSubscriptionService } from './walletSubscriptionService';
import { subscriptionService } from './subscriptionService';

export interface RenewalSettings {
  autoRenew: boolean;
  paymentMethod: 'stripe' | 'wallet' | string;
  receiveRenewalReminders: boolean;
  reminderDays: number[];  // Days before expiration to send reminders (e.g., [1, 3, 7])
}

export interface RenewalResult {
  success: boolean;
  error?: string;
  newExpirationDate?: Date;
  transactionId?: string;
}

class SubscriptionRenewalService {
  // Get user's renewal settings
  async getUserRenewalSettings(userId: string): Promise<RenewalSettings> {
    try {
      const { data, error } = await database
        .from('subscription_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      // Default settings if none exist
      if (error || !data) {
        return {
          autoRenew: true,
          paymentMethod: 'stripe',
          receiveRenewalReminders: true,
          reminderDays: [1, 3, 7]
        };
      }
      
      return {
        autoRenew: data.auto_renew ?? true,
        paymentMethod: data.payment_method ?? 'stripe',
        receiveRenewalReminders: data.receive_reminders ?? true,
        reminderDays: data.reminder_days ?? [1, 3, 7]
      };
    } catch (error) {
      console.error('Error fetching renewal settings:', error);
      
      // Return defaults if there was an error
      return {
        autoRenew: true,
        paymentMethod: 'stripe',
        receiveRenewalReminders: true,
        reminderDays: [1, 3, 7]
      };
    }
  }
  
  // Update user's renewal settings
  async updateRenewalSettings(
    userId: string, 
    settings: Partial<RenewalSettings>
  ): Promise<boolean> {
    try {
      // Check if settings already exist for this user
      const { data: existingData } = await database
        .from('subscription_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      const mappedSettings = {
        auto_renew: settings.autoRenew,
        payment_method: settings.paymentMethod,
        receive_reminders: settings.receiveRenewalReminders,
        reminder_days: settings.reminderDays
      };
      
      if (existingData) {
        // Update existing settings
        const { error } = await database
          .from('subscription_settings')
          .update(mappedSettings)
          .eq('id', existingData.id);
          
        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await database
          .from('subscription_settings')
          .insert([{ user_id: userId, ...mappedSettings }]);
          
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating renewal settings:', error);
      return false;
    }
  }
  
  // Check for subscriptions that need renewal
  async checkForRenewals(): Promise<void> {
    try {
      const now = new Date();
      
      // Get subscriptions that expire within the next 24 hours
      const { data: expiringSubscriptions, error } = await database
        .from('user_profiles')
        .select('*')
        .gte('tier', 'basic') // Only check paid tiers
        .lt('subscription_ends_at', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .gt('subscription_ends_at', now.toISOString());
        
      if (error) throw error;
      
      if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
        console.log('No subscriptions expiring soon');
        return;
      }
      
      console.log(`Found ${expiringSubscriptions.length} subscriptions expiring soon`);
      
      // Process each expiring subscription
      for (const subscription of expiringSubscriptions) {
        const settings = await this.getUserRenewalSettings(subscription.user_id);
        
        // Send reminder if enabled
        if (settings.receiveRenewalReminders) {
          const expirationDate = new Date(subscription.subscription_ends_at);
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (settings.reminderDays.includes(daysUntilExpiration)) {
            await notificationService.sendEmailNotification(
              subscription.user_id,
              'subscription_expiring_soon',
              {
                daysLeft: daysUntilExpiration,
                expirationDate: expirationDate.toLocaleDateString(),
                tier: subscription.tier
              }
            );
            
            // Also send in-app notification
            notificationService.sendInAppNotification(
              subscription.user_id,
              'subscription_expiring_soon',
              {
                daysLeft: daysUntilExpiration,
                expirationDate: expirationDate.toLocaleDateString(),
                tier: subscription.tier
              }
            );
          }
        }
        
        // Process auto-renewal if enabled and it's the last day
        const expirationDate = new Date(subscription.subscription_ends_at);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (settings.autoRenew && daysUntilExpiration <= 1) {
          await this.processRenewal(subscription.user_id, settings.paymentMethod);
        }
      }
      
      // Also check for expired subscriptions that haven't been downgraded
      const { data: expiredSubscriptions } = await database
        .from('user_profiles')
        .select('*')
        .gte('tier', 'basic') // Only check paid tiers
        .lt('subscription_ends_at', now.toISOString());
        
      if (expiredSubscriptions && expiredSubscriptions.length > 0) {
        console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);
        
        // Downgrade expired subscriptions
        for (const subscription of expiredSubscriptions) {
          await this.handleExpiredSubscription(subscription.user_id);
        }
      }
    } catch (error) {
      console.error('Error checking for renewals:', error);
    }
  }
  
  // Process a subscription renewal
  async processRenewal(userId: string, paymentMethod: string): Promise<RenewalResult> {
    try {
      // Get the current subscription details
      const { data: userProfile, error } = await database
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !userProfile) {
        return { success: false, error: 'User profile not found' };
      }
      
      const tier = userProfile.tier;
      let result: RenewalResult;
      
      // Process renewal based on payment method
      if (paymentMethod === 'wallet') {
        // Use wallet for renewal
        result = await this.renewWithWallet(userId, tier);
      } else {
        // Default to Stripe
        result = await this.renewWithStripe(userId, tier);
      }
      
      // Send notification based on result
      if (result.success) {
        await notificationService.sendEmailNotification(userId, 'payment_successful', {
          amount: this.getPlanPrice(tier),
          tier: tier,
          nextBillingDate: result.newExpirationDate?.toLocaleDateString()
        });
        
        notificationService.sendInAppNotification(userId, 'payment_successful', {
          amount: this.getPlanPrice(tier),
          tier: tier,
          nextBillingDate: result.newExpirationDate?.toLocaleDateString()
        });
      } else {
        await notificationService.sendEmailNotification(userId, 'payment_failed', {
          tier: tier,
          error: result.error
        });
        
        notificationService.sendInAppNotification(userId, 'payment_failed', {
          tier: tier,
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing renewal:', error);
      return { success: false, error: 'Internal error during renewal' };
    }
  }
  
  // Manually trigger a renewal (e.g., when user clicks "Renew Now")
  async manualRenewal(
    userId: string, 
    paymentMethod: string, 
    tier: string
  ): Promise<RenewalResult> {
    try {
      let result: RenewalResult;
      
      // Process renewal based on payment method
      if (paymentMethod === 'wallet') {
        // Use wallet for renewal
        result = await this.renewWithWallet(userId, tier);
      } else {
        // Default to Stripe
        result = await this.renewWithStripe(userId, tier);
      }
      
      // Send notification based on result
      if (result.success) {
        await notificationService.sendEmailNotification(userId, 'payment_successful', {
          amount: this.getPlanPrice(tier),
          tier: tier,
          nextBillingDate: result.newExpirationDate?.toLocaleDateString()
        });
        
        notificationService.sendInAppNotification(userId, 'payment_successful', {
          amount: this.getPlanPrice(tier),
          tier: tier,
          nextBillingDate: result.newExpirationDate?.toLocaleDateString()
        });
      } else {
        await notificationService.sendEmailNotification(userId, 'payment_failed', {
          tier: tier,
          error: result.error
        });
        
        notificationService.sendInAppNotification(userId, 'payment_failed', {
          tier: tier,
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing manual renewal:', error);
      return { success: false, error: 'Internal error during renewal' };
    }
  }
  
  // Handle an expired subscription
  private async handleExpiredSubscription(userId: string): Promise<void> {
    try {
      // Downgrade to free tier
      const { error } = await database
        .from('user_profiles')
        .update({ tier: 'free' })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Send notification about expiration
      await notificationService.sendEmailNotification(userId, 'subscription_expired', {});
      
      notificationService.sendInAppNotification(userId, 'subscription_expired', {});
    } catch (error) {
      console.error('Error handling expired subscription:', error);
    }
  }
  
  // Renewal with wallet payment
  private async renewWithWallet(userId: string, tier: string): Promise<RenewalResult> {
    try {
      // Calculate new expiration date (1 month from now)
      const now = new Date();
      const newExpirationDate = new Date(now);
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
      
      // Get user's wallet address
      const { data: userWallet } = await database
        .from('user_wallets')
        .select('address')
        .eq('user_id', userId)
        .single();
        
      if (!userWallet || !userWallet.address) {
        return { success: false, error: 'No wallet associated with account' };
      }
      
      // Process payment with wallet
      const paymentResult = await walletSubscriptionService.processPayment(
        userWallet.address,
        tier,
        this.getPlanPrice(tier)
      );
      
      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error };
      }
      
      // Update subscription expiration
      const { error } = await database
        .from('user_profiles')
        .update({ 
          subscription_ends_at: newExpirationDate.toISOString(),
          subscription_renewed_at: now.toISOString()
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Record the transaction
      const { error: transactionError } = await database
        .from('transactions')
        .insert([{
          user_id: userId,
          amount: this.getPlanPrice(tier),
          currency: 'USD',
          payment_method: 'wallet',
          payment_method_details: {
            wallet_address: userWallet.address,
            transaction_id: paymentResult.transactionId
          },
          status: 'completed',
          description: `Subscription renewal for ${tier} tier`,
          created_at: now.toISOString()
        }]);
        
      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }
      
      return { 
        success: true, 
        newExpirationDate,
        transactionId: paymentResult.transactionId
      };
    } catch (error) {
      console.error('Error renewing with wallet:', error);
      return { success: false, error: 'Wallet payment failed' };
    }
  }
  
  // Renewal with Stripe
  private async renewWithStripe(userId: string, tier: string): Promise<RenewalResult> {
    try {
      // Calculate new expiration date (1 month from now)
      const now = new Date();
      const newExpirationDate = new Date(now);
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
      
      // Get user's Stripe payment method
      const { data: userPayment } = await database
        .from('stripe_customers')
        .select('customer_id, payment_method_id')
        .eq('user_id', userId)
        .single();
        
      if (!userPayment || !userPayment.payment_method_id) {
        return { success: false, error: 'No payment method on file' };
      }
      
      // Process Stripe payment
      const paymentResult = await subscriptionService.processPayment(
        userPayment.customer_id,
        userPayment.payment_method_id,
        tier,
        this.getPlanPrice(tier)
      );
      
      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error };
      }
      
      // Update subscription expiration
      const { error } = await database
        .from('user_profiles')
        .update({ 
          subscription_ends_at: newExpirationDate.toISOString(),
          subscription_renewed_at: now.toISOString()
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Record the transaction
      const { error: transactionError } = await database
        .from('transactions')
        .insert([{
          user_id: userId,
          amount: this.getPlanPrice(tier),
          currency: 'USD',
          payment_method: 'stripe',
          payment_method_details: {
            payment_intent_id: paymentResult.paymentIntentId,
            customer_id: userPayment.customer_id
          },
          status: 'completed',
          description: `Subscription renewal for ${tier} tier`,
          created_at: now.toISOString()
        }]);
        
      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }
      
      return { 
        success: true, 
        newExpirationDate,
        transactionId: paymentResult.paymentIntentId
      };
    } catch (error) {
      console.error('Error renewing with Stripe:', error);
      return { success: false, error: 'Stripe payment failed' };
    }
  }
  
  // Get the price for a subscription tier
  private getPlanPrice(tier: string): number {
    switch (tier) {
      case 'basic':
        return 20;
      case 'pro':
        return 50;
      case 'enterprise':
        return 100;
      default:
        return 0;
    }
  }
}

export const subscriptionRenewalService = new SubscriptionRenewalService();
