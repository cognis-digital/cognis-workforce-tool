import 'dotenv/config';

export type ModelProfile = 'ultraLight' | 'light' | 'medium' | 'heavy';

// Define model profiles with hardware-specific configurations
export const ModelProfiles: Record<ModelProfile, {
  modelId: string;
  ctxWindow: number;
  maxTokens: number;
  threads: number;
}> = {
  ultraLight: {
    modelId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    ctxWindow: 1024,
    maxTokens: 256,
    threads: 2,
  },
  light: {
    modelId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    ctxWindow: 1536,
    maxTokens: 384,
    threads: 4,
  },
  medium: {
    modelId: 'Xenova/Phi-3-mini-4k-instruct',
    ctxWindow: 2048,
    maxTokens: 512,
    threads: 6,
  },
  heavy: {
    modelId: 'Xenova/Phi-3-mini-4k-instruct',
    ctxWindow: 4096,
    maxTokens: 1024,
    threads: 8,
  },
};

// Environment configuration with defaults
export const ENV = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  BACKEND: process.env.BACKEND || 'cognis', // Default to 'cognis', alternatives: 'local', 'openai'
  MODEL_ID: process.env.MODEL_ID || 'Xenova/TinyLlama-1.1B-Chat-v1.0',
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS || '256', 10),
  TEMP: parseFloat(process.env.TEMP || '0.7'),
  WASM_THREADS: parseInt(process.env.WASM_THREADS || '2', 10),
  CTX_WINDOW: parseInt(process.env.CTX_WINDOW || '1024', 10),
  MODEL_CACHE_DIR: process.env.MODEL_CACHE_DIR || '.model-cache',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Cognis API configuration - we set a fallback API key for development
  COGNIS_API_KEY: process.env.COGNIS_API_KEY || 'sk-cognis-workforce-tool-dev-key-12345',
  COGNIS_API_URL: process.env.COGNIS_API_URL || 'https://api.cognisdigital.com/v1',
  COGNIS_DEFAULT_MODEL: process.env.COGNIS_DEFAULT_MODEL || 'Cognis-Zenith-4.0',
  COGNIS_TIMEOUT: parseInt(process.env.COGNIS_TIMEOUT || '30000', 10),
  COGNIS_RETRY_ATTEMPTS: parseInt(process.env.COGNIS_RETRY_ATTEMPTS || '3', 10),
  
  // Helper to get profile-specific settings
  getProfileSettings(profile: ModelProfile = 'light') {
    const config = ModelProfiles[profile];
    return {
      modelId: config.modelId,
      ctxWindow: config.ctxWindow,
      maxTokens: config.maxTokens,
      threads: config.threads,
    };
  }
};
