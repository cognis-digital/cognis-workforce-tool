import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../store/authStore';
import { usageTrackingService, UsageMetrics } from '../services/usageTrackingService';
import { SubscriptionTier } from '../models/subscriptionTiers';
import { useNotificationActions } from '../store/appStore';

type PaygatedFeature = keyof UsageMetrics;

interface UseFeaturePaygateOptions {
  feature: PaygatedFeature;
  redirectToUpgrade?: boolean;
  incrementOnAccess?: boolean;
  incrementAmount?: number;
}

interface FeaturePaygateResult {
  canAccess: boolean;
  isLoading: boolean;
  usage: {
    current: number;
    limit: number;
    percentage: number;
  };
  tier: SubscriptionTier;
  handleIncrement: () => Promise<boolean>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  navigateToUpgrade: () => void;
}

/**
 * Hook for checking if a user can access a feature based on their subscription tier
 * and usage limits
 */
export function useFeaturePaygate({
  feature,
  redirectToUpgrade = false,
  incrementOnAccess = false,
  incrementAmount = 1
}: UseFeaturePaygateOptions): FeaturePaygateResult {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const { addNotification } = useNotificationActions();
  
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [usage, setUsage] = useState({ current: 0, limit: 0, percentage: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Get the user's current tier
  const tier = userProfile?.tier as SubscriptionTier || 'free';
  
  // Check if the user can access the feature based on their usage
  useEffect(() => {
    checkAccess();
  }, [feature, userProfile]);
  
  // If incrementOnAccess is true, increment usage counter when the hook is used
  useEffect(() => {
    if (incrementOnAccess && canAccess && !isLoading) {
      handleIncrement();
    }
  }, [incrementOnAccess, canAccess, isLoading]);
  
  // Function to check if user can access the feature
  const checkAccess = async () => {
    if (!userProfile) {
      setCanAccess(false);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const usageCheck = await usageTrackingService.checkUsageLimit(
        userProfile.user_id,
        feature
      );
      
      setCanAccess(usageCheck.canUse);
      setUsage({
        current: usageCheck.currentUsage,
        limit: usageCheck.limit,
        percentage: usageCheck.percentageUsed
      });
      
      // If user has reached 90% or more of their limit, show a notification
      if (usageCheck.percentageUsed >= 90) {
        usageTrackingService.notifyApproachingLimit(feature, usageCheck.percentageUsed);
      }
      
      // If the user cannot access and redirectToUpgrade is true, show upgrade modal or redirect
      if (!usageCheck.canUse && redirectToUpgrade) {
        setShowUpgradeModal(true);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setCanAccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to increment usage
  const handleIncrement = async (): Promise<boolean> => {
    if (!userProfile) return false;
    
    try {
      const success = await usageTrackingService.trackUsage(
        userProfile.user_id, 
        feature,
        incrementAmount
      );
      
      if (success) {
        // Update local usage state
        setUsage(prev => ({
          ...prev,
          current: prev.current + incrementAmount,
          percentage: Math.min(100, Math.round(((prev.current + incrementAmount) / prev.limit) * 100))
        }));
        
        // Check if the increment put the user over their limit
        const newPercentage = Math.round(((usage.current + incrementAmount) / usage.limit) * 100);
        if (newPercentage >= 100) {
          setCanAccess(false);
          
          addNotification({
            type: 'error',
            title: 'Usage Limit Reached',
            message: `You've reached your ${featureToReadableName(feature)} limit for this billing period.`,
            action: 'Upgrade',
            actionUrl: '/pricing'
          });
          
          if (redirectToUpgrade) {
            setShowUpgradeModal(true);
          }
        } else if (newPercentage >= 90) {
          // Notify user they're approaching their limit
          usageTrackingService.notifyApproachingLimit(feature, newPercentage);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };
  
  // Navigate to upgrade page
  const navigateToUpgrade = () => {
    navigate('/pricing');
  };
  
  // Helper function to convert feature key to readable name
  const featureToReadableName = (featureKey: PaygatedFeature): string => {
    switch (featureKey) {
      case 'aiAgents': return 'AI Agents';
      case 'documentsUploaded': return 'Document Uploads';
      case 'leadSearches': return 'Lead Searches';
      case 'apiCalls': return 'API Calls';
      case 'storage': return 'Storage Space';
      default: return featureKey;
    }
  };
  
  return {
    canAccess,
    isLoading,
    usage,
    tier,
    handleIncrement,
    showUpgradeModal,
    setShowUpgradeModal,
    navigateToUpgrade
  };
}
