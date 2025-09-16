import { pipeline, PipelineType, Pipeline } from '@xenova/transformers';

// Cache loaded pipelines per model repo
const pipelineCache: Record<string, Pipeline> = {};

export async function getGenerationPipeline(modelRepo: string): Promise<Pipeline> {
  if (pipelineCache[modelRepo]) return pipelineCache[modelRepo];

  const storage = import.meta.env.MODEL_STORAGE_PATH || 'models';

  // Automatically downloads and caches into specified storage path using transformers.js
  const pipe = await pipeline<PipelineType>('text-generation', modelRepo, {
    quantized: true,
    progress_callback: (progress: number) => {
      console.log(`Downloading ${modelRepo}: ${(progress * 100).toFixed(2)}%`);
    },
    cache_dir: storage,
  });
  pipelineCache[modelRepo] = pipe;
  return pipe;
}

export async function generate(modelRepo: string, prompt: string, onToken?: (token: string) => void): Promise<string> {
  const pipe = await getGenerationPipeline(modelRepo);
  const generator = await pipe(prompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    stream: typeof onToken === 'function',
  });

  if (typeof onToken === 'function' && Symbol.asyncIterator in Object(generator)) {
    let result = '';
    for await (const chunk of generator as AsyncIterable<{ generated_text?: string; token?: string }>) {
      if (chunk.token) {
        result += chunk.token;
        onToken(chunk.token);
      }
    }
    return result;
  } else {
    // Non-streaming
    // @ts-ignore
    return (generator[0]?.generated_text ?? '').toString();
  }
}
