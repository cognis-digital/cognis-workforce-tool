import { database } from './database';
import { useUserProfile } from '../store/authStore';
import { useNotificationActions } from '../store/appStore';
import { SubscriptionTier, subscriptionPlans } from '../models/subscriptionTiers';

export interface UsageMetrics {
  aiAgents: {
    used: number;
    limit: number;
    percentage: number;
  };
  documentsUploaded: {
    used: number;
    limit: number;
    percentage: number;
  };
  leadSearches: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  storage: {
    used: number; // in MB
    limit: number; // in MB
    percentage: number;
  };
}

export interface UsagePeriod {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  daysLeft: number;
}

class UsageTrackingService {
  // Get usage limits based on subscription tier
  getUsageLimits(tier: SubscriptionTier): Record<string, number> {
    const plan = subscriptionPlans.find(p => p.id === tier) || subscriptionPlans[0];
    
    return {
      aiAgents: tier === 'free' ? 1 : 
                tier === 'basic' ? 3 : 
                tier === 'pro' ? 10 : 
                Infinity,
      documentsUploaded: tier === 'free' ? 5 : 
                         tier === 'basic' ? 50 : 
                         tier === 'pro' ? 500 : 
                         Infinity,
      leadSearches: tier === 'free' ? 10 : 
                    tier === 'basic' ? 100 : 
                    tier === 'pro' ? 500 : 
                    Infinity,
      apiCalls: tier === 'free' ? 100 : 
                tier === 'basic' ? 1000 : 
                tier === 'pro' ? 10000 : 
                Infinity,
      storage: tier === 'free' ? 100 : // 100MB 
               tier === 'basic' ? 1000 : // 1GB
               tier === 'pro' ? 10000 : // 10GB
               100000, // 100GB for enterprise
    };
  }
  
  // Get user's current usage metrics
  async getUserUsageMetrics(userId: string): Promise<UsageMetrics | null> {
    try {
      // In a real implementation, this would fetch actual usage data from the database
      // For now, we'll simulate the data
      
      const userProfile = useUserProfile.getState();
      if (!userProfile) return null;
      
      const tier = userProfile.tier as SubscriptionTier;
      const limits = this.getUsageLimits(tier);
      
      // Get simulated usage data (in production would be from database)
      const { data, error } = await database
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // If no data exists or there's an error, create simulated data
      let usageData = data;
      if (error || !data) {
        usageData = {
          ai_agents_count: Math.floor(Math.random() * limits.aiAgents * 0.7),
          documents_uploaded: Math.floor(Math.random() * limits.documentsUploaded * 0.6),
          lead_searches: Math.floor(Math.random() * limits.leadSearches * 0.8),
          api_calls: Math.floor(Math.random() * limits.apiCalls * 0.5),
          storage_used: Math.floor(Math.random() * limits.storage * 0.4)
        };
      }
      
      // Format and return the metrics
      return {
        aiAgents: {
          used: usageData.ai_agents_count || 0,
          limit: limits.aiAgents,
          percentage: this.calculatePercentage(usageData.ai_agents_count || 0, limits.aiAgents)
        },
        documentsUploaded: {
          used: usageData.documents_uploaded || 0,
          limit: limits.documentsUploaded,
          percentage: this.calculatePercentage(usageData.documents_uploaded || 0, limits.documentsUploaded)
        },
        leadSearches: {
          used: usageData.lead_searches || 0,
          limit: limits.leadSearches,
          percentage: this.calculatePercentage(usageData.lead_searches || 0, limits.leadSearches)
        },
        apiCalls: {
          used: usageData.api_calls || 0,
          limit: limits.apiCalls,
          percentage: this.calculatePercentage(usageData.api_calls || 0, limits.apiCalls)
        },
        storage: {
          used: usageData.storage_used || 0,
          limit: limits.storage,
          percentage: this.calculatePercentage(usageData.storage_used || 0, limits.storage)
        }
      };
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      return null;
    }
  }
  
  // Calculate the subscription period dates and days remaining
  getUserSubscriptionPeriod(userProfile: any): UsagePeriod | null {
    if (!userProfile) return null;
    
    let periodStart: Date, periodEnd: Date;
    
    if (userProfile.subscription_renewed_at) {
      // If subscription has renewed before, use that date
      periodStart = new Date(userProfile.subscription_renewed_at);
    } else if (userProfile.subscription_created_at) {
      // Otherwise use when the subscription was first created
      periodStart = new Date(userProfile.subscription_created_at);
    } else {
      // Fallback to account creation time
      periodStart = new Date(userProfile.created_at || Date.now());
    }
    
    // Subscriptions are monthly
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    const today = new Date();
    const daysLeft = Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      daysLeft: Math.max(0, daysLeft)
    };
  }
  
  // Track new usage of a specific feature
  async trackUsage(userId: string, metricType: keyof UsageMetrics, incrementAmount = 1): Promise<boolean> {
    try {
      // Get current usage data
      const { data, error } = await database
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      const fieldMappings: Record<keyof UsageMetrics, string> = {
        aiAgents: 'ai_agents_count',
        documentsUploaded: 'documents_uploaded',
        leadSearches: 'lead_searches',
        apiCalls: 'api_calls',
        storage: 'storage_used'
      };
      
      const dbField = fieldMappings[metricType];
      
      if (error || !data) {
        // Create new usage record if none exists
        const newRecord: Record<string, any> = { user_id: userId };
        newRecord[dbField] = incrementAmount;
        
        const { error: insertError } = await database
          .from('usage_metrics')
          .insert([newRecord]);
          
        if (insertError) throw insertError;
      } else {
        // Update existing usage record
        const updateData: Record<string, any> = {};
        updateData[dbField] = (data[dbField] || 0) + incrementAmount;
        
        const { error: updateError } = await database
          .from('usage_metrics')
          .update(updateData)
          .eq('user_id', userId);
          
        if (updateError) throw updateError;
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  }
  
  // Check if a user has exceeded their usage limit for a specific feature
  async checkUsageLimit(userId: string, metricType: keyof UsageMetrics): Promise<{
    canUse: boolean;
    currentUsage: number;
    limit: number;
    percentageUsed: number;
  }> {
    const userProfile = useUserProfile.getState();
    if (!userProfile) {
      return { canUse: false, currentUsage: 0, limit: 0, percentageUsed: 0 };
    }
    
    const usageMetrics = await this.getUserUsageMetrics(userId);
    if (!usageMetrics) {
      return { canUse: true, currentUsage: 0, limit: 0, percentageUsed: 0 };
    }
    
    const metric = usageMetrics[metricType];
    const canUse = metric.used < metric.limit;
    
    return {
      canUse,
      currentUsage: metric.used,
      limit: metric.limit,
      percentageUsed: metric.percentage
    };
  }
  
  // Reset usage counters for the new billing period
  async resetUsageCounters(userId: string): Promise<boolean> {
    try {
      const { error } = await database
        .from('usage_metrics')
        .update({
          ai_agents_count: 0,
          documents_uploaded: 0,
          lead_searches: 0,
          api_calls: 0,
          // Note: storage is cumulative and doesn't reset
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resetting usage counters:', error);
      return false;
    }
  }
  
  // Notify the user when they are approaching usage limits
  notifyApproachingLimit(metricType: keyof UsageMetrics, percentageUsed: number) {
    if (percentageUsed >= 90) {
      const notificationActions = useNotificationActions.getState();
      
      const metricLabels: Record<keyof UsageMetrics, string> = {
        aiAgents: 'AI Agents',
        documentsUploaded: 'Document Uploads',
        leadSearches: 'Lead Searches',
        apiCalls: 'API Calls',
        storage: 'Storage Space'
      };
      
      notificationActions.addNotification({
        type: 'warning',
        title: 'Usage Limit Approaching',
        message: `You've used ${percentageUsed}% of your ${metricLabels[metricType]} limit for this period.`,
        action: 'Upgrade',
        actionUrl: '/pricing'
      });
    }
  }
  
  private calculatePercentage(used: number, limit: number): number {
    if (limit === Infinity || limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }
}

export const usageTrackingService = new UsageTrackingService();
