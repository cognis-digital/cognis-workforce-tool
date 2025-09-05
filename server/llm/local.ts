import { pipeline, env as xenEnv } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { ENV } from '../util/env.js';
import type { LLMAdapter, ChatRequest, ChatResponse } from './adapter.js';

// Configure transformers.js environment
const cacheDir = path.resolve(ENV.MODEL_CACHE_DIR);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

xenEnv.localModelPath = cacheDir;
xenEnv.allowRemoteModels = true;
xenEnv.backends.onnx.wasm.numThreads = ENV.WASM_THREADS;

// Model cache
const modelCache = new Map<string, any>();

async function getGenerator(modelId: string) {
  if (modelCache.has(modelId)) {
    return modelCache.get(modelId);
  }
  
  console.log(`🧠 Loading model: ${modelId}...`);
  const generator = await pipeline('text-generation', modelId);
  modelCache.set(modelId, generator);
  console.log(`✅ Model loaded: ${modelId}`);
  
  return generator;
}

function joinMessages(messages: Array<{ role: string; content: string }>): string {
  return messages.map(m => {
    const prefix = m.role === 'system' ? '[SYSTEM]' : 
                   m.role === 'user' ? '[USER]' : '[ASSISTANT]';
    return `${prefix} ${m.content}`;
  }).join('\n\n') + '\n\n[ASSISTANT] ';
}

function truncateToContextWindow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(-maxLength);
}

function extractNewContent(fullOutput: string, originalPrompt: string): string {
  // Remove the original prompt and extract only the new generated content
  const assistantIndex = fullOutput.lastIndexOf('[ASSISTANT]');
  if (assistantIndex === -1) return fullOutput;
  
  const afterAssistant = fullOutput.slice(assistantIndex + '[ASSISTANT]'.length).trim();
  return afterAssistant || 'No response generated';
}

export class LocalAdapter implements LLMAdapter {
  async chat(request: ChatRequest, onToken?: (token: string) => void): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const generator = await getGenerator(request.model);
      const prompt = joinMessages(request.messages);
      const truncatedPrompt = truncateToContextWindow(prompt, ENV.CTX_WINDOW);
      
      console.log(`🔍 Generating with prompt length: ${truncatedPrompt.length} chars`);
      
      const output = await generator(truncatedPrompt, {
        max_new_tokens: request.max_tokens || ENV.MAX_TOKENS,
        temperature: request.temperature || ENV.TEMP,
        do_sample: true,
        return_full_text: true
      });
      
      let generatedText = '';
      if (Array.isArray(output)) {
        generatedText = output[0]?.generated_text || '';
      } else {
        generatedText = output.generated_text || '';
      }
      
      const responseContent = extractNewContent(generatedText, truncatedPrompt);
      
      // Simple streaming simulation
      if (onToken && responseContent) {
        const words = responseContent.split(' ');
        for (const word of words) {
          onToken(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing
        }
      }
      
      const endTime = Date.now();
      const promptTokens = Math.ceil(truncatedPrompt.length / 4);
      const completionTokens = Math.ceil(responseContent.length / 4);
      
      return {
        id: `chatcmpl-local-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(startTime / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: responseContent
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      };
    } catch (error) {
      console.error('Local LLM error:', error);
      throw new Error(`Local LLM generation failed: ${error.message}`);
    }
  }
}