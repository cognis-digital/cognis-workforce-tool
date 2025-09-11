import type { Tool } from './schema';
import { fetch } from 'undici';

// Collection of tools available to agents
export const Tools: Record<string, Tool> = {
  // Simple echo tool for testing
  echo: { 
    name: 'echo', 
    description: 'Echo the input text back', 
    run: async (input: string) => input 
  },
  
  // HTTP GET tool to fetch web content
  httpGet: { 
    name: 'httpGet', 
    description: 'Fetch content from a URL using HTTP GET', 
    run: async (url: string) => {
      try {
        // Add protocol if not specified
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          return `Error: HTTP ${response.status} ${response.statusText}`;
        }
        
        return await response.text();
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    } 
  },
  
  // Regex extraction tool
  regex: { 
    name: 'regex', 
    description: 'Extract text using regex pattern (format: "text::pattern")', 
    run: async (input: string) => {
      try {
        const [text, pattern] = input.split('::');
        if (!text || !pattern) {
          return 'Error: Invalid input format. Use "text::pattern"';
        }
        
        const regex = new RegExp(pattern, 'g');
        const matches = text.match(regex);
        
        return matches ? matches.join('\n') : 'No matches found';
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },
  
  // Simple math expression evaluator
  calculate: {
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    run: async (expression: string) => {
      try {
        // Safety check - only allow basic arithmetic
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
          return 'Error: Invalid expression. Only basic arithmetic allowed.';
        }
        
        // Use Function constructor but with strict input validation
        const result = new Function(`return ${expression}`)();
        return result.toString();
      } catch (error: any) {
        return `Error: ${error.message}`;
      }
    }
  },
  
  // Current date and time
  datetime: {
    name: 'datetime',
    description: 'Get the current date and time',
    run: async (format: string = 'full') => {
      const now = new Date();
      
      switch (format.toLowerCase()) {
        case 'date':
          return now.toLocaleDateString();
        case 'time':
          return now.toLocaleTimeString();
        case 'iso':
          return now.toISOString();
        case 'unix':
          return Math.floor(now.getTime() / 1000).toString();
        case 'full':
        default:
          return now.toString();
      }
    }
  },
};
