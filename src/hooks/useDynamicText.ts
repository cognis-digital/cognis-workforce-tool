import { useAppStore } from '../store/appStore';

/**
 * Hook for managing dynamic text content throughout the application
 * Allows components to update text based on current state
 */
export function useDynamicText() {
  const updateDynamicText = useAppStore(state => state.updateDynamicText);
  const getDynamicText = useAppStore(state => state.getDynamicText);

  const setText = (key: string, value: string) => {
    updateDynamicText(key, value);
  };

  const getText = (key: string, defaultValue: string = '') => {
    return getDynamicText(key, defaultValue);
  };

  // Common dynamic text patterns
  const getWelcomeMessage = (userName: string) => {
    return getText('welcome_message', `Welcome back, ${userName}`);
  };

  const getUpgradeMessage = (tier: string) => {
    return getText('upgrade_message', `Upgrade from ${tier} to unlock unlimited features`);
  };

  const getUsageMessage = (remaining: number) => {
    return getText('usage_message', `${remaining} actions remaining on your free plan`);
  };

  const getFeatureDescription = (feature: string) => {
    const descriptions = {
      agents: getText('agents_description', 'Create and manage AI agents for your business workflows'),
      knowledge: getText('knowledge_description', 'Build comprehensive knowledge bases with AI-powered indexing'),
      tasks: getText('tasks_description', 'Assign tasks to AI agents and download professional deliverables'),
      leads: getText('leads_description', 'Generate qualified leads using AI-powered web search'),
      wallet: getText('wallet_description', 'Connect your wallet for blockchain-powered features')
    };
    
    return descriptions[feature as keyof typeof descriptions] || '';
  };

  return {
    setText,
    getText,
    getWelcomeMessage,
    getUpgradeMessage,
    getUsageMessage,
    getFeatureDescription
  };
}