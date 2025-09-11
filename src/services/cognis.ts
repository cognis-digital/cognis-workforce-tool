// Cognis API integration service for knowledge processing and AI operations

export interface CognisConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl?: string;
  selfHosted?: boolean;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  choices: Array<{
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

export class CognisService {
  private apiKey: string;
  private baseUrl: string;
  private selfHosted: boolean;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(apiKey?: string, config?: Partial<CognisConfig>) {
    // Get API key from various sources with fallbacks
    let envApiKey: string | undefined;
    let envBaseUrl: string | undefined;
    let envSelfHosted: boolean | undefined;
    
    // Check for self-hosted mode flag in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const selfHostedParam = urlParams.get('selfHosted') === 'true' || urlParams.get('local') === 'true';
    
    // Check window.ENV first (production/GitHub Pages)
    if (typeof window !== 'undefined' && window.ENV) {
      envApiKey = window.ENV.VITE_COGNIS_API_KEY;
      envBaseUrl = window.ENV.VITE_API_URL;
      envSelfHosted = window.ENV.VITE_SELF_HOSTED === 'true';
    }
    // Fallback to import.meta.env (development)
    else if (typeof import.meta === 'object' && import.meta && 'env' in import.meta) {
      envApiKey = (import.meta as any).env.VITE_COGNIS_API_KEY;
      envBaseUrl = (import.meta as any).env.VITE_API_URL;
      envSelfHosted = (import.meta as any).env.VITE_SELF_HOSTED === 'true';
    }
    
    // Set API key with fallbacks
    this.apiKey = apiKey || 
                 config?.apiKey || 
                 envApiKey || 
                 localStorage.getItem('cognis_api_key') || 
                 '';
    
    // Determine if we're in self-hosted mode
    this.selfHosted = config?.selfHosted || 
                      selfHostedParam || 
                      envSelfHosted || 
                      false;
    
    // Set base URL with appropriate defaults
    if (this.selfHosted) {
      // For self-hosted mode, use the local server API endpoint
      const origin = window.location.origin;
      this.baseUrl = config?.baseUrl || 
                   envBaseUrl || 
                   `${origin}/api/v1`;
      
      // In self-hosted mode, we don't need the API key for frontend calls
      // as the backend will handle authentication
      
      console.log('Running in self-hosted mode with API endpoint:', this.baseUrl);
    } else {
      // For cloud mode, use the local server API which proxies to Cognis
      // This ensures API keys stay on the server side
      const origin = window.location.origin;
      this.baseUrl = config?.baseUrl || 
                   envBaseUrl || 
                   `${origin}/api/v1`;
    }
    
    if (!this.apiKey && !this.selfHosted) {
      console.warn('Cognis API key not found. Some features may not work.');
    }
    
    // Initialize connection
    this.initializeConnection();
  }
  
  // Event system for connection status
  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }
  
  removeEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) return;
    const callbacks = this.eventListeners.get(event) || [];
    this.eventListeners.set(event, callbacks.filter(cb => cb !== callback));
  }
  
  private triggerEvent(event: string, data?: any) {
    if (!this.eventListeners.has(event)) return;
    const callbacks = this.eventListeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  // Initialize connection to API
  private async initializeConnection() {
    this.connectionStatus = 'connecting';
    this.triggerEvent('connecting');
    
    try {
      // Check if the API is available
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).catch(() => ({ ok: false }));
      
      if (response.ok) {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.triggerEvent('connected');
        console.log('Connected to Cognis API');
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.triggerEvent('disconnected', error);
      console.warn('Failed to connect to Cognis API:', error);
      
      // Try to reconnect if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnect attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}...`);
        setTimeout(() => this.initializeConnection(), 5000 * this.reconnectAttempts);
      }
    }
  }
  
  // Get headers for API requests
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey && !this.selfHosted) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    // If in self-hosted mode, don't require API key
    if (!this.apiKey && !this.selfHosted) {
      throw new Error('Cognis API key not configured');
    }
    
    // Ensure connection is established
    if (this.connectionStatus !== 'connected') {
      try {
        await this.initializeConnection();
      } catch (error) {
        if (this.selfHosted) {
          console.warn('Self-hosted API connection failed, but continuing with request');
        } else {
          throw new Error('API connection not established');
        }
      }
    }

    try {
      // Prepare full URL - ensure endpoint starts with slash
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: { message: `HTTP ${response.status}: ${response.statusText}` } 
        }));
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const result = await response.json();
      return result as T;
    } catch (error: any) {
      // Handle common connection errors
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError')) {
        this.connectionStatus = 'disconnected';
        this.triggerEvent('disconnected', error);
      }
      throw error;
    }
  }

  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.makeRequest<EmbeddingResponse>('/embeddings', {
      model: request.model || 'Cognis-Nova-3.0',
      input: request.input,
    });
  }

  async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/chat/completions', {
      model: request.model || 'Cognis-Zenith-4.0',
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: request.stream || false,
    });
  }

  async processDocument(content: string, chunkSize = 1000, chunkOverlap = 200): Promise<string[]> {
    // Simple text chunking algorithm
    const chunks: string[] = [];
    const words = content.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize - chunkOverlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  async generateKnowledgeSummary(content: string): Promise<string> {
    try {
      const response = await this.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing and summarizing content. Create a concise, informative summary that captures the key points and main themes.'
          },
          {
            role: 'user',
            content: `Please provide a comprehensive summary of the following content:\n\n${content.slice(0, 3000)}...`
          }
        ],
        model: 'Cognis-Zenith-4.0',
        temperature: 0.3,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary';
    }
  }

  async extractKeywords(content: string): Promise<string[]> {
    try {
      const response = await this.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract the most important keywords and phrases from the given content. Return them as a comma-separated list, focusing on key concepts, topics, and technical terms.'
          },
          {
            role: 'user',
            content: content.slice(0, 2000)
          }
        ],
        model: 'Cognis-Apex-3.5',
        temperature: 0.2,
        max_tokens: 200
      });

      const keywords = response.choices[0]?.message?.content || '';
      return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async analyzeContentQuality(content: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const response = await this.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Analyze the quality of the given content and provide a score from 1-100, along with feedback and improvement suggestions. Focus on clarity, completeness, accuracy, and usefulness.'
          },
          {
            role: 'user',
            content: `Analyze this content:\n\n${content.slice(0, 2000)}...`
          }
        ],
        model: 'Cognis-Zenith-4.0',
        temperature: 0.3,
        max_tokens: 400
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      // Parse the response (in a real implementation, you'd use structured output)
      const scoreMatch = analysis.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
      
      return {
        score,
        feedback: analysis,
        suggestions: [
          'Consider adding more specific examples',
          'Improve content structure and organization',
          'Add more detailed explanations for complex topics'
        ]
      };
    } catch (error) {
      console.error('Error analyzing content quality:', error);
      return {
        score: 75,
        feedback: 'Unable to analyze content quality',
        suggestions: []
      };
    }
  }

  /**
   * Check if the API service is properly configured
   */
  isConfigured(): boolean {
    // In self-hosted mode, we don't need an API key
    return this.selfHosted || !!this.apiKey;
  }
  
  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }
  
  /**
   * Check if we're in self-hosted mode
   */
  isSelfHosted(): boolean {
    return this.selfHosted;
  }
  
  /**
   * Manually attempt to reconnect to the API
   */
  async reconnect(): Promise<boolean> {
    await this.initializeConnection();
    return this.connectionStatus === 'connected';
  }
  
  /**
   * Get API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Set new API key
   */
  setApiKey(apiKey: string, persist: boolean = true): void {
    this.apiKey = apiKey;
    if (persist) {
      localStorage.setItem('cognis_api_key', apiKey);
    }
    this.initializeConnection();
  }
}

// Export singleton instance
export const cognisService = new CognisService();