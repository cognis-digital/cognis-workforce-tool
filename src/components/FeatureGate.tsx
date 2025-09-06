import React from 'react';
import { useFeaturePaygate } from '../hooks/useFeaturePaygate';
import { UsageMetrics } from '../services/usageTrackingService';
import { AlertTriangle, Crown, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureGateProps {
  feature: keyof UsageMetrics;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  incrementOnRender?: boolean;
  redirectToUpgrade?: boolean;
}

/**
 * FeatureGate - A component that controls access to features based on
 * subscription tier and usage limits
 */
export default function FeatureGate({
  feature,
  children,
  fallback,
  incrementOnRender = false,
  redirectToUpgrade = true
}: FeatureGateProps) {
  const {
    canAccess,
    isLoading,
    usage,
    tier,
    showUpgradeModal,
    setShowUpgradeModal,
    navigateToUpgrade
  } = useFeaturePaygate({
    feature,
    redirectToUpgrade,
    incrementOnAccess: incrementOnRender
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!canAccess) {
    // If a fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default upgrade prompt
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 text-center"
      >
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-orange-400" />
        </div>
        
        <h3 className="text-xl font-medium text-white mb-2">
          {getFeatureRestrictionTitle(feature)}
        </h3>
        
        <p className="text-white/70 mb-6">
          {getFeatureRestrictionMessage(feature, usage, tier)}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={navigateToUpgrade}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade Plan
          </button>
          
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Maybe Later
          </button>
        </div>
        
        {usage.percentage >= 90 && (
          <div className="mt-6 flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-white/80 text-sm">
              You've used {usage.percentage}% of your {getFeatureDisplayName(feature)} limit.
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  // Render the children if the user can access the feature
  return <>{children}</>;
}

// Helper functions to get display names and messages
function getFeatureDisplayName(feature: keyof UsageMetrics): string {
  switch (feature) {
    case 'aiAgents': return 'AI Agents';
    case 'documentsUploaded': return 'Document Uploads';
    case 'leadSearches': return 'Lead Searches';
    case 'apiCalls': return 'API Calls';
    case 'storage': return 'Storage';
    default: return String(feature);
  }
}

function getFeatureRestrictionTitle(feature: keyof UsageMetrics): string {
  switch (feature) {
    case 'aiAgents': return 'AI Agent Limit Reached';
    case 'documentsUploaded': return 'Document Upload Limit Reached';
    case 'leadSearches': return 'Lead Search Limit Reached';
    case 'apiCalls': return 'API Usage Limit Reached';
    case 'storage': return 'Storage Limit Reached';
    default: return 'Usage Limit Reached';
  }
}

function getFeatureRestrictionMessage(
  feature: keyof UsageMetrics, 
  usage: { current: number; limit: number; percentage: number },
  tier: string
): string {
  const nextTier = tier === 'free' ? 'Basic' : 
                   tier === 'basic' ? 'Pro' : 'Enterprise';
  
  switch (feature) {
    case 'aiAgents':
      return `You've reached your limit of ${usage.limit} AI Agents for the ${tier} plan. Upgrade to ${nextTier} to create more agents.`;
    case 'documentsUploaded':
      return `You've reached your limit of ${usage.limit} document uploads for the ${tier} plan. Upgrade to ${nextTier} to upload more documents.`;
    case 'leadSearches':
      return `You've reached your limit of ${usage.limit} lead searches for the ${tier} plan. Upgrade to ${nextTier} to perform more searches.`;
    case 'apiCalls':
      return `You've reached your limit of ${usage.limit} API calls for the ${tier} plan. Upgrade to ${nextTier} to increase your API quota.`;
    case 'storage':
      return `You've reached your storage limit of ${usage.limit}MB for the ${tier} plan. Upgrade to ${nextTier} to increase your storage capacity.`;
    default:
      return `You've reached your usage limit for this feature on the ${tier} plan. Upgrade to ${nextTier} to access more resources.`;
  }
}
