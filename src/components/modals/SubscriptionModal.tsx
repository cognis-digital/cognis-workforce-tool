import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  Star, 
  Gem, 
  Check, 
  CreditCard, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  subscriptionPlans, 
  SubscriptionTier, 
  aiModels,
  subscriptionFeatures,
  getAvailableModelsForTier
} from '../../models/subscriptionTiers';
import { useUserProfile } from '../../store/authStore';
import { useAppStore, useNotificationActions } from '../../store/appStore';
import { subscriptionService } from '../../services/subscriptionService';
import Modal from '../ui/Modal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'plans' | 'models' | 'features';
}

export default function SubscriptionModal({ isOpen, onClose, initialTab = 'plans' }: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const userProfile = useUserProfile();
  const { addNotification } = useNotificationActions();
  
  const currentTier = userProfile?.tier as SubscriptionTier || 'free';
  
  useEffect(() => {
    if (isOpen) {
      setSelectedTier(null);
      setError('');
    }
  }, [isOpen]);
  
  const handleUpgradeClick = async () => {
    if (!selectedTier || selectedTier === currentTier) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await subscriptionService.createCheckoutSession(selectedTier);
      
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
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred processing your subscription');
      addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: error.message || 'Failed to process subscription'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const currentPlan = subscriptionPlans.find(plan => plan.id === currentTier);
  const availableModels = getAvailableModelsForTier(currentTier);
  
  // Helper function to get tier-specific icon
  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return Shield;
      case 'basic': return Zap;
      case 'pro': return Star;
      case 'enterprise': return Gem;
      default: return Shield;
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Subscription Management"
      size="lg"
    >
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Current Plan</h3>
          
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentTier === 'free' 
                ? 'bg-gray-500/20' 
                : currentTier === 'basic'
                  ? 'bg-blue-500/20'
                  : currentTier === 'pro'
                    ? 'bg-purple-500/20'
                    : 'bg-amber-500/20'
            }`}>
              {React.createElement(getTierIcon(currentTier), { 
                className: `w-6 h-6 ${
                  currentTier === 'free' 
                    ? 'text-gray-400' 
                    : currentTier === 'basic'
                      ? 'text-blue-400'
                      : currentTier === 'pro'
                        ? 'text-purple-400'
                        : 'text-amber-400'
                }`
              })}
            </div>
            
            <div>
              <h4 className="text-white font-bold text-lg">{currentPlan?.name || 'Free'} Plan</h4>
              <p className="text-white/60">
                {currentTier === 'free' 
                  ? 'Limited access to basic features' 
                  : `$${currentPlan?.price}/month - ${currentPlan?.description}`
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'plans'
                ? 'text-primary-400 border-primary-400'
                : 'text-white/60 border-transparent'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'models'
                ? 'text-primary-400 border-primary-400'
                : 'text-white/60 border-transparent'
            }`}
          >
            AI Models
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'features'
                ? 'text-primary-400 border-primary-400'
                : 'text-white/60 border-transparent'
            }`}
          >
            Feature Access
          </button>
        </div>
        
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
            {subscriptionPlans.filter(plan => plan.id !== 'free').map((plan) => {
              const isCurrentPlan = plan.id === currentTier;
              const isSelected = plan.id === selectedTier;
              const PlanIcon = getTierIcon(plan.id as SubscriptionTier);
              
              return (
                <div 
                  key={plan.id}
                  onClick={() => !isCurrentPlan && setSelectedTier(plan.id as SubscriptionTier)}
                  className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
                    isCurrentPlan 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : isSelected
                        ? 'border-primary-500/50 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.id === 'basic'
                        ? 'bg-blue-500/20'
                        : plan.id === 'pro'
                          ? 'bg-purple-500/20'
                          : 'bg-amber-500/20'
                    }`}>
                      <PlanIcon className={`w-5 h-5 ${
                        plan.id === 'basic'
                          ? 'text-blue-400'
                          : plan.id === 'pro'
                            ? 'text-purple-400'
                            : 'text-amber-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                        <div className="text-lg font-bold text-white">${plan.price}/mo</div>
                      </div>
                      <p className="text-white/60 text-sm">{plan.description}</p>
                      
                      <div className="mt-4 space-y-2">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-white/70 text-sm">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div className="text-white/50 text-xs">
                            +{plan.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentPlan && (
                    <div className="mt-3 bg-green-500/20 text-green-400 text-center py-1 rounded-lg text-sm font-medium">
                      Current Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            <h3 className="text-lg font-medium text-white">Available AI Models</h3>
            
            {aiModels.map((model) => {
              const isAvailable = availableModels.some(m => m.id === model.id);
              const modelTier = subscriptionPlans.find(p => p.id === model.tier);
              
              return (
                <div 
                  key={model.id}
                  className={`p-4 rounded-lg border ${
                    isAvailable 
                      ? 'border-white/10 bg-white/5' 
                      : 'border-white/5 bg-white/2 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold">{model.name}</h4>
                        {isAvailable && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Available
                          </span>
                        )}
                        {!isAvailable && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            Requires Upgrade
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm">{model.description}</p>
                      <div className="mt-2 text-white/50 text-xs">
                        Maximum context: {model.maxTokens.toLocaleString()} tokens
                      </div>
                    </div>
                    
                    {!isAvailable && modelTier && (
                      <div className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-white/70">
                        Requires {modelTier.name}+
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="max-h-96 overflow-y-auto p-2">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-2 text-white font-medium">Feature</th>
                  <th className="pb-2 text-white font-medium">Your Access</th>
                  <th className="pb-2 text-white font-medium">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptionFeatures.map((feature) => {
                  const access = feature.tiers[currentTier];
                  
                  return (
                    <tr key={feature.id} className="hover:bg-white/2">
                      <td className="py-3">
                        <div className="text-white font-medium">{feature.name}</div>
                        <div className="text-white/50 text-sm">{feature.description}</div>
                      </td>
                      <td className="py-3">
                        {access.enabled ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <Check className="w-4 h-4" /> Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-4 h-4" /> Unavailable
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-white/70">
                        {access.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-white/10">
          <div>
            {currentTier !== 'free' && (
              <button
                onClick={async () => {
                  try {
                    setIsProcessing(true);
                    const response = await subscriptionService.cancelSubscription();
                    if (response.success) {
                      addNotification({
                        type: 'success',
                        title: 'Subscription Cancelled',
                        message: 'Your subscription has been cancelled.'
                      });
                      onClose();
                    } else {
                      setError(response.message);
                    }
                  } catch (error: any) {
                    setError(error.message || 'Failed to cancel subscription');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="text-white/60 hover:text-white/80 transition-colors text-sm"
              >
                Cancel Subscription
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Close
            </button>
            
            {selectedTier && selectedTier !== currentTier && (
              <button
                onClick={handleUpgradeClick}
                disabled={isProcessing || !selectedTier || selectedTier === currentTier}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Upgrade to {subscriptionPlans.find(p => p.id === selectedTier)?.name}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
