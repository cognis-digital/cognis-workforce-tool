// Define the Tool interface
export type Tool = { 
  name: string; 
  description: string; 
  run: (input: string) => Promise<string>;
};

// Define the agent configuration interface
export type AgentConfig = { 
  id: string; 
  name: string; 
  systemPrompt: string; 
  model: string; 
  temperature: number; 
  maxTokens?: number;
  tools: string[];
};

// Define the tool execution result
export type ToolResult = {
  toolName: string;
  input: string;
  output: string;
};

// Define history entry for agent interactions
export type HistoryEntry = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolName?: string;
  toolInput?: string;
};
