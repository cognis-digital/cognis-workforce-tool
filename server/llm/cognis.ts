// Use native fetch for Node.js environments that support it
const fetch = global.fetch || require('node-fetch');
import { ENV } from '../util/env';

interface CognisRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface CognisResponse {
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

export class CognisAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ENV.COGNIS_API_KEY;
    this.baseUrl = ENV.COGNIS_API_URL || 'https://api.cognisdigital.com/v1';
    
    if (!this.apiKey) {
      console.warn('Cognis API key not found in environment. API calls will likely fail.');
    }
  }

  /**
   * Generate chat completions using Cognis API
   */
  async chat(
    request: CognisRequest,
    onToken?: (token: string) => void
  ): Promise<CognisResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      // Prepare API request
      const payload = {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        stream: !!onToken
      };

      // Handle streaming if callback provided
      if (onToken) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
        }

        // Process streaming response
        if (!response.body) throw new Error('No response body received');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        let buffer = '';
        let result: CognisResponse | null = null;
        
        // Process stream and accumulate full response
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete events in buffer
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices[0]?.delta?.content || '';
                if (token) onToken(token);
                
                // Build the complete response object
                if (!result) {
                  result = {
                    id: parsed.id,
                    object: 'chat.completion',
                    created: parsed.created,
                    model: parsed.model,
                    choices: [{
                      index: 0,
                      message: {
                        role: 'assistant',
                        content: token
                      },
                      finish_reason: ''
                    }],
                    usage: {
                      prompt_tokens: 0,
                      completion_tokens: 0,
                      total_tokens: 0
                    }
                  };
                } else {
                  result.choices[0].message.content += token;
                  if (parsed.choices[0]?.finish_reason) {
                    result.choices[0].finish_reason = parsed.choices[0].finish_reason;
                  }
                }
              } catch (err) {
                console.error('Error parsing SSE data:', err);
              }
            }
          }
        }
        
        return result || {
          id: 'stream-id',
          object: 'chat.completion',
          created: Date.now(),
          model: request.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: ''
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      }
      
      // Handle regular non-streaming request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Cognis API error:', error);
      throw new Error(`Cognis API error: ${error.message}`);
    }
  }
  
  /**
   * Generate embeddings using Cognis API
   */
  async embeddings(input: string | string[], model?: string): Promise<{
    data: Array<{
      embedding: number[];
      index: number;
    }>;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input,
          model: model || 'Cognis-Nova-3.0'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Cognis Embeddings API error:', error);
      throw new Error(`Cognis Embeddings API error: ${error.message}`);
    }
  }
}
