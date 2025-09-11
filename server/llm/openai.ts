import { ENV } from '../util/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
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
}

export class OpenAIAdapter {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = ENV.OPENAI_API_KEY || 'sk-';
    this.apiUrl = 'https://api.openai.com/v1';
  }

  /**
   * Makes a request to the OpenAI chat completion API
   */
  async chat(options: {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }, onToken?: (token: string) => void): Promise<ChatCompletion> {
    const { model, messages, temperature = 0.7, max_tokens = 1000, stream = false } = options;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const body = JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream
    });

    if (stream && onToken) {
      return this.streamChat(model, messages, temperature, max_tokens, onToken);
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Return a fallback response
      return {
        id: 'error',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again later.'
          },
          finish_reason: 'error'
        }]
      };
    }
  }

  /**
   * Streams chat completion responses
   */
  private async streamChat(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    max_tokens: number,
    onToken: (token: string) => void
  ): Promise<ChatCompletion> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const body = JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true
    });

    let fullText = '';

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      // Process the stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim().startsWith('data:') && line.trim() !== 'data: [DONE]');

        for (const line of lines) {
          try {
            const data = JSON.parse(line.trim().substring(5));
            if (data.choices && data.choices[0]?.delta?.content) {
              const token = data.choices[0].delta.content;
              fullText += token;
              onToken(token);
            }
          } catch (e) {
            console.warn('Error parsing streaming response line:', e);
          }
        }
      }

      // Return final completion object
      return {
        id: `stream-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: fullText
          },
          finish_reason: 'stop'
        }]
      };
    } catch (error) {
      console.error('Error streaming from OpenAI:', error);
      return {
        id: 'error',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again later.'
          },
          finish_reason: 'error'
        }]
      };
    }
  }
}
