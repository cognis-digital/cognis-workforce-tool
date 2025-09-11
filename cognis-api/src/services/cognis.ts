import { Request, Response } from 'express';
import { COGNIS_API_KEY, COGNIS_API_URL, COGNIS_DEFAULT_MODEL } from '../config/env.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';

/**
 * Chat completion request type
 */
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Embedding request type
 */
export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

/**
 * Image generation request type
 */
export interface ImageGenerationRequest {
  prompt: string;
  n?: number;
  size?: string;
  response_format?: string;
}

/**
 * Speech request type
 */
export interface SpeechRequest {
  input: string;
  voice: string;
  response_format: string;
  speed: number;
}

/**
 * Transcription request type
 */
export interface TranscriptionRequest {
  file: any; // In a real implementation, this would be a file buffer
  language: string;
  prompt: string;
}

/**
 * Service for interacting with Cognis AI API
 */
export class CognisService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = COGNIS_API_KEY;
    this.baseUrl = COGNIS_API_URL;
    
    if (!this.apiKey) {
      logger.warn('Cognis API key not set. Using development mode.');
    }
  }
  
  /**
   * Create a chat completion
   */
  async createChatCompletion(request: ChatCompletionRequest) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: request.stream || false
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error: any) {
      logger.error({ error }, 'Error creating chat completion');
      throw error;
    }
  }
  
  /**
   * Stream a chat completion directly to the response
   */
  async streamChatCompletion(req: Request, res: Response) {
    try {
      const { model, messages, temperature, max_tokens } = req.body;
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 1000,
          stream: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Pipe the response stream directly to the client
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      
      res.end();
    } catch (error: any) {
      logger.error({ error }, 'Error streaming chat completion');
      throw error;
    }
  }
  
  /**
   * Create embeddings
   */
  async createEmbeddings(request: EmbeddingRequest) {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          input: request.input
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error: any) {
      logger.error({ error }, 'Error creating embeddings');
      throw error;
    }
  }
  
  /**
   * Generate images
   */
  async generateImage(request: ImageGenerationRequest) {
    try {
      const response = await fetch(`${this.baseUrl}/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: request.prompt,
          n: request.n || 1,
          size: request.size || '1024x1024',
          response_format: request.response_format || 'url'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error: any) {
      logger.error({ error }, 'Error generating image');
      throw error;
    }
  }
  
  /**
   * Create speech from text
   */
  async createSpeech(request: SpeechRequest) {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input: request.input,
          voice: request.voice || 'alloy',
          response_format: request.response_format || 'mp3',
          speed: request.speed || 1.0
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error: any) {
      logger.error({ error }, 'Error creating speech');
      throw error;
    }
  }
  
  /**
   * Create transcription from audio
   */
  async createTranscription(request: TranscriptionRequest) {
    try {
      // This would normally handle file uploads with FormData
      // For simplicity, we're skipping the file handling part
      
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
          // Content-Type is set automatically by fetch when using FormData
        },
        body: JSON.stringify({
          file: request.file,
          language: request.language || 'en',
          prompt: request.prompt || ''
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          response.status,
          error.error?.message || `Cognis API error: ${response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error: any) {
      logger.error({ error }, 'Error creating transcription');
      throw error;
    }
  }
  
  /**
   * Generate a mock response for chat completion
   * Used in development mode when no API key is available
   */
  handleMockChatCompletion(req: Request, res: Response) {
    const { model = COGNIS_DEFAULT_MODEL, messages, stream = false } = req.body;
    
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userContent = lastUserMessage?.content || 'Hello';
    
    // Generate a mock response
    const mockResponse = `I'm a mock Cognis AI response. You said: "${userContent}". This is a development mode response as no API key is configured.`;
    
    if (stream) {
      // Set up SSE headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Stream the response word by word
      const words = mockResponse.split(' ');
      
      // Send each word as a chunk with a delay
      let wordIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (wordIndex < words.length) {
          const chunk = {
            id: `chunk-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{
              index: 0,
              delta: {
                content: words[wordIndex] + ' '
              },
              finish_reason: null
            }]
          };
          
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          wordIndex++;
        } else {
          // Final chunk to indicate completion
          const finalChunk = {
            id: `chunk-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop'
            }]
          };
          
          res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          clearInterval(streamInterval);
        }
      }, 50);
      
      // Handle client disconnect
      req.on('close', () => {
        clearInterval(streamInterval);
      });
      
      return;
    }
    
    // Non-streaming response
    res.json({
      id: `mockgen-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: mockResponse
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: JSON.stringify(messages).length / 4,
        completion_tokens: mockResponse.length / 4,
        total_tokens: (JSON.stringify(messages).length + mockResponse.length) / 4
      }
    });
  }
  
  /**
   * Generate a mock response for embeddings
   */
  handleMockEmbeddings(req: Request, res: Response) {
    const { model = 'Cognis-Nova-3.0', input } = req.body;
    
    // Convert input to array if it's a string
    const inputs = typeof input === 'string' ? [input] : input;
    
    // Generate mock embeddings
    const mockEmbeddings = inputs.map((text, index) => {
      // Generate a consistent but random-looking embedding based on the input text
      const embedding = Array(128).fill(0).map((_, i) => {
        const seed = text.charCodeAt(i % text.length) / 255;
        return (Math.sin(seed * (i + 1)) + 1) / 2;
      });
      
      return {
        embedding,
        index
      };
    });
    
    res.json({
      object: 'list',
      data: mockEmbeddings,
      model,
      usage: {
        prompt_tokens: JSON.stringify(input).length / 4,
        total_tokens: JSON.stringify(input).length / 4
      }
    });
  }
  
  /**
   * Generate a mock response for image generation
   */
  handleMockImageGeneration(req: Request, res: Response) {
    const { prompt, n = 1, size = '1024x1024', response_format = 'url' } = req.body;
    
    // Generate mock image URLs or Base64 data
    const mockImages = Array(n).fill(0).map((_, i) => {
      if (response_format === 'url') {
        return {
          url: `https://placekitten.com/${size.split('x')[0]}/${size.split('x')[1]}?image=${i}`
        };
      } else {
        // In a real implementation, this would be actual Base64 image data
        return {
          b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };
      }
    });
    
    res.json({
      created: Math.floor(Date.now() / 1000),
      data: mockImages
    });
  }
  
  /**
   * Generate a mock response for speech synthesis
   */
  handleMockSpeech(req: Request, res: Response) {
    const { response_format = 'mp3' } = req.body;
    
    // In a real implementation, this would generate actual audio
    // For now, we'll just send a static audio file or dummy data
    
    // Set appropriate headers
    const contentType = response_format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="speech.${response_format}"`);
    
    // Send a minimal valid audio file (this is a 44-byte silent WAV file)
    const dummyAudio = Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', 'base64');
    res.send(dummyAudio);
  }
  
  /**
   * Generate a mock response for transcription
   */
  handleMockTranscription(req: Request, res: Response) {
    const { prompt = '' } = req.body;
    
    // Generate a mock transcription result
    const mockText = prompt 
      ? `This is a mock transcription with context: ${prompt}`
      : 'This is a mock transcription generated in development mode.';
      
    res.json({
      text: mockText,
      segments: [{
        id: 0,
        seek: 0,
        start: 0.0,
        end: 3.0,
        text: mockText,
        tokens: Array(mockText.split(' ').length).fill(0).map((_, i) => i),
        temperature: 0.0,
        avg_logprob: -0.5,
        compression_ratio: 1.0,
        no_speech_prob: 0.1
      }],
      language: 'en',
      duration: 3.0
    });
  }
}
