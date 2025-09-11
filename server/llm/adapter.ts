// Define common types for chat messages and responses
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatRequest = { 
  model: string; 
  messages: ChatMessage[]; 
  temperature?: number; 
  max_tokens?: number; 
  stream?: boolean;
};

export type ChatResponse = { 
  id: string; 
  object: 'chat.completion'; 
  choices: { 
    message: { 
      role: 'assistant'; 
      content: string 
    } 
  }[];
};

// LLM adapter interface for different backends
export interface LLMAdapter { 
  chat(req: ChatRequest, onToken?: (tok: string) => void): Promise<ChatResponse>; 
}
