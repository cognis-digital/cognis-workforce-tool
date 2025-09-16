/**
 * Enhanced model loader with error handling and safe initialization
 */
import { env, pipeline, PipelineType, Pipeline } from '@xenova/transformers';

// Configure the environment
env.allowLocalModels = true;
env.backends.onnx.wasm.numThreads = 1;
env.useBrowserCache = true;

// Cache loaded pipelines per model repo
const pipelineCache: Record<string, Promise<Pipeline>> = {};

/**
 * Safely get a generation pipeline with proper error handling
 */
export async function getGenerationPipeline(modelRepo: string): Promise<Pipeline> {
  // Use cache if available
  if (pipelineCache[modelRepo]) {
    return pipelineCache[modelRepo];
  }

  // Get storage path from environment or use default
  const storage = 'models';
  
  // Create a promise that will resolve when the pipeline is loaded
  const pipelinePromise = new Promise<Pipeline>(async (resolve, reject) => {
    try {
      // Configure progress tracking
      const progress_callback = (progress: number) => {
        console.log(`Loading ${modelRepo}: ${(progress * 100).toFixed(2)}%`);
      };

      // Safely initialize pipeline with error handling
      const pipe = await pipeline<PipelineType>('text-generation', modelRepo, {
        quantized: true,
        progress_callback,
        cache_dir: storage,
        revision: 'main'
      }) as unknown as Pipeline;
      
      resolve(pipe);
    } catch (error) {
      console.error(`Failed to load model ${modelRepo}:`, error);
      reject(error);
    }
  });
  
  // Store in cache even before resolved
  pipelineCache[modelRepo] = pipelinePromise;
  
  return pipelinePromise;
}

/**
 * Generate text with error handling
 */
export async function generate(modelRepo: string, prompt: string, onToken?: (token: string) => void): Promise<string> {
  try {
    const pipe = await getGenerationPipeline(modelRepo);
    
    const generator = await pipe(prompt, {
      max_new_tokens: 512,
      temperature: 0.7,
      top_p: 0.95,
      stream: !!onToken,
      repetition_penalty: 1.1,
    });

    if (onToken && Symbol.asyncIterator in Object(generator)) {
      let result = '';
      try {
        for await (const chunk of generator as AsyncIterable<{ generated_text?: string; token?: string }>) {
          if (chunk.token) {
            result += chunk.token;
            onToken(chunk.token);
          }
        }
      } catch (e) {
        console.error("Streaming error:", e);
        onToken("\n[Error during streaming]");
      }
      return result;
    } else {
      // Non-streaming
      const output = generator[0]?.generated_text ?? '';
      return output.toString();
    }
  } catch (error) {
    console.error(`Generation error with ${modelRepo}:`, error);
    throw new Error(`Model error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if WebAssembly is supported
 */
export function checkWasmSupport(): { supported: boolean; reason?: string } {
  // Check if WebAssembly is supported
  if (typeof WebAssembly !== 'object') {
    return { supported: false, reason: 'WebAssembly not available in this browser' };
  }

  // Check for SharedArrayBuffer support (needed for threading)
  if (typeof SharedArrayBuffer !== 'function') {
    return { 
      supported: true, 
      reason: 'SharedArrayBuffer not available - multithreading disabled' 
    };
  }

  return { supported: true };
}

/**
 * Initialize transformers.js environment
 */
export async function initTransformersEnvironment(): Promise<void> {
  try {
    const wasmSupport = checkWasmSupport();
    
    if (!wasmSupport.supported) {
      console.warn('WebAssembly not supported:', wasmSupport.reason);
      return;
    }
    
    // Configure optimal settings based on device
    const cpuCount = navigator.hardwareConcurrency || 1;
    env.backends.onnx.wasm.numThreads = Math.min(cpuCount - 1, 4);
    
    console.log('Transformers.js environment initialized');
  } catch (error) {
    console.error('Failed to initialize transformers environment:', error);
  }
}
