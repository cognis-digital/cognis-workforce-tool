import React from 'react';
import { Zap, Crown, AlertTriangle } from 'lucide-react';
import { useUser, useUserProfile } from '../store/authStore';
import { usageService } from '../services/usageService';
import { useAppStore } from '../store/appStore';

export default function UsageIndicator() {
  const user = useUser();
  const userProfile = useUserProfile();
  const setActiveModal = useAppStore(state => state.setActiveModal);
  const currentUsage = user ? usageService.getUserUsageCount(user.id) : 0;

  if (!user || !userProfile) return null;

  // Show unlimited for paid users only
  if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl px-3 py-2">
        <Crown className="w-4 h-4 text-purple-400" />
        <span className="text-purple-400 text-sm font-medium">Unlimited</span>
      </div>
    );
  }


  // For free users, show 8 credit system
  const remaining = usageService.getRemainingUsage(user.id);

  const getColors = () => {
    if (isAtLimit) return 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400';
    if (remaining <= 1) return 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400';
    if (remaining <= 3) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400';
    return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400';
  };

  const getIcon = () => {
    if (isAtLimit) return AlertTriangle;
    return Zap;
  };

  const Icon = getIcon();

  return (
    <div 
      className={`flex items-center gap-2 bg-gradient-to-r ${getColors()} border rounded-xl px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={() => {
        if (isAtLimit || remaining <= 1) {
          setActiveModal('upgrade');
        }
      }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isAtLimit ? '0/8 Credits' : `${currentUsage}/8 Credits`}
      </span>
      
      {/* Progress bar */}
      {!isAtLimit && (
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current rounded-full transition-all duration-300"
            style={{ width: `${Math.max(percentage, 5)}%` }}
          />
        </div>
      )}
    </div>
  );
}