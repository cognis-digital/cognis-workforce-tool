import { database } from './database';

export interface CheckoutRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class StripeService {
  async createCheckoutSession(request: CheckoutRequest): Promise<{ url: string }> {
    try {
      const { data, error } = await database.functions.invoke('create-checkout', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Stripe checkout error');
      }

      return data;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw error;
    }
  }

  async getSubscription() {
    try {
      const { data, error } = await database
        .from('subscriptions')
        .select(`
          *,
          organizations (*)
        `)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  async getUserProfile() {
    try {
      const { data, error } = await database
        .from('user_profiles')
        .select(`
          *,
          organizations (*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Stripe price IDs - update these with your actual Stripe price IDs
  static readonly PRICE_IDS = {
    PRO_MONTHLY: 'price_pro_monthly', // Will be configured with your Stripe account
    PRO_YEARLY: 'price_pro_yearly',
    ENTERPRISE_MONTHLY: 'price_enterprise_monthly',
    ENTERPRISE_YEARLY: 'price_enterprise_yearly',
  };

  static readonly PLANS = {
    free: {
      name: 'Free',
      price: 0,
      usageLimit: 8,
      features: [
        '8 Total Actions',
        '1 AI Agent',
        'Basic Support',
        'Standard Knowledge Base'
      ]
    },
    pro: {
      name: 'Pro',
      price: 49,
      usageLimit: null, // Unlimited
      features: [
        'Unlimited Actions',
        'Unlimited AI Agents',
        'Priority Support',
        'Advanced Knowledge Base',
        'Custom Integrations'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 99,
      usageLimit: null, // Unlimited
      features: [
        'Everything in Pro',
        'Dedicated Support',
        'White-label Solution',
        'API Access',
        'SLA Guarantee'
      ]
    }
  };
}

export const stripeService = new StripeService();