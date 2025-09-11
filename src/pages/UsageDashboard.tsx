import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  BarChart3, 
  Bot, 
  FileText, 
  Search, 
  Server, 
  Zap,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { usageTrackingService, UsageMetrics, UsagePeriod } from '../services/usageTrackingService';
import { useUserProfile } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscriptionPlans, SubscriptionTier } from '../models/subscriptionTiers';

export default function UsageDashboard() {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    if (!userProfile) return;
    setLoading(true);
    
    try {
      const metrics = await usageTrackingService.getUserUsageMetrics(userProfile.user_id);
      const period = usageTrackingService.getUserSubscriptionPeriod(userProfile);
      
      setUsageMetrics(metrics);
      setUsagePeriod(period);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };
  
  const getNextTier = (currentTier: SubscriptionTier): SubscriptionTier => {
    if (currentTier === 'free') return 'basic';
    if (currentTier === 'basic') return 'pro';
    if (currentTier === 'pro') return 'enterprise';
    return 'enterprise';
  };
  
  const getFeatureIcon = (metricKey: string) => {
    switch (metricKey) {
      case 'aiAgents':
        return <Bot className="w-5 h-5 text-blue-400" />;
      case 'documentsUploaded':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'leadSearches':
        return <Search className="w-5 h-5 text-green-400" />;
      case 'apiCalls':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'storage':
        return <Server className="w-5 h-5 text-red-400" />;
      default:
        return <BarChart3 className="w-5 h-5 text-blue-400" />;
    }
  };
  
  // Helper function to format the metric name for display
  const formatMetricName = (key: string): string => {
    switch (key) {
      case 'aiAgents': return 'AI Agents';
      case 'documentsUploaded': return 'Document Uploads';
      case 'leadSearches': return 'Lead Searches';
      case 'apiCalls': return 'API Calls';
      case 'storage': return 'Storage (MB)';
      default: return key;
    }
  };
  
  // Helper function to get the color for the progress bar based on usage percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getCurrentPlanDetails = () => {
    if (!userProfile) return null;
    return subscriptionPlans.find(plan => plan.id === userProfile.tier);
  };
  
  const getNextPlanDetails = () => {
    if (!userProfile) return null;
    const nextTier = getNextTier(userProfile.tier as SubscriptionTier);
    return subscriptionPlans.find(plan => plan.id === nextTier);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Usage Dashboard</h1>
        <p className="text-white/60">
          Monitor your resource usage and subscription limits
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Plan & Period Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 col-span-1"
            >
              <h2 className="text-white/60 text-sm mb-1">Current Plan</h2>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-2xl font-bold ${
                  (userProfile?.tier as string) === 'free' ? 'text-gray-400' :
                  (userProfile?.tier as string) === 'basic' ? 'text-blue-400' :
                  (userProfile?.tier as string) === 'pro' ? 'text-purple-400' :
                  'text-amber-400'
                }`}>
                  {getCurrentPlanDetails()?.name || 'Free'}
                </span>
              </div>
              
              {userProfile?.tier !== 'enterprise' && (
                <button
                  onClick={handleUpgrade}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Upgrade to {getNextPlanDetails()?.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
            
            {/* Billing Period */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 col-span-1"
            >
              <h2 className="text-white/60 text-sm mb-1">Billing Period</h2>
              <div className="text-lg font-medium text-white">
                {usagePeriod ? (
                  <>{usagePeriod.currentPeriodStart.toLocaleDateString()} - {usagePeriod.currentPeriodEnd.toLocaleDateString()}</>
                ) : (
                  'No active subscription'
                )}
              </div>
              
              {usagePeriod && (
                <p className="text-white/60 text-sm mt-2">
                  {usagePeriod.daysLeft} days remaining in current period
                </p>
              )}
            </motion.div>
            
            {/* Next Billing Date */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 col-span-1"
            >
              <h2 className="text-white/60 text-sm mb-1">Next Billing Date</h2>
              <div className="text-lg font-medium text-white">
                {usagePeriod ? usagePeriod.currentPeriodEnd.toLocaleDateString() : 'N/A'}
              </div>
              
              <p className="text-white/60 text-sm mt-2">
                {userProfile?.tier === 'free' 
                  ? 'Free plan - No billing' 
                  : `You'll be billed on this date`}
              </p>
            </motion.div>
          </div>
          
          {/* Usage Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-medium text-white mb-6">Feature Usage</h2>
            
            <div className="space-y-6">
              {usageMetrics && Object.entries(usageMetrics).map(([key, metric], index) => {
                const isApproachingLimit = metric.percentage >= 90;
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    className={`p-4 rounded-xl ${isApproachingLimit ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getFeatureIcon(key)}
                        <span className="text-white font-medium">
                          {formatMetricName(key)}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-white font-medium">
                          {metric.used} / {metric.limit === Infinity ? 'Unlimited' : metric.limit}
                        </span>
                        <span className="text-white/60 ml-1 text-sm">
                          ({metric.percentage}%)
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(metric.percentage)}`}
                        style={{ width: `${metric.percentage}%` }}
                      ></div>
                    </div>
                    
                    {/* Warning for approaching limit */}
                    {isApproachingLimit && (
                      <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          You're approaching your limit. 
                          <button 
                            onClick={handleUpgrade}
                            className="ml-1 text-red-300 underline hover:text-red-200"
                          >
                            Upgrade now
                          </button>
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
          
          {/* Upgrade CTA */}
          {userProfile?.tier !== 'enterprise' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-purple-400" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1">Need More Resources?</h3>
                  <p className="text-white/70 mb-4">
                    Upgrade to the {getNextPlanDetails()?.name} plan to get more AI agents, document storage, and lead searches.
                  </p>
                  
                  <button
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    View Upgrade Options
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
