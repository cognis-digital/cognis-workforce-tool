import type { Tool } from './schema.js';

export const Tools: Record<string, Tool> = {
  echo: {
    name: 'echo',
    description: 'Echo back the input text',
    async run(input: string): Promise<string> {
      return input;
    }
  },

  httpGet: {
    name: 'httpGet',
    description: 'Fetch content from a URL',
    async run(url: string): Promise<string> {
      try {
        const response = await fetch(url);
        const text = await response.text();
        return text.slice(0, 1000) + (text.length > 1000 ? '...' : '');
      } catch (error: any) {
        return `Error fetching ${url}: ${error.message}`;
      }
    }
  },

  regex: {
    name: 'regex',
    description: 'Apply regex pattern to text (format: "text::pattern")',
    async run(input: string): Promise<string> {
      try {
        const [text, pattern] = input.split('::');
        if (!text || !pattern) {
          return 'Invalid format. Use: "text::pattern"';
        }
        
        const regex = new RegExp(pattern, 'gi');
        const matches = text.match(regex) || [];
        return matches.join('\n') || 'No matches found';
      } catch (error: any) {
        return `Regex error: ${error.message}`;
      }
    }
  }
};