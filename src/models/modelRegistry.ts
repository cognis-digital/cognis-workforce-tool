export interface ModelInfo {
  id: string;
  label: string;
  repo: string;
  size: 'fastest' | 'fast';
}

export const modelRegistry: ModelInfo[] = [
  {
    id: 'tinyllama',
    label: 'TinyLlama 1.1B (Fast)',
    repo: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    size: 'fast'
  },
  {
    id: 'qwen0.5b',
    label: 'Qwen2.5 0.5B (Fastest)',
    repo: 'Xenova/Qwen2.5-0.5B-Instruct',
    size: 'fastest'
  }
];
