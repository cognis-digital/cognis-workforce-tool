// Cognis API integration service for knowledge processing and AI operations

export interface CognisConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
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
  private baseUrl = 'https://api.cognis.com/v1';

  constructor(apiKey?: string) {
    // Safe access to env variables with type checking
    const envApiKey = typeof import.meta === 'object' && 
      import.meta && 
      'env' in import.meta ? 
      (import.meta as any).env.VITE_COGNIS_API_KEY : undefined;
    
    this.apiKey = apiKey || envApiKey || '';
    
    if (!this.apiKey) {
      console.warn('$CGNS API key not found. Some features may not work.');
    }
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Cognis API key not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
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

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const cognisService = new CognisService();