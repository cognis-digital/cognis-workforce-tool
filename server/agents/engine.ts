import { Tools } from './tools';
import type { AgentConfig, ToolResult, HistoryEntry } from './schema';
import { LocalAdapter } from '../llm/local';
import { OpenAIAdapter } from '../llm/openai';
import { ENV } from '../util/env';

// Get the appropriate adapter based on environment configuration
const adapter = ENV.BACKEND === 'openai' ? new OpenAIAdapter() : new LocalAdapter();

// Tool calling pattern using tagged format: [[tool=name|input=value]]
const TOOL_PATTERN = /\[\[tool=([^|\]]+)\|input=(.+?)\]\]/;

/**
 * Run an agent with a given configuration and user input
 */
export async function runAgent(
  agent: AgentConfig, 
  userInput: string,
  onToken?: (token: string) => void
): Promise<{ response: string; history: HistoryEntry[] }> {
  // Initialize conversation history
  const history: HistoryEntry[] = [
    {
      role: 'system',
      content: agent.systemPrompt,
      timestamp: Date.now()
    },
    {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    }
  ];
  
  // Format conversation for the LLM
  const messages = history.map(h => ({
    role: h.role === 'tool' ? 'user' : h.role,
    content: h.content
  }));
  
  // Call the LLM
  const res = await adapter.chat({
    model: agent.model,
    messages,
    temperature: agent.temperature,
    max_tokens: agent.maxTokens || ENV.MAX_TOKENS,
    stream: !!onToken
  }, onToken);
  
  // Get the assistant's response
  let text = res.choices[0].message.content;
  
  // Add to history
  history.push({
    role: 'assistant',
    content: text,
    timestamp: Date.now()
  });
  
  // Check for tool calls in the response
  const toolMatch = text.match(TOOL_PATTERN);
  if (toolMatch) {
    const toolName = toolMatch[1];
    const toolInput = toolMatch[2];
    
    // Check if the tool is available and allowed for this agent
    const tool = Tools[toolName];
    if (tool && agent.tools.includes(toolName)) {
      // Execute the tool
      const toolOutput = await tool.run(toolInput);
      
      // Add tool result to history
      history.push({
        role: 'tool',
        content: `Tool "${toolName}" output:\n${toolOutput}`,
        timestamp: Date.now(),
        toolName,
        toolInput
      });
      
      // Continue the conversation with tool output
      const followupMessages = [
        ...messages,
        { role: 'assistant', content: text },
        { role: 'user', content: `Tool "${toolName}" output:\n${toolOutput}\nContinue.` }
      ];
      
      // Call LLM again with tool results
      const res2 = await adapter.chat({
        model: agent.model,
        messages: followupMessages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens || ENV.MAX_TOKENS
      });
      
      // Update text with the new response
      text = res2.choices[0].message.content;
      
      // Add to history
      history.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      });
    }
  }
  
  return { response: text, history };
}

/**
 * Create a new agent configuration
 */
export function createAgent(
  name: string,
  systemPrompt: string,
  model: string = ENV.MODEL_ID,
  temperature: number = 0.7,
  tools: string[] = []
): AgentConfig {
  return {
    id: `agent_${Date.now()}`,
    name,
    systemPrompt,
    model,
    temperature,
    tools
  };
}
