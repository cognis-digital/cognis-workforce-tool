import React, { useState } from 'react';
import { Crown, Check, Zap, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { useUserProfile, useUser } from '../../store/authStore';
import { useNotificationActions } from '../../store/appStore';
import { stripeService, StripeService } from '../../services/stripe';
import { usageService } from '../../services/usageService';
import { useDynamicText } from '../../hooks/useDynamicText';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const userProfile = useUserProfile();
  const user = useUser();
  const { addNotification } = useNotificationActions();
  const [loading, setLoading] = useState(false);
  const { getUpgradeMessage, getUsageMessage } = useDynamicText();

  const usageCount = user ? usageService.getUserUsageCount(user.id) : 0;
  const isAtLimit = user ? usageService.isAtLimit(user.id) : false;
  const remaining = user ? usageService.getRemainingUsage(user.id) : 0;

  const plans = [
    {
      name: 'Pro',
      price: 49,
      period: 'month',
      features: [
        'Unlimited AI Agents',
        'Unlimited Task Assignments',
        'Unlimited Downloads',
        'Priority Processing',
        'Advanced Analytics',
        'Custom Agent Templates',
        'Priority Support'
      ],
      popular: true,
      priceId: StripeService.PRICE_IDS.PRO_MONTHLY
    },
    {
      name: 'Enterprise',
      price: 99,
      period: 'month',
      features: [
        'Everything in Pro',
        'White-label Solution',
        'Custom Integrations',
        'Dedicated Account Manager',
        'SLA Guarantee',
        'Advanced Security',
        'Custom AI Models',
        'API Access'
      ],
      popular: false,
      priceId: StripeService.PRICE_IDS.ENTERPRISE_MONTHLY
    }
  ];

  const handleUpgrade = async (plan: typeof plans[0]) => {
    setLoading(true);
    
    try {
      const { url } = await stripeService.createCheckoutSession({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/dashboard?upgrade_canceled=true`
      });
      
      window.location.href = url;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upgrade Failed',
        message: 'Failed to start upgrade process. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      size="lg"
      closeOnOverlayClick={!loading}
    >
      <div className="p-6">
        {reason && (
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-orange-400" />
              <h3 className="text-orange-400 font-medium">Upgrade Required</h3>
            </div>
            <p className="text-white/70 text-sm">{reason}</p>
            {isAtLimit && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">Usage: {usageCount}/8 credits used</p>
                <p className="text-white/60 text-xs mt-1">{getUsageMessage(remaining) || 'You\'ve used all your free credits'}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Unlock the Full Power of Cognis Digital</h2>
          <p className="text-white/60">
            {getUpgradeMessage(userProfile?.tier || 'free') || 'Choose a plan that fits your AI workforce needs and scale your business operations.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-2xl p-6 relative ${
                plan.popular
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/60">/{plan.period}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Upgrade to {plan.name}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </Modal>
  );
}