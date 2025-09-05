export interface Tool {
  name: string;
  description: string;
  run(input: string): Promise<string>;
}

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  tools: string[];
}