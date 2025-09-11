/**
 * Cognis Backend API Service
 * Provides client-side integration with our self-hosted Cognis API backend
 */

// Types for chat completions
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Types for embeddings
export interface EmbeddingRequest {
  model?: string;
  input: string | string[];
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Configuration options
export interface CognisBackendConfig {
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
}

/**
 * Service for interacting with Cognis API Backend
 */
export class CognisBackendService {
  private baseUrl: string;
  private apiKey: string | null;
  private defaultModel: string;

  constructor(config?: CognisBackendConfig) {
    // Determine base URL with fallbacks
    let envBaseUrl: string | undefined;

    // Check window.ENV first (production/GitHub Pages)
    if (typeof window !== 'undefined' && window.ENV) {
      envBaseUrl = window.ENV.VITE_API_URL;
    }
    // Fallback to import.meta.env (development)
    else if (typeof import.meta === 'object' && import.meta && 'env' in import.meta) {
      envBaseUrl = (import.meta as any).env.VITE_API_URL;
    }

    // Set base URL from config or environment with fallback to local server
    this.baseUrl = config?.baseUrl || envBaseUrl || `${window.location.origin}/api/v1`;

    // Set API key from config or localStorage
    this.apiKey = config?.apiKey || localStorage.getItem('cognis_api_key');

    // Set default model
    this.defaultModel = config?.defaultModel || 'Cognis-Zenith-4.0';

    console.log(`CognisBackendService initialized with endpoint: ${this.baseUrl}`);
  }

  /**
   * Set API key for authentication
   */
  setApiKey(apiKey: string, persist = true): void {
    this.apiKey = apiKey;
    if (persist) {
      localStorage.setItem('cognis_api_key', apiKey);
    }
  }

  /**
   * Clear stored API key
   */
  clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('cognis_api_key');
  }

  /**
   * Check if API key is set
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create authorization headers if API key is available
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Generate a chat completion
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error creating chat completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion
   * @param request The chat completion request
   * @param onMessage Callback function for each message chunk
   * @param onComplete Callback function when the stream is complete
   * @param onError Callback function for errors
   */
  async streamChatCompletion(
    request: ChatCompletionRequest,
    onMessage: (content: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Error: ${response.status} ${response.statusText}`);
      }

      // Process the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';
      let fullContent = '';

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete events in buffer
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                onMessage(content);
                fullContent += content;
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

      // Call onComplete when done
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error streaming chat completion:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Generate embeddings
   */
  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model || 'Cognis-Nova-3.0',
          input: request.input
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<{ status: string; configured: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        configured: data.configured
      };
    } catch (error: any) {
      console.error('Error checking server health:', error);
      return {
        status: 'error',
        configured: false
      };
    }
  }
}

// Export singleton instance
export const cognisBackend = new CognisBackendService();
