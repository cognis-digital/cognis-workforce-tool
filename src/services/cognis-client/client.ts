import {
  ApiClientState,
  ApiErrorResponse,
  ChatCompletionChunk,
  ChatCompletionRequest,
  ChatCompletionResponse,
  CognisApiConfig,
  EmbeddingRequest,
  EmbeddingResponse
} from './types';

/**
 * Cognis API Client
 * 
 * Provides a comprehensive interface to the Cognis API with streaming support,
 * error handling, and integration with the Evolution Architecture.
 */
export class CognisApiClient {
  private readonly config: CognisApiConfig;
  private state: ApiClientState;

  /**
   * Create a new Cognis API client
   * @param config Client configuration
   */
  constructor(config: Partial<CognisApiConfig> = {}) {
    // Default configuration
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000/api/v1',
      apiKey: config.apiKey,
      defaultModel: config.defaultModel || 'Cognis-Zenith-4.0',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      defaultHeaders: config.defaultHeaders || {}
    };

    // Initialize state
    this.state = {
      lastRequestTime: null,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalTokensUsed: 0,
      latencies: [],
      activeRequests: 0
    };
  }

  /**
   * Update the API key
   * @param apiKey New API key
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Get the client state (for time-series integration)
   * @returns Current client state
   */
  getState(): ApiClientState {
    return { ...this.state };
  }

  /**
   * Reset client statistics
   */
  resetStats(): void {
    this.state = {
      lastRequestTime: null,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalTokensUsed: 0,
      latencies: [],
      activeRequests: 0
    };
  }

  /**
   * Create a chat completion
   * @param request Chat completion request
   * @returns Promise with the completion response
   */
  async createChatCompletion(
    request: Partial<ChatCompletionRequest>
  ): Promise<ChatCompletionResponse> {
    // Apply defaults
    const fullRequest: ChatCompletionRequest = {
      model: request.model || this.config.defaultModel,
      messages: request.messages || [],
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stream: request.stream || false,
      stop: request.stop,
      functions: request.functions
    };

    if (fullRequest.stream) {
      throw new Error('For streaming responses, use createChatCompletionStream instead');
    }

    return this.executeRequest<ChatCompletionResponse>(
      `${this.config.baseUrl}/chat/completions`,
      fullRequest
    );
  }

  /**
   * Create a streaming chat completion
   * @param request Chat completion request
   * @param onChunk Callback for each chunk
   * @param onDone Callback when stream completes
   * @param onError Error callback
   */
  async createChatCompletionStream(
    request: Partial<ChatCompletionRequest>,
    onChunk: (chunk: ChatCompletionChunk) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // Apply defaults
    const fullRequest: ChatCompletionRequest = {
      model: request.model || this.config.defaultModel,
      messages: request.messages || [],
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stream: true,
      stop: request.stop,
      functions: request.functions
    };

    try {
      const startTime = Date.now();
      this.state.requestCount++;
      this.state.activeRequests++;
      this.state.lastRequestTime = startTime;

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(fullRequest)
      });

      if (!response.ok) {
        const error = await response.json() as ApiErrorResponse;
        throw new Error(error.error.message || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        // Decode and append to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events in buffer
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              finished = true;
              break;
            }

            try {
              const parsed = JSON.parse(data) as ChatCompletionChunk;
              onChunk(parsed);
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Update metrics
      const latency = Date.now() - startTime;
      this.state.latencies.push(latency);
      this.state.successCount++;
      this.state.activeRequests--;

      // Call onDone when stream completes
      onDone();
    } catch (error) {
      this.state.errorCount++;
      this.state.activeRequests--;
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create embeddings
   * @param request Embedding request
   * @returns Promise with embedding response
   */
  async createEmbeddings(
    request: Partial<EmbeddingRequest>
  ): Promise<EmbeddingResponse> {
    // Apply defaults
    const fullRequest: EmbeddingRequest = {
      model: request.model || 'Cognis-Nova-3.0',
      input: request.input || '',
      user: request.user
    };

    return this.executeRequest<EmbeddingResponse>(
      `${this.config.baseUrl}/embeddings`,
      fullRequest
    );
  }

  /**
   * Execute an API request with retry logic and metrics tracking
   * @param url API endpoint URL
   * @param body Request body
   * @returns Promise with response
   */
  private async executeRequest<T>(url: string, body: any): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.config.maxRetries) {
      try {
        const startTime = Date.now();
        this.state.requestCount++;
        this.state.activeRequests++;
        this.state.lastRequestTime = startTime;

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          const errorData = await response.json() as ApiErrorResponse;
          throw new Error(errorData.error.message || `HTTP error ${response.status}`);
        }

        const data = await response.json() as T;

        // Update metrics
        const latency = Date.now() - startTime;
        this.state.latencies.push(latency);
        this.state.successCount++;
        this.state.activeRequests--;

        // Update token usage if available
        if ('usage' in data && typeof data.usage === 'object' && data.usage !== null) {
          const usage = data.usage as { total_tokens?: number };
          if (usage.total_tokens) {
            this.state.totalTokensUsed += usage.total_tokens;
          }
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Only retry on network errors or 5xx server errors
        const isNetworkError = error instanceof TypeError || 
                              (error instanceof Error && error.name === 'AbortError');
        const isServerError = lastError.message.includes('HTTP error 5');
        
        if (!isNetworkError && !isServerError) {
          this.state.errorCount++;
          this.state.activeRequests--;
          throw lastError;
        }
        
        retries++;
        if (retries > this.config.maxRetries) {
          this.state.errorCount++;
          this.state.activeRequests--;
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retries), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never happen due to the throw in the retry loop
    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Get request headers including API key if available
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.config.defaultHeaders
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
