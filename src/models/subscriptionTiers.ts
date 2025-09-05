export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  tiers: Record<SubscriptionTier, {
    enabled: boolean;
    limit?: number;
    details?: string;
  }>;
}

export interface AIModelAccess {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  maxTokens: number;
  costMultiplier: number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annually';
  features: string[];
  color: string;
  popular?: boolean;
}

export const subscriptionFeatures: SubscriptionFeature[] = [
  {
    id: 'agent_interaction',
    name: 'AI Agent Interactions',
    description: 'Number of conversations with AI agents',
    tiers: {
      free: { enabled: true, limit: 25, details: '25 interactions per month' },
      basic: { enabled: true, limit: 500, details: '500 interactions per month' },
      pro: { enabled: true, limit: 2000, details: '2,000 interactions per month' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited interactions' }
    }
  },
  {
    id: 'knowledge_upload',
    name: 'Knowledge Base',
    description: 'Upload and process documents',
    tiers: {
      free: { enabled: true, limit: 5, details: '5 uploads, max 1MB per file' },
      basic: { enabled: true, limit: 50, details: '50 uploads, max 5MB per file' },
      pro: { enabled: true, limit: 500, details: '500 uploads, max 25MB per file' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited uploads, max 100MB per file' }
    }
  },
  {
    id: 'lead_generation',
    name: 'Lead Generation',
    description: 'AI-powered lead discovery',
    tiers: {
      free: { enabled: true, limit: 10, details: '10 searches per month' },
      basic: { enabled: true, limit: 100, details: '100 searches per month' },
      pro: { enabled: true, limit: 500, details: '500 searches per month' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited searches' }
    }
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    description: 'AI-generated images',
    tiers: {
      free: { enabled: true, limit: 5, details: '5 images per month' },
      basic: { enabled: true, limit: 100, details: '100 images per month' },
      pro: { enabled: true, limit: 500, details: '500 images per month' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited images' }
    }
  },
  {
    id: 'deep_research',
    name: 'Deep Research',
    description: 'Advanced AI research capabilities',
    tiers: {
      free: { enabled: false, details: 'Not available' },
      basic: { enabled: true, limit: 10, details: '10 research sessions per month' },
      pro: { enabled: true, limit: 50, details: '50 research sessions per month' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited research sessions' }
    }
  },
  {
    id: 'study_learn',
    name: 'Study & Learn',
    description: 'AI-assisted learning and education',
    tiers: {
      free: { enabled: false, details: 'Not available' },
      basic: { enabled: false, details: 'Not available' },
      pro: { enabled: true, limit: 20, details: '20 study sessions per month' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited study sessions' }
    }
  },
  {
    id: 'custom_agents',
    name: 'Custom AI Agents',
    description: 'Create and train custom AI agents',
    tiers: {
      free: { enabled: true, limit: 1, details: '1 basic agent' },
      basic: { enabled: true, limit: 3, details: '3 customizable agents' },
      pro: { enabled: true, limit: 10, details: '10 advanced agents' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited agents with priority training' }
    }
  },
  {
    id: 'multi_user',
    name: 'Team Members',
    description: 'Additional user accounts',
    tiers: {
      free: { enabled: false, details: 'Single user only' },
      basic: { enabled: true, limit: 3, details: 'Up to 3 team members' },
      pro: { enabled: true, limit: 10, details: 'Up to 10 team members' },
      enterprise: { enabled: true, limit: 0, details: 'Unlimited team members' }
    }
  }
];

export const aiModels: AIModelAccess[] = [
  {
    id: 'cognis-lite',
    name: 'Cognis Lite',
    description: 'Basic AI capabilities for simple tasks',
    tier: 'free',
    maxTokens: 1000,
    costMultiplier: 0.5
  },
  {
    id: 'cognis-nova-3.0',
    name: 'Cognis Nova 3.0',
    description: 'Standard AI capabilities with good performance',
    tier: 'basic',
    maxTokens: 3000,
    costMultiplier: 1.0
  },
  {
    id: 'cognis-apex-3.5',
    name: 'Cognis Apex 3.5',
    description: 'Advanced AI with enhanced reasoning and problem-solving',
    tier: 'pro',
    maxTokens: 5000,
    costMultiplier: 2.0
  },
  {
    id: 'cognis-vertex-4.0',
    name: 'Cognis Vertex 4.0',
    description: 'Superior AI capabilities with specialized domain expertise',
    tier: 'pro',
    maxTokens: 8000,
    costMultiplier: 3.0
  },
  {
    id: 'cognis-zenith-4.0',
    name: 'Cognis Zenith 4.0',
    description: 'Ultimate AI performance with unmatched capabilities',
    tier: 'enterprise',
    maxTokens: 16000,
    costMultiplier: 5.0
  }
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic access to essential tools',
    price: 0,
    billingCycle: 'monthly',
    features: [
      '1 Basic AI Agent',
      '5 Document Uploads',
      '10 Lead Generation Searches',
      '5 AI-Generated Images',
      'Basic Analytics'
    ],
    color: 'gray'
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Enhanced tools for individual professionals',
    price: 20,
    billingCycle: 'monthly',
    features: [
      '3 Custom AI Agents',
      '50 Document Uploads',
      '100 Lead Generation Searches',
      '100 AI-Generated Images',
      'Deep Research Access',
      'Up to 3 Team Members',
      'Email Support'
    ],
    color: 'blue'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced tools for growing businesses',
    price: 50,
    billingCycle: 'monthly',
    features: [
      '10 Advanced AI Agents',
      '500 Document Uploads',
      '500 Lead Generation Searches',
      '500 AI-Generated Images',
      'Study & Learn Features',
      'Up to 10 Team Members',
      'Priority Support'
    ],
    color: 'purple',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Ultimate solution for organizations',
    price: 100,
    billingCycle: 'monthly',
    features: [
      'Unlimited AI Agents',
      'Unlimited Document Uploads',
      'Unlimited Lead Generation',
      'Unlimited AI-Generated Images',
      'All Premium Features',
      'Unlimited Team Members',
      'Dedicated Support',
      'Custom Integrations'
    ],
    color: 'gold'
  }
];

export const getAvailableModelsForTier = (tier: SubscriptionTier): AIModelAccess[] => {
  const tierRanking = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  return aiModels.filter(model => tierRanking[model.tier] <= tierRanking[tier]);
};

export const getFeatureLimitForTier = (
  featureId: string, 
  tier: SubscriptionTier
): { enabled: boolean; limit?: number; details?: string } => {
  const feature = subscriptionFeatures.find(f => f.id === featureId);
  if (!feature) {
    return { enabled: false, details: 'Feature not found' };
  }
  return feature.tiers[tier];
};

export const checkFeatureAccess = (featureId: string, tier: SubscriptionTier): boolean => {
  const feature = subscriptionFeatures.find(f => f.id === featureId);
  if (!feature) return false;
  return feature.tiers[tier].enabled;
};

export const getPlanByTier = (tier: SubscriptionTier): SubscriptionPlan | undefined => {
  return subscriptionPlans.find(plan => plan.id === tier);
};
