import React from 'react';
import { Crown, Zap, Lock } from 'lucide-react';
import { useUser, useUserProfile } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { usageService } from '../services/usageService';
import { useDynamicText } from '../hooks/useDynamicText';

interface PaygateWrapperProps {
  action: 'agent_interaction' | 'task_assignment' | 'lead_generation' | 'knowledge_upload' | 'image_generation' | 'deep_research' | 'study_learn';
  children: React.ReactNode | ((props: any) => React.ReactNode);
  cost?: number;
  fallback?: React.ReactNode;
}

export default function PaygateWrapper({ 
  action, 
  children, 
  cost = 1, 
  fallback 
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

  // Check if user has paid tier (unlimited usage)
  if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
    return <>{typeof children === 'function' ? children({}) : children}</>;
  }

  // Check if user has exceeded free usage limit
  const currentUsage = usageService.getUserUsageCount(user.id);
  const wouldExceedLimit = currentUsage + cost > 8;
  const remaining = usageService.getRemainingUsage(user.id);

  if (wouldExceedLimit || currentUsage >= 8) {
    return fallback || (
      <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Usage Limit Reached</h3>
        <p className="text-white/60 mb-6">
          You have used all 8 free credits. Upgrade to Pro for unlimited access to Cognis Digital.
        </p>
        <button
          onClick={() => setActiveModal('upgrade')}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Pro - $49/month
        </button>
      </div>
    );
  }

  return <>{typeof children === 'function' ? children({}) : children}</>;
}