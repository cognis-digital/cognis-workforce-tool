import React, { useState } from 'react';
import { X, Crown, ChevronRight, Zap, Star, Gem } from 'lucide-react';
import { useAppStore, useNotificationActions } from '../../store/appStore';
import { useUser, useUserProfile } from '../../store/authStore';
import { subscriptionPlans, SubscriptionTier } from '../../models/subscriptionTiers';
import { subscriptionService } from '../../services/subscriptionService';
import { usageService } from '../../services/usageService';
import { useDynamicText } from '../../hooks/useDynamicText';
import Modal from '../ui/Modal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const user = useUser();
  const userProfile = useUserProfile();
  const { addNotification } = useNotificationActions();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { getUpgradeMessage, getUsageMessage } = useDynamicText();

  const usageCount = user ? usageService.getUserUsageCount(user.id) : 0;
  const isAtLimit = user ? usageService.isAtLimit(user.id) : false;
  const remaining = user ? usageService.getRemainingUsage(user.id) : 0;

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsProcessing({ ...isProcessing, [tier]: true });
    
    try {
      const response = await subscriptionService.createCheckoutSession(tier);
      
      if (response.success) {
        addNotification({
          type: 'info',
          title: 'Subscription Process Started',
          message: response.message
        });
        
        onClose();
        
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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      size="lg"
      closeOnOverlayClick={false}
      className=""
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

        <div className="space-y-6 mt-6">
          {/* Basic Plan */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Basic Plan</h3>
                </div>
                <p className="text-white/70 mb-4">Enhanced tools for individual professionals</p>
                <div className="space-y-2">
                  {subscriptionPlans.find(p => p.id === 'basic')?.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">✓</div>
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-1">$20</div>
                <div className="text-white/60 text-sm mb-4">per month</div>
                <button 
                  onClick={() => handleUpgrade('basic')}
                  disabled={isProcessing['basic']}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {isProcessing['basic'] ? (
                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Choose Basic
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Pro Plan</h3>
                </div>
                <p className="text-white/70 mb-4">Advanced tools for growing businesses</p>
                <div className="space-y-2">
                  {subscriptionPlans.find(p => p.id === 'pro')?.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">✓</div>
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-1">$50</div>
                <div className="text-white/60 text-sm mb-4">per month</div>
                <button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isProcessing['pro']}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {isProcessing['pro'] ? (
                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Choose Pro
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Enterprise Plan */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gem className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Enterprise Plan</h3>
                </div>
                <p className="text-white/70 mb-4">Ultimate solution for organizations</p>
                <div className="space-y-2">
                  {subscriptionPlans.find(p => p.id === 'enterprise')?.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">✓</div>
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-1">$100</div>
                <div className="text-white/60 text-sm mb-4">per month</div>
                <button 
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={isProcessing['enterprise']}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {isProcessing['enterprise'] ? (
                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Choose Enterprise
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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