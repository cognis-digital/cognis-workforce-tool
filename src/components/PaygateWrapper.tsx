import React from 'react';
import { Crown, Zap, Lock, Star, Gem } from 'lucide-react';
import { useUser, useUserProfile } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { usageService } from '../services/usageService';
import { useDynamicText } from '../hooks/useDynamicText';
import { SubscriptionTier, getFeatureLimitForTier } from '../models/subscriptionTiers';
import { subscriptionService } from '../services/subscriptionService';

interface PaygateWrapperProps {
  action: 'agent_interaction' | 'task_assignment' | 'lead_generation' | 'knowledge_upload' | 'image_generation' | 'deep_research' | 'study_learn' | 'custom_agents' | 'multi_user';
  children: React.ReactNode | ((props: any) => React.ReactNode);
  cost?: number;
  fallback?: React.ReactNode;
  requiredTier?: SubscriptionTier;
}

export default function PaygateWrapper({ 
  action, 
  children, 
  cost = 1, 
  fallback,
  requiredTier
}: PaygateWrapperProps) {
  const user = useUser();
  const userProfile = useUserProfile();
  const setActiveModal = useAppStore(state => state.setActiveModal);
  const { getUpgradeMessage, getUsageMessage } = useDynamicText();

  if (!user || !userProfile) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
        <Lock className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
        <p className="text-white/60">Please sign in to access this feature.</p>
      </div>
    );
  }
  
  // Check subscription tier access if requiredTier is specified
  const currentTier = userProfile.tier as SubscriptionTier || 'free';
  if (requiredTier && requiredTier !== 'free') {
    const tierRanking = { free: 0, basic: 1, pro: 2, enterprise: 3 };
    if (tierRanking[currentTier] < tierRanking[requiredTier]) {
      // User needs to upgrade to access this feature
      return renderUpgradeTier(requiredTier);
    }
  }

  // Check feature access based on subscription tier
  const featureAccess = subscriptionService.checkFeatureAccess(action);
  if (!featureAccess) {
    // Determine the minimum required tier for this feature
    const requiredTierForFeature = getMinimumTierForFeature(action);
    return renderUpgradeTier(requiredTierForFeature);
  }
  
  // For unlimited tier access
  if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
    return <>{typeof children === 'function' ? children({}) : children}</>;
  }

  // Check if user has exceeded free usage limit
  const currentUsage = usageService.getUserUsageCount(user.id);
  const wouldExceedLimit = currentUsage + cost > 8;
  const remaining = usageService.getRemainingUsage(user.id);

  if (wouldExceedLimit || currentUsage >= 8) {
    return fallback || renderUpgradeUsage();
  }
  
  return <>{typeof children === 'function' ? children({}) : children}</>;
  
  // Helper function to determine the minimum tier required for a feature
  function getMinimumTierForFeature(featureId: string): SubscriptionTier {
    // This is a simplification - in a real app you might want to have this mapping in your subscription model
    const featureTierMap: Record<string, SubscriptionTier> = {
      'agent_interaction': 'free',
      'knowledge_upload': 'free',
      'lead_generation': 'free',
      'image_generation': 'free',
      'deep_research': 'basic',
      'study_learn': 'pro',
      'custom_agents': 'free',
      'multi_user': 'basic'
    };
    
    return featureTierMap[featureId] || 'free';
  }
  
  // Helper function to render upgrade UI based on tier
  function renderUpgradeTier(tier: SubscriptionTier) {
    const tierConfig = {
      basic: {
        title: 'Basic Plan Required',
        description: 'Upgrade to Basic or higher to access this feature',
        price: '$20/month',
        color: 'from-blue-500 to-blue-600',
        icon: Zap,
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        border: 'border-blue-500/30'
      },
      pro: {
        title: 'Pro Plan Required',
        description: 'Upgrade to Pro or higher to access this feature',
        price: '$50/month',
        color: 'from-purple-500 to-purple-600',
        icon: Star,
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        border: 'border-purple-500/30'
      },
      enterprise: {
        title: 'Enterprise Plan Required',
        description: 'Upgrade to Enterprise to access this feature',
        price: '$100/month',
        color: 'from-amber-500 to-amber-600',
        icon: Gem,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        border: 'border-amber-500/30'
      }
    };
    
    const config = tierConfig[tier as keyof typeof tierConfig];
    if (!config) return renderUpgradeUsage(); // Fallback
    
    const Icon = config.icon;
    
    return (
      <div className={`bg-white/5 backdrop-blur-xl border ${config.border} rounded-2xl p-8 text-center`}>
        <div className={`w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{config.title}</h3>
        <p className="text-white/60 mb-6">
          {config.description}
        </p>
        <button
          onClick={() => setActiveModal('upgrade')}
          className={`bg-gradient-to-r ${config.color} text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto`}
        >
          <Icon className="w-4 h-4" />
          Upgrade to {tier} - {config.price}
        </button>
      </div>
    );
  }
  
  // Helper function to render usage limit exceeded UI
  function renderUpgradeUsage() {
    return (
      <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Usage Limit Reached</h3>
        <p className="text-white/60 mb-6">
          You have used all your free credits. Upgrade your plan for more access.
        </p>
        <button
          onClick={() => setActiveModal('upgrade')}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
        >
          <Crown className="w-4 h-4" />
          Upgrade Plan
        </button>
      </div>
    );
  }

  return <>{typeof children === 'function' ? children({}) : children}</>;
}