/**
 * Type definitions for Cognis API client
 */

/**
 * Chat message role
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

/**
 * Chat message object
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[];
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

/**
 * Chat completion response choice
 */
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: UsageStats;
}

/**
 * Streaming chat completion chunk
 */
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: string | null;
  }>;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  user?: string;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string | null;
  };
}

/**
 * Cognis API configuration
 */
export interface CognisApiConfig {
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
  maxRetries: number;
  timeout: number;
  defaultHeaders?: Record<string, string>;
}

/**
 * API client state for time-series integration
 */
export interface ApiClientState {
  lastRequestTime: number | null;
  requestCount: number;
  successCount: number;
  errorCount: number;
  totalTokensUsed: number;
  latencies: number[];
  activeRequests: number;
}
