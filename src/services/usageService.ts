import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';

export interface UsageRecord {
  id: string;
  userId: string;
  action: 'agent_interaction' | 'task_assignment' | 'lead_generation' | 'knowledge_upload' | 'image_generation' | 'deep_research' | 'study_learn';
  cost: number;
  timestamp: string;
  metadata?: any;
}

export class UsageService {
  private readonly FREE_USAGE_LIMIT = 8; // Exactly 8 credits for ALL new users - STRICTLY ENFORCED

  async trackUsage(action: string, cost = 1, metadata?: any): Promise<boolean> {
    const user = useAuthStore.getState().user;
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!user || !userProfile) {
      throw new Error('User not authenticated');
    }

    // If user has paid tier, allow unlimited usage
    if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
      return true;
    }

    // Check current usage for free tier
    const currentUsage = this.getUserUsageCount(user.id);
    
    if (currentUsage + cost > this.FREE_USAGE_LIMIT) {
      // Usage limit exceeded
      useAppStore.getState().setActiveModal('upgrade');
      useAppStore.getState().addNotification({
        type: 'warning',
        title: 'Usage Limit Reached',
        message: `You have used ${currentUsage}/${this.FREE_USAGE_LIMIT} free credits. Upgrade to Pro for unlimited access.`
      });
      return false;
    }

    // Track the usage
    const usageRecord: UsageRecord = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: action as any,
      cost,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Store usage in app state
    const currentRecords = this.getAllUsageRecords();
    const updatedRecords = [...currentRecords, usageRecord];
    localStorage.setItem('usage_records', JSON.stringify(updatedRecords));

    // Update notifications
    const remaining = this.FREE_USAGE_LIMIT - currentUsage - cost;
    if (remaining <= 1) {
      useAppStore.getState().addNotification({
        type: 'warning',
        title: 'Usage Limit Warning',
        message: remaining === 1 
          ? 'You have 1 free credit remaining. Upgrade to Pro for unlimited access.' 
          : 'This is your last free credit. Upgrade to Pro to continue using Cognis Digital.'
      });
    }

    return true;
  }

  getUserUsageCount(userId: string): number {
    const records = this.getAllUsageRecords();
    return records
      .filter(record => record.userId === userId)
      .reduce((total, record) => total + record.cost, 0);
  }

  getUserUsageRecords(userId: string): UsageRecord[] {
    const records = this.getAllUsageRecords();
    return records.filter(record => record.userId === userId);
  }

  private getAllUsageRecords(): UsageRecord[] {
    try {
      const stored = localStorage.getItem('usage_records');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getRemainingUsage(userId: string): number {
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!userProfile) return 0;
    
    // Unlimited for paid tiers
    if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
      return Infinity;
    }

    // Calculate remaining for free tier
    const used = this.getUserUsageCount(userId);
    return Math.max(0, this.FREE_USAGE_LIMIT - used);
  }

  getUsagePercentage(userId: string): number {
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!userProfile || userProfile.tier !== 'free') return 0;
    
    const used = this.getUserUsageCount(userId);
    return Math.min((used / this.FREE_USAGE_LIMIT) * 100, 100);
  }

  isAtLimit(userId: string): boolean {
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!userProfile) return true;
    
    // No limits for paid tiers
    if (userProfile.tier === 'pro' || userProfile.tier === 'enterprise') {
      return false;
    }

    return this.getUserUsageCount(userId) >= this.FREE_USAGE_LIMIT;
  }

  resetUsage(userId: string): void {
    const records = this.getAllUsageRecords();
    const filteredRecords = records.filter(record => record.userId !== userId);
    localStorage.setItem('usage_records', JSON.stringify(filteredRecords));
  }
}

export const usageService = new UsageService();