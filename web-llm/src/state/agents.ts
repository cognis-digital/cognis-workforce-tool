/**
 * Agent state management using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define agent type
export type Agent = {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  tools: string[];
};

// Define store state interface
interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  
  // Actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  selectAgent: (id: string) => void;
  getSelectedAgent: () => Agent | undefined;
}

// Create the store with persistence
export const useAgents = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgentId: null,
      
      addAgent: (agent) => set((state) => ({
        agents: [...state.agents, agent],
        selectedAgentId: state.selectedAgentId || agent.id
      })),
      
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(agent => 
          agent.id === id ? { ...agent, ...updates } : agent
        )
      })),
      
      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id),
        selectedAgentId: state.selectedAgentId === id ? 
          (state.agents.length > 1 ? 
            state.agents.find(a => a.id !== id)?.id || null : null) 
          : state.selectedAgentId
      })),
      
      selectAgent: (id) => set({ selectedAgentId: id }),
      
      getSelectedAgent: () => {
        const { agents, selectedAgentId } = get();
        return agents.find(agent => agent.id === selectedAgentId);
      }
    }),
    {
      name: 'agent-storage'
    }
  )
);

// Helper to generate a default agent
export function createDefaultAgent(): Agent {
  return {
    id: `agent_${Date.now()}`,
    name: 'General Assistant',
    systemPrompt: 'You are a helpful assistant. Be concise and informative.',
    model: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    temperature: 0.7,
    maxTokens: 256,
    tools: ['echo', 'datetime']
  };
}
