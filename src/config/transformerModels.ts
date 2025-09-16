/**
 * Configuration for local WASM-based transformer models
 * These models will be loaded and run directly in the browser
 */

export interface TransformerModelConfig {
  id: string;
  name: string;
  description: string;
  merkleRoot: string;
  path: string; // Path to the model file or directory
  config: {
    vocabSize: number;
    dModel: number;
    nLayers: number;
    nHeads: number;
    maxLen: number;
  };
  metadata: {
    format: 'onnx' | 'transformers.js';
    sizeKB: number;
    quantized: boolean;
    supportsTraining: boolean;
    publishDate: string;
  };
}

/**
 * Available transformer models for client-side execution
 */
export const availableModels: TransformerModelConfig[] = [
  {
    id: 'cognis-tiny-transformer',
    name: 'Cognis Tiny Transformer',
    description: 'Lightweight transformer for text processing (4 layers, 256d)',
    merkleRoot: '0xc3a456b291def7890abcde12345678901234567890abcdef1234567890abcde',
    path: '/models/transformers/cognis-tiny-transformer/model.onnx',
    config: {
      vocabSize: 16000,
      dModel: 256,
      nLayers: 4,
      nHeads: 4,
      maxLen: 256
    },
    metadata: {
      format: 'onnx',
      sizeKB: 5120,
      quantized: true,
      supportsTraining: false,
      publishDate: '2025-08-01'
    }
  },
  {
    id: 'cognis-small-transformer',
    name: 'Cognis Small Transformer',
    description: 'Small general-purpose transformer model (6 layers, 512d)',
    merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde',
    path: '/models/transformers/cognis-small-transformer/model.onnx',
    config: {
      vocabSize: 32000,
      dModel: 512,
      nLayers: 6,
      nHeads: 8,
      maxLen: 512
    },
    metadata: {
      format: 'onnx',
      sizeKB: 28672,
      quantized: true,
      supportsTraining: false,
      publishDate: '2025-08-01'
    }
  },
  {
    id: 'cognis-research-assistant',
    name: 'Cognis Research Assistant',
    description: 'Research-focused transformer with enhanced summarization (8 layers, 768d)',
    merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    path: '/models/transformers/cognis-research-assistant/model.onnx',
    config: {
      vocabSize: 32000,
      dModel: 768,
      nLayers: 8,
      nHeads: 12,
      maxLen: 1024
    },
    metadata: {
      format: 'onnx',
      sizeKB: 98304,
      quantized: true,
      supportsTraining: false,
      publishDate: '2025-08-15'
    }
  }
];

/**
 * Default model ID to load
 */
export const defaultModelId = 'cognis-tiny-transformer';

/**
 * Get model configuration by ID
 */
export function getModelById(modelId: string): TransformerModelConfig | undefined {
  return availableModels.find(model => model.id === modelId);
}

/**
 * Base path for transformer model storage
 */
export const MODELS_BASE_PATH = '/models/transformers';

/**
 * Maximum concurrent models to keep in memory
 */
export const MAX_CONCURRENT_MODELS = 2;
