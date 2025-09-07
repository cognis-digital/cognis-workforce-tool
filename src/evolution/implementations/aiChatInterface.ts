import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';
import { withAdaptiveEvolution } from '../core/adaptiveUI';
import { hasFeatureAccess } from './rbacSystem';

/**
 * Chat message with sender and content
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'agent';
  agentId?: string; // For multi-agent conversations
  content: string;
  timestamp: number;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    modelId?: string;
    confidence?: number;
    sources?: string[];
    contextWindow?: number[];
  };
}

/**
 * Temporal snapshot of conversation state
 */
export interface TemporalSnapshot {
  id: string;
  name: string;
  timestamp: number;
  messageIndex: number; // Index in the messages array
  metadata?: {
    createdBy: 'user' | 'system' | 'auto';
    description?: string;
    tags?: string[];
  };
}

/**
 * Agent definition for multi-agent conversations
 */
export interface ChatAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  avatarUrl?: string;
  active: boolean;
  priority: number;
  lastActive?: number;
}

/**
 * Chat session with messages and configuration
 */
export interface ChatSession {
  id: string;
  name: string;
  modelId: string;
  modelConfig: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  messages: ChatMessage[];
  created: number;
  lastActive: number;
  snapshots: TemporalSnapshot[];
  agents: ChatAgent[];
  multiAgentEnabled: boolean;
  knowledgeBaseIds?: string[]; // References to knowledge bases for context
  blockchainLogged: boolean;
}

/**
 * Complete AI Chat state with temporal tracking
 */
export interface ChatState {
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  availableModels: {
    id: string;
    name: string;
    description: string;
    maxContext: number;
    capabilities: string[];
  }[];
  usage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    lastUpdated: number;
  };
  preferences: {
    autoSaveInterval: number; // in milliseconds
    defaultModel: string;
    persistHistory: boolean;
  };
}

// Initialize chat state based on the AI Chat Interface screenshot
const initialChatState: ChatState = {
  sessions: {},
  activeSessionId: null,
  availableModels: [
    {
      id: 'ilama-zenith',
      name: 'Ilama Zenith',
      description: 'Professional tone for general audience',
      maxContext: 8192,
      capabilities: ['chat', 'knowledge', 'temporal-snapshots']
    },
    {
      id: 'cognis-apex',
      name: 'Cognis Apex 3.5',
      description: 'Balanced performance for everyday tasks',
      maxContext: 16384,
      capabilities: ['chat', 'knowledge', 'temporal-snapshots', 'multi-agent']
    },
    {
      id: 'cognis-vertex',
      name: 'Cognis Vertex 4.0',
      description: 'Advanced capabilities for complex tasks',
      maxContext: 32768,
      capabilities: ['chat', 'knowledge', 'temporal-snapshots', 'multi-agent', 'code']
    }
  ],
  usage: {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    lastUpdated: Date.now()
  },
  preferences: {
    autoSaveInterval: 60000, // 1 minute
    defaultModel: 'ilama-zenith',
    persistHistory: true
  }
};

// Create time-series store for chat
export const chatStore = createTimeSeriesStore(initialChatState, {
  maxHistory: 100,
  autoSnapshot: true
});

// Register with evolution manager
evolutionManager.registerStateEvolution('aiChat', initialChatState);

/**
 * Create a new chat session using recursive initialization
 * @param name Session name
 * @param modelId Model identifier
 * @returns Session ID
 */
export const createChatSession = (
  name: string = 'New Chat', 
  modelId: string = chatStore.getState().current.preferences.defaultModel
): string => {
  const { current } = chatStore.getState();
  
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  
  const newSession: ChatSession = {
    id: sessionId,
    name,
    modelId,
    modelConfig: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9
    },
    messages: initializeMessages([]),
    created: now,
    lastActive: now,
    snapshots: [],
    agents: [
      {
        id: 'primary',
        name: 'Cognis AI Chat',
        role: 'assistant',
        description: 'Primary AI assistant',
        systemPrompt: 'You are an AI assistant powered by Cognis Digital.',
        active: true,
        priority: 1
      }
    ],
    multiAgentEnabled: false,
    blockchainLogged: false
  };
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: newSession
    },
    activeSessionId: sessionId
  });
  
  // Record state transition
  stateAnalysisEngine.recordTransition(
    { activeSessionId: current.activeSessionId },
    { activeSessionId: sessionId },
    'create_chat_session'
  );
  
  return sessionId;
};

/**
 * Recursively initialize messages with system prompt
 * Uses recursive pattern to ensure proper initialization
 * 
 * @param messages Initial messages (if any)
 * @param depth Current recursion depth
 * @returns Initialized message array
 */
function initializeMessages(messages: ChatMessage[], depth: number = 0): ChatMessage[] {
  // Base case
  if (depth > 0) return messages;
  
  // Add system message if not present
  const hasSystemMessage = messages.some(m => m.sender === 'system');
  
  if (!hasSystemMessage) {
    return initializeMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        content: 'Chat with Cognis AI using your local Ollama models',
        timestamp: Date.now()
      },
      ...messages
    ], depth + 1);
  }
  
  return messages;
}

/**
 * Send a message in the active chat session
 * @param content Message content
 * @param userId User identifier
 * @returns Promise with message ID
 */
export const sendMessage = async (content: string, userId: string = 'user'): Promise<string> => {
  const { current } = chatStore.getState();
  const sessionId = current.activeSessionId;
  
  if (!sessionId || !current.sessions[sessionId]) {
    throw new Error('No active session');
  }
  
  const session = current.sessions[sessionId];
  const messageId = `msg-${Date.now()}`;
  
  // Add user message
  const userMessage: ChatMessage = {
    id: messageId,
    sender: 'user',
    content,
    timestamp: Date.now()
  };
  
  const updatedMessages = [...session.messages, userMessage];
  
  // Update state with user message
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        messages: updatedMessages,
        lastActive: Date.now()
      }
    }
  });
  
  // Create automatic temporal snapshot every 5 messages
  if (updatedMessages.length % 5 === 0) {
    createChatSnapshot(sessionId, `Auto-snapshot at ${updatedMessages.length} messages`, 'auto');
  }
  
  // Determine if multi-agent is enabled and access is allowed
  const useMultiAgent = session.multiAgentEnabled && 
                       hasFeatureAccess(userId, 'multi_agent', 'pro');
  
  // Get active agents
  const activeAgents = useMultiAgent ? 
    session.agents.filter(a => a.active) : 
    [session.agents.find(a => a.id === 'primary')!];
  
  // For each active agent, generate a response (or simulate it)
  const assistantResponses = await Promise.all(
    activeAgents.map(async (agent) => {
      // In a real implementation, this would call the appropriate API for each agent
      // Here we simulate different responses based on agent roles
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      return {
        id: `msg-${Date.now()}-${agent.id}`,
        sender: 'assistant',
        agentId: agent.id,
        content: `This is a simulated response from ${agent.name} (${agent.role}). In a real implementation, this would use the ${session.modelId} model with agent-specific prompting.`,
        timestamp: Date.now(),
        metadata: {
          tokens: Math.floor(50 + Math.random() * 100),
          processingTime: Math.floor(500 + Math.random() * 1000),
          modelId: session.modelId
        }
      } as ChatMessage;
    })
  );
  
  // Add assistant responses to chat
  let finalMessages = updatedMessages;
  for (const response of assistantResponses) {
    finalMessages = [...finalMessages, response];
    
    // Update incrementally to show responses appearing one by one
    chatStore.getState().update({
      sessions: {
        ...chatStore.getState().current.sessions,
        [sessionId]: {
          ...session,
          messages: finalMessages,
          lastActive: Date.now()
        }
      },
      usage: {
        ...chatStore.getState().current.usage,
        totalTokens: chatStore.getState().current.usage.totalTokens + (response.metadata?.tokens || 0),
        promptTokens: chatStore.getState().current.usage.promptTokens + Math.floor((response.metadata?.tokens || 0) * 0.4),
        completionTokens: chatStore.getState().current.usage.completionTokens + Math.floor((response.metadata?.tokens || 0) * 0.6),
        lastUpdated: Date.now()
      }
    });
    
    // Small delay between multiple agent responses
    if (assistantResponses.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // If blockchain logging is enabled and the user has access
  if (session.blockchainLogged && hasFeatureAccess(userId, 'blockchain_logging', 'pro')) {
    logToBlockchain(sessionId, finalMessages.slice(-1 - assistantResponses.length));
  }
  
  return messageId;
};

/**
 * Create a temporal snapshot of chat state
 * @param sessionId Session identifier
 * @param name Snapshot name
 * @param createdBy Who/what created the snapshot
 * @returns Snapshot ID
 */
export const createChatSnapshot = (
  sessionId: string, 
  name: string,
  createdBy: 'user' | 'system' | 'auto' = 'user'
): string => {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const snapshotId = `snapshot-${Date.now()}`;
  const timestamp = Date.now();
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        snapshots: [
          ...session.snapshots,
          {
            id: snapshotId,
            name,
            timestamp,
            messageIndex: session.messages.length - 1,
            metadata: {
              createdBy,
              description: `Snapshot taken at message ${session.messages.length}`,
              tags: ['temporal-snapshot']
            }
          }
        ]
      }
    }
  });
  
  // Also create a store-level snapshot
  chatStore.getState().createSnapshot(`chat-${sessionId}-${timestamp}`);
  
  // Record for analysis
  stateAnalysisEngine.recordTransition(
    { snapshots: session.snapshots.length },
    { snapshots: session.snapshots.length + 1 },
    'create_chat_snapshot'
  );
  
  return snapshotId;
};

/**
 * Revert conversation to a temporal snapshot
 * @param sessionId Session identifier
 * @param snapshotId Snapshot identifier
 */
export const revertToSnapshot = (sessionId: string, snapshotId: string): void => {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const snapshot = session.snapshots.find(s => s.id === snapshotId);
  
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }
  
  // Record the messages that will be removed
  const removedMessages = session.messages.slice(snapshot.messageIndex + 1);
  
  // Revert messages to snapshot point
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        messages: session.messages.slice(0, snapshot.messageIndex + 1)
      }
    }
  });
  
  // Record significant state change
  stateAnalysisEngine.recordTransition(
    { messageCount: session.messages.length },
    { messageCount: snapshot.messageIndex + 1 },
    'revert_to_snapshot'
  );
  
  // Also load store-level snapshot if it exists
  try {
    chatStore.getState().loadSnapshot(`chat-${sessionId}-${snapshot.timestamp}`);
  } catch (e) {
    console.warn('Store-level snapshot not found, using regular revert');
  }
};

/**
 * Toggle multi-agent mode
 * @param sessionId Session identifier
 * @param enabled Whether multi-agent mode is enabled
 */
export const toggleMultiAgent = (sessionId: string, enabled: boolean): void => {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        multiAgentEnabled: enabled
      }
    }
  });
  
  // If enabling multi-agent mode and we only have one agent,
  // add some additional specialized agents
  if (enabled && session.agents.length === 1) {
    addDefaultAgents(sessionId);
  }
};

/**
 * Add default agents for multi-agent conversations
 * Uses a recursive pattern to build agents with proper specializations
 * 
 * @param sessionId Session identifier
 * @param depth Current recursion depth
 */
function addDefaultAgents(sessionId: string, depth: number = 0): void {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) return;
  
  // Base case
  if (depth > 0 || session.agents.length > 1) return;
  
  const newAgents: ChatAgent[] = [
    ...session.agents,
    {
      id: 'researcher',
      name: 'Research Specialist',
      role: 'researcher',
      description: 'Provides factual information and deep research',
      systemPrompt: 'You are a research specialist focused on providing accurate information.',
      active: true,
      priority: 2
    },
    {
      id: 'critic',
      name: 'Critical Thinker',
      role: 'critic',
      description: 'Evaluates and challenges ideas from different perspectives',
      systemPrompt: 'You are a critical thinker who evaluates ideas from multiple perspectives.',
      active: true,
      priority: 3
    }
  ];
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        agents: newAgents
      }
    }
  });
}

/**
 * Add a custom agent to a session
 * @param sessionId Session identifier
 * @param agent Agent definition
 */
export const addAgent = (sessionId: string, agent: Omit<ChatAgent, 'active' | 'priority'>): void => {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const newAgent: ChatAgent = {
    ...agent,
    active: true,
    priority: session.agents.length + 1
  };
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        agents: [...session.agents, newAgent]
      }
    }
  });
};

/**
 * Toggle blockchain logging for a session
 * @param sessionId Session identifier
 * @param enabled Whether blockchain logging is enabled
 */
export const toggleBlockchainLogging = (sessionId: string, enabled: boolean): void => {
  const { current } = chatStore.getState();
  const session = current.sessions[sessionId];
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  chatStore.getState().update({
    sessions: {
      ...current.sessions,
      [sessionId]: {
        ...session,
        blockchainLogged: enabled
      }
    }
  });
};

/**
 * Simulate logging chat messages to blockchain
 * In a real implementation, this would interact with wallet and blockchain
 * @param sessionId Session identifier
 * @param messages Messages to log
 */
async function logToBlockchain(sessionId: string, messages: ChatMessage[]): Promise<void> {
  console.log(`[Blockchain] Logging ${messages.length} messages for session ${sessionId}`);
  
  // In a real implementation, this would create a transaction
  // through a connected wallet to record message hashes on-chain
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('[Blockchain] Log successful');
  
  // Record blockchain interaction
  stateAnalysisEngine.recordTransition(
    { blockchainLogged: messages.length - 1 },
    { blockchainLogged: messages.length },
    'blockchain_log'
  );
}

/**
 * Create React component with adaptive evolution capabilities
 */
export const createAdaptiveAIChatInterface = (ChatInterface: React.ComponentType<any>) => {
  return withAdaptiveEvolution(
    ChatInterface,
    'aiChatInterface',
    evolutionManager,
    true
  );
};
