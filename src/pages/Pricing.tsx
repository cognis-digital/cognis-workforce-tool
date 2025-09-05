import React, { useState } from 'react';
import { Check, X, Shield, Zap, Star, Gem, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionPlans, subscriptionFeatures, aiModels, SubscriptionTier } from '../models/subscriptionTiers';
import { useUserProfile } from '../store/authStore';
import { useDataActions, useNotificationActions } from '../store/appStore';
import { subscriptionService } from '../services/subscriptionService';

export default function Pricing() {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const { addNotification } = useNotificationActions();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  const currentTier = userProfile?.tier as SubscriptionTier || 'free';
  
  // Apply annual discount if applicable
  const getAdjustedPrice = (basePrice: number): number => {
    if (billingCycle === 'annually') {
      return Math.round(basePrice * 0.8); // 20% discount for annual billing
    }
    return basePrice;
  };
  
  // Get icon based on plan tier
  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return Shield;
      case 'basic': return Zap; 
      case 'pro': return Star;
      case 'enterprise': return Gem;
      default: return Shield;
    }
  };
  
  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      navigate('/settings?tab=subscription');
      return;
    }
    
    setIsProcessing({ ...isProcessing, [tier]: true });
    
    try {
      // If upgrading from free to a paid plan
      const response = await subscriptionService.createCheckoutSession(tier);
      
      if (response.success) {
        addNotification({
          type: 'info',
          title: 'Subscription Process Started',
          message: response.message
        });
        
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else if (response.sessionId) {
          await subscriptionService.redirectToCheckout(response.sessionId);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: error.message || 'Failed to process subscription'
      });
    } finally {
      setIsProcessing({ ...isProcessing, [tier]: false });
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Select the perfect plan for your needs and unlock the full potential of our AI-powered workforce platform
        </p>
        
        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium ${
              billingCycle === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annually')}
            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              billingCycle === 'annually'
                ? 'bg-primary-600 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Annually
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {subscriptionPlans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.id);
          const isCurrentPlan = plan.id === currentTier;
          const price = getAdjustedPrice(plan.price);
          
          return (
            <div 
              key={plan.id}
              className={`relative overflow-hidden rounded-3xl border ${
                plan.popular
                  ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                  : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'bg-primary-900/30' : 'bg-white/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.id === 'free' 
                      ? 'bg-gray-500/20' 
                      : plan.id === 'basic'
                        ? 'bg-blue-500/20'
                        : plan.id === 'pro'
                          ? 'bg-purple-500/20'
                          : 'bg-amber-500/20'
                  }`}>
                    <PlanIcon className={`w-6 h-6 ${
                      plan.id === 'free' 
                        ? 'text-gray-400' 
                        : plan.id === 'basic'
                          ? 'text-blue-400'
                          : plan.id === 'pro'
                            ? 'text-purple-400'
                            : 'text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold">{plan.name}</h3>
                    <p className="text-white/70 text-sm">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-8 border-b border-white/10 pb-8">
                  <div className="flex items-baseline">
                    <span className="text-white text-3xl font-bold">${price}</span>
                    <span className="text-white/50 ml-2">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {plan.id !== 'free' && billingCycle === 'annually' && (
                    <p className="text-green-400 text-sm mt-1">Save ${plan.price * 2.4} annually</p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing[plan.id] || (plan.price > 0 && isCurrentPlan)}
                    className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 
                      ${plan.id === 'free' 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : plan.id === 'basic'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90'
                          : plan.id === 'pro'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:opacity-90'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90'
                      } 
                      ${isCurrentPlan ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50' : ''}
                      transition-all
                    `}
                  >
                    {isProcessing[plan.id] ? (
                      <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      <>
                        {plan.id === 'free' ? 'Start Free' : `Subscribe to ${plan.name}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* AI Models Section */}
      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-8 bg-white/5">
          <h2 className="text-2xl font-bold text-white mb-2">AI Models by Tier</h2>
          <p className="text-white/70 mb-8">Each subscription tier gives you access to different AI model capabilities</p>
          
          <div className="grid gap-6">
            {aiModels.map((model) => {
              const isAvailable = currentTier === 'enterprise' || 
                (currentTier === 'pro' && model.tier !== 'enterprise') ||
                (currentTier === 'basic' && (model.tier === 'free' || model.tier === 'basic')) ||
                (currentTier === 'free' && model.tier === 'free');
                
              return (
                <div 
                  key={model.id}
                  className={`p-6 rounded-xl border ${
                    isAvailable 
                      ? 'border-white/10 bg-white/5' 
                      : 'border-white/5 bg-white/2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-bold ${isAvailable ? 'text-white' : 'text-white/40'}`}>
                        {model.name}
                      </h3>
                      <p className={`${isAvailable ? 'text-white/70' : 'text-white/30'}`}>
                        {model.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                        model.tier === 'free' 
                          ? 'bg-gray-500/20 text-gray-400' 
                          : model.tier === 'basic'
                            ? 'bg-blue-500/20 text-blue-400'
                            : model.tier === 'pro'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {model.tier === 'free' ? 'Free' : 
                         model.tier === 'basic' ? 'Basic' : 
                         model.tier === 'pro' ? 'Pro' : 'Enterprise'} Tier
                      </div>
                      <p className={`mt-2 text-sm ${isAvailable ? 'text-white/60' : 'text-white/30'}`}>
                        {model.maxTokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Feature Comparison Table */}
      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-8 bg-white/5">
          <h2 className="text-2xl font-bold text-white mb-2">Feature Comparison</h2>
          <p className="text-white/70 mb-8">Detailed breakdown of features across subscription tiers</p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-6 pr-8 text-white font-medium">Feature</th>
                  <th className="pb-6 px-8 text-white/70 font-medium">Free</th>
                  <th className="pb-6 px-8 text-blue-400 font-medium">Basic<br /><span className="text-white/50 text-sm">${getAdjustedPrice(20)}/mo</span></th>
                  <th className="pb-6 px-8 text-purple-400 font-medium">Pro<br /><span className="text-white/50 text-sm">${getAdjustedPrice(50)}/mo</span></th>
                  <th className="pb-6 px-8 text-amber-400 font-medium">Enterprise<br /><span className="text-white/50 text-sm">${getAdjustedPrice(100)}/mo</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptionFeatures.map((feature) => (
                  <tr key={feature.id} className="hover:bg-white/2">
                    <td className="py-4 pr-8">
                      <div>
                        <h4 className="text-white font-medium">{feature.name}</h4>
                        <p className="text-white/50 text-sm">{feature.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-8 text-center">
                      {feature.tiers.free.enabled ? (
                        <div className="text-sm text-white/70">
                          {feature.tiers.free.details}
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-white/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-8 text-center">
                      {feature.tiers.basic.enabled ? (
                        <div className="text-sm text-white/70">
                          {feature.tiers.basic.details}
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-white/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-8 text-center">
                      {feature.tiers.pro.enabled ? (
                        <div className="text-sm text-white/70">
                          {feature.tiers.pro.details}
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-white/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-8 text-center">
                      {feature.tiers.enterprise.enabled ? (
                        <div className="text-sm text-white/70">
                          {feature.tiers.enterprise.details}
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-white/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="rounded-3xl border border-primary-500/50 overflow-hidden">
        <div className="p-8 bg-primary-900/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to upgrade your AI workforce?</h2>
            <p className="text-white/70 mb-8">
              Choose the plan that fits your needs and start unlocking the full potential of our AI platform.
              All plans come with a 14-day satisfaction guarantee.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate('/settings?tab=subscription')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                Manage Subscription
              </button>
              <button
                onClick={() => handleSubscribe('pro')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Star className="w-5 h-5" />
                Get Pro
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
