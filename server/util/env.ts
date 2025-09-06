import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '8080'),
  BACKEND: process.env.BACKEND || 'local',
  MODEL_ID: process.env.MODEL_ID || 'Xenova/TinyLlama-1.1B-Chat-v1.0',
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS || '256'),
  TEMP: parseFloat(process.env.TEMP || '0.7'),
  WASM_THREADS: parseInt(process.env.WASM_THREADS || '2'),
  CTX_WINDOW: parseInt(process.env.CTX_WINDOW || '1024'),
  MODEL_CACHE_DIR: process.env.MODEL_CACHE_DIR || '.model-cache',
  COGNIS_API_KEY: process.env.COGNIS_API_KEY || ''
};

console.log('🔧 Environment loaded:', {
  backend: ENV.BACKEND,
  model: ENV.MODEL_ID,
  maxTokens: ENV.MAX_TOKENS,
  temperature: ENV.TEMP,
  threads: ENV.WASM_THREADS,
  contextWindow: ENV.CTX_WINDOW
});