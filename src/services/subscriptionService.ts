import { database } from './database';
import { useUserProfile } from '../store/authStore';
import { SubscriptionTier, subscriptionPlans, getFeatureLimitForTier } from '../models/subscriptionTiers';

interface SubscriptionResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  sessionId?: string;
}

export class SubscriptionService {
  private stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  
  constructor() {
    // Initialize Stripe if available
    if (this.stripePublicKey && window.Stripe) {
      this.stripe = window.Stripe(this.stripePublicKey);
    }
  }

  private stripe: any = null;
  
  async createCheckoutSession(tier: SubscriptionTier): Promise<SubscriptionResponse> {
    try {
      const userProfile = useUserProfile.getState();
      
      if (!userProfile) {
        throw new Error('User must be logged in');
      }
      
      // For self-hosted mode, we can also make a direct server request
      const plan = subscriptionPlans.find(p => p.id === tier);
      
      if (!plan) {
        throw new Error('Invalid subscription tier');
      }
      
      const { data, error } = await database.functions.invoke('create-checkout', {
        body: {
          tier,
          userId: userProfile.user_id,
          email: userProfile.email,
          price: plan.price,
          returnUrl: `${window.location.origin}/settings?tab=subscription`
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      if (this.stripe && data?.sessionId) {
        return {
          success: true,
          message: 'Redirecting to checkout...',
          sessionId: data.sessionId,
          redirectUrl: data.url
        };
      }
      
      // Self-hosted mode with offline payment
      return {
        success: true,
        message: 'Subscription request submitted. Please complete payment to activate.',
        redirectUrl: `/payment-instructions?tier=${tier}`
      };
    } catch (error: any) {
      console.error('Subscription error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred'
      };
    }
  }
  
  async redirectToCheckout(sessionId: string): Promise<SubscriptionResponse> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }
      
      const { error } = await this.stripe.redirectToCheckout({
        sessionId
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return {
        success: true,
        message: 'Redirecting to checkout...'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to redirect to checkout'
      };
    }
  }
  
  async cancelSubscription(): Promise<SubscriptionResponse> {
    try {
      const userProfile = useUserProfile.getState();
      
      if (!userProfile) {
        throw new Error('User must be logged in');
      }
      
      const { error } = await database.functions.invoke('cancel-subscription', {
        body: {
          userId: userProfile.user_id
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to cancel subscription');
      }
      
      return {
        success: true,
        message: 'Subscription successfully canceled'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription'
      };
    }
  }
  
  async updateSubscription(newTier: SubscriptionTier): Promise<SubscriptionResponse> {
    try {
      const userProfile = useUserProfile.getState();
      
      if (!userProfile) {
        throw new Error('User must be logged in');
      }
      
      const { data, error } = await database.functions.invoke('update-subscription', {
        body: {
          userId: userProfile.user_id,
          newTier
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update subscription');
      }
      
      if (data?.requiresNewPayment) {
        return this.createCheckoutSession(newTier);
      }
      
      return {
        success: true,
        message: 'Subscription successfully updated'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update subscription'
      };
    }
  }
  
  checkFeatureAccess(featureId: string): boolean {
    const userProfile = useUserProfile.getState();
    if (!userProfile) return false;
    
    const tier = userProfile.tier as SubscriptionTier || 'free';
    const feature = getFeatureLimitForTier(featureId, tier);
    
    return feature.enabled;
  }
  
  getFeatureLimit(featureId: string): number | undefined {
    const userProfile = useUserProfile.getState();
    if (!userProfile) return 0;
    
    const tier = userProfile.tier as SubscriptionTier || 'free';
    const feature = getFeatureLimitForTier(featureId, tier);
    
    return feature.limit;
  }
  
  getFeatureDetails(featureId: string): string | undefined {
    const userProfile = useUserProfile.getState();
    if (!userProfile) return undefined;
    
    const tier = userProfile.tier as SubscriptionTier || 'free';
    const feature = getFeatureLimitForTier(featureId, tier);
    
    return feature.details;
  }
}

export const subscriptionService = new SubscriptionService();
