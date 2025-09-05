import { LocalAdapter } from '../llm/local.js';
import { Tools } from './tools.js';
import type { AgentConfig } from './schema.js';

const adapter = new LocalAdapter();

export async function runAgent(agent: AgentConfig, userInput: string): Promise<string> {
  try {
    const systemMessage = { role: 'system' as const, content: agent.systemPrompt };
    const userMessage = { role: 'user' as const, content: userInput };
    
    // Initial LLM call
    const response1 = await adapter.chat({
      model: agent.model,
      messages: [systemMessage, userMessage],
      temperature: agent.temperature,
      max_tokens: 512
    });
    
    let text = response1.choices[0]?.message?.content || '';
    
    // Check for tool calls using pattern: [[tool=name|input=...]]
    const toolMatch = text.match(/\[\[tool=([^|\]]+)\|input=(.+?)\]\]/);
    
    if (toolMatch) {
      const [, toolName, toolInput] = toolMatch;
      const tool = Tools[toolName];
      
      if (tool) {
        console.log(`🔧 Running tool: ${toolName} with input: ${toolInput}`);
        
        try {
          const toolOutput = await tool.run(toolInput);
          
          // Continue conversation with tool output
          const response2 = await adapter.chat({
            model: agent.model,
            messages: [
              systemMessage,
              userMessage,
              { role: 'assistant', content: text },
              { role: 'user', content: `Tool "${tool.name}" output:\n${toolOutput}\nContinue.` }
            ],
            temperature: agent.temperature,
            max_tokens: 512
          });
          
          text = response2.choices[0]?.message?.content || text;
        } catch (toolError) {
          console.error(`Tool ${toolName} error:`, toolError);
          text += `\n\nTool error: ${toolError.message}`;
        }
      } else {
        text += `\n\nUnknown tool: ${toolName}`;
      }
    }
    
    return text;
  } catch (error) {
    console.error('Agent execution error:', error);
    throw error;
  }
}