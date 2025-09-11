/**
 * API client for interacting with the local LLM server
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

export type ChatResponse = {
  id: string;
  object: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
};

/**
 * Send a chat completion request to the local API
 */
export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} ${error}`);
  }
  
  return await response.json();
}

/**
 * Create a streaming chat request with event handling
 */
export function streamChat(
  req: ChatRequest, 
  onToken: (token: string) => void, 
  onComplete: () => void,
  onError: (error: Error) => void
) {
  // Create EventSource for server-sent events
  const eventSource = new EventSource(
    `/api/v1/chat/completions?${new URLSearchParams({
      stream: 'true',
      model: req.model,
      messages: JSON.stringify(req.messages),
      ...(req.temperature ? { temperature: req.temperature.toString() } : {}),
      ...(req.max_tokens ? { max_tokens: req.max_tokens.toString() } : {})
    })}`
  );
  
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      onComplete();
      return;
    }
    
    try {
      const data = JSON.parse(event.data);
      const token = data.choices[0]?.delta?.content || '';
      if (token) {
        onToken(token);
      }
    } catch (error) {
      console.error('Error parsing streaming response:', error);
    }
  };
  
  // Handle errors
  eventSource.onerror = (error) => {
    eventSource.close();
    onError(new Error('Stream error'));
  };
  
  // Return a function to close the connection
  return () => {
    eventSource.close();
  };
}
