import { database } from './database';
import { usageService } from './usageService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  agentId: string;
  messages: ChatMessage[];
  knowledgeBaseId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  agent: string;
}

export class AIService {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Check usage before proceeding
    const canProceed = await usageService.trackUsage('agent_interaction', 1, {
      agentId: request.agentId,
      messageLength: request.messages[request.messages.length - 1]?.content?.length || 0
    });
    
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Please upgrade to continue.');
    }

    try {
      const { data, error } = await database.functions.invoke('ai-chat', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'AI service error');
      }

      return data;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  async createAgent(agentData: {
    name: string;
    role: string;
    description: string;
    capabilities: string[];
    modelConfig?: any;
  }) {
    try {
      const { data, error } = await database
        .from('ai_agents')
        .insert([{
          ...agentData,
          model_config: agentData.modelConfig || {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 1000
          }
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create agent error:', error);
      throw error;
    }
  }

  async getAgents() {
    try {
      const { data, error } = await database
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get agents error:', error);
      throw error;
    }
  }

  async updateAgent(agentId: string, updates: any) {
    try {
      const { data, error } = await database
        .from('ai_agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update agent error:', error);
      throw error;
    }
  }

  async deleteAgent(agentId: string) {
    try {
      const { error } = await database
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete agent error:', error);
      throw error;
    }
  }

  async getAgentInteractions(agentId: string, limit = 50) {
    try {
      const { data, error } = await database
        .from('agent_interactions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get agent interactions error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();