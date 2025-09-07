// Environment variable access
const getEnvVariable = (key: string): string => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  
  if (typeof import.meta === 'object' && import.meta && 'env' in import.meta) {
    return (import.meta as any).env[key] || '';
  }
  
  return '';
};

/**
 * Model profile configuration
 */
export type ModelProfile = {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
};

/**
 * Available model profiles
 */
export const MODEL_PROFILES: Record<string, ModelProfile> = {
  ultraLight: {
    id: 'ultra-light-model',
    name: 'Ultra Light Model',
    contextWindow: 1024,
    maxTokens: 256,
    temperature: 0.7
  },
  light: {
    id: 'light-model',
    name: 'Light Model',
    contextWindow: 1536,
    maxTokens: 384,
    temperature: 0.7
  },
  medium: {
    id: 'medium-model',
    name: 'Medium Model',
    contextWindow: 2048,
    maxTokens: 512,
    temperature: 0.7
  },
  heavy: {
    id: 'heavy-model',
    name: 'Heavy Model',
    contextWindow: 4096,
    maxTokens: 1024,
    temperature: 0.7
  }
};

/**
 * Message format for the dynamic model API
 */
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Request format for the dynamic model API
 */
export interface ModelRequest {
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Response format from the dynamic model API
 */
export interface ModelResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
}

/**
 * Service for interacting with dynamic models
 */
export class DynamicModelService {
  private readonly apiEndpoint: string;
  private readonly apiKey: string;
  
  constructor() {
    // Use the GitHub Pages URL as the base, with the correct API path
    const baseUrl = window.location.origin + (getEnvVariable('VITE_PUBLIC_URL') || '');
    this.apiEndpoint = `${baseUrl}/api/models`;
    this.apiKey = getEnvVariable('VITE_COGNIS_API_KEY') || '';
  }
  
  /**
   * Get available models
   */
  async getModels(): Promise<ModelProfile[]> {
    return Object.values(MODEL_PROFILES);
  }
  
  /**
   * Run inference with the dynamic model
   */
  async runInference(request: ModelRequest): Promise<ModelResponse> {
    try {
      // When deployed on GitHub Pages, we need to simulate the API response
      // since GitHub Pages doesn't support server-side execution
      if (window.location.hostname === 'cognis-digital.github.io') {
        return this.simulateResponse(request);
      }
      
      // For local development or other environments
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Dynamic model error:', error);
      return this.simulateResponse(request);
    }
  }
  
  /**
   * Simulate a model response when running on GitHub Pages
   * This is necessary since GitHub Pages is static hosting only
   */
  private simulateResponse(request: ModelRequest): ModelResponse {
    const { messages, temperature = 0.7 } = request;
    const lastMessage = messages[messages.length - 1];
    let content = '';
    
    // Generate a simple deterministic response based on the last message
    if (lastMessage.role === 'user') {
      const userQuery = lastMessage.content.toLowerCase();
      
      if (userQuery.includes('hello') || userQuery.includes('hi')) {
        content = 'Hello! How can I assist you today?';
      } else if (userQuery.includes('help')) {
        content = "I'm here to help. What do you need assistance with?";
      } else if (userQuery.includes('model')) {
        content = `I'm currently using the ${request.model} model with a temperature of ${temperature}.`;
      } else if (userQuery.includes('time') || userQuery.includes('date')) {
        content = `The current time is ${new Date().toLocaleString()}.`;
      } else {
        content = "I understand your request. As a simulated response on GitHub Pages, I have limited functionality, but I'm here to assist within those constraints.";
      }
    } else {
      content = "I'm ready to help with your next question.";
    }
    
    return {
      id: `sim-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{
        message: {
          role: 'assistant',
          content
        },
        finish_reason: 'stop',
        index: 0
      }]
    };
  }
}

// Export singleton instance
export const dynamicModelService = new DynamicModelService();
