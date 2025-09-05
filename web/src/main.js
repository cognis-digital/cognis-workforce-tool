// Event system
const registry = {};

function register(action, handler) {
  registry[action] = handler;
}

function wire(root = document) {
  const elements = root.querySelectorAll('[data-action]:not([data-wired])');
  elements.forEach(el => {
    const action = el.getAttribute('data-action');
    if (registry[action]) {
      el.addEventListener('click', () => registry[action](el));
      el.setAttribute('data-wired', 'true');
    }
  });
}

// Chat client
async function chat(request) {
  const response = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }
  
  return response.json();
}

async function chatStream(request, onToken) {
  const response = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...request, stream: true })
  });
  
  if (!response.ok) {
    throw new Error('Stream request failed');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onToken(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Agent definitions
const agents = {
  helper: {
    id: 'helper',
    name: 'AI Helper',
    systemPrompt: 'You are a helpful AI assistant. Be concise and practical in your responses.',
    model: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    temperature: 0.7,
    tools: ['echo', 'httpGet']
  },
  analyst: {
    id: 'analyst',
    name: 'Data Analyst',
    systemPrompt: 'You are a data analyst. Provide insights and analysis. When useful, you can extract patterns using regex tools.',
    model: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    temperature: 0.4,
    tools: ['regex', 'echo']
  },
  writer: {
    id: 'writer',
    name: 'Content Writer',
    systemPrompt: 'You are a creative content writer. Generate engaging, well-structured content.',
    model: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    temperature: 0.8,
    tools: ['echo']
  }
};

// UI State
let currentAgent = agents.helper;
let isProcessing = false;

// Event handlers
register('agent:run', async (el) => {
  if (isProcessing) return;
  
  const userInput = document.getElementById('userInput').value.trim();
  if (!userInput) {
    alert('Please enter a message');
    return;
  }
  
  const console = document.getElementById('console');
  const runButton = document.getElementById('runButton');
  const agentSelect = document.getElementById('agentSelect');
  const modelSelect = document.getElementById('modelSelect');
  
  isProcessing = true;
  runButton.disabled = true;
  runButton.textContent = '🔄 Processing...';
  console.textContent = 'Agent is thinking...\n';
  
  try {
    // Get current agent and model
    const selectedAgentId = agentSelect.value;
    currentAgent = { ...agents[selectedAgentId], model: modelSelect.value };
    
    const response = await chat({
      model: currentAgent.model,
      messages: [
        { role: 'system', content: currentAgent.systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: currentAgent.temperature,
      max_tokens: 512
    });
    
    const assistantMessage = response.choices[0]?.message?.content || 'No response';
    console.textContent = `🤖 ${currentAgent.name}:\n${assistantMessage}\n\n📊 Tokens: ${response.usage?.total_tokens || 0}`;
    
  } catch (error) {
    console.textContent = `❌ Error: ${error.message}`;
  } finally {
    isProcessing = false;
    runButton.disabled = false;
    runButton.innerHTML = '🚀 Run Agent';
  }
});

register('agent:stream', async (el) => {
  if (isProcessing) return;
  
  const userInput = document.getElementById('userInput').value.trim();
  if (!userInput) {
    alert('Please enter a message');
    return;
  }
  
  const console = document.getElementById('console');
  const streamButton = document.getElementById('streamButton');
  const agentSelect = document.getElementById('agentSelect');
  const modelSelect = document.getElementById('modelSelect');
  
  isProcessing = true;
  streamButton.disabled = true;
  streamButton.textContent = '⚡ Streaming...';
  console.textContent = `🤖 ${currentAgent.name} (streaming):\n`;
  
  try {
    const selectedAgentId = agentSelect.value;
    currentAgent = { ...agents[selectedAgentId], model: modelSelect.value };
    
    await chatStream({
      model: currentAgent.model,
      messages: [
        { role: 'system', content: currentAgent.systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: currentAgent.temperature,
      max_tokens: 512
    }, (token) => {
      console.textContent += token;
      console.scrollTop = console.scrollHeight;
    });
    
  } catch (error) {
    console.textContent += `\n\n❌ Stream Error: ${error.message}`;
  } finally {
    isProcessing = false;
    streamButton.disabled = false;
    streamButton.innerHTML = '⚡ Stream Response';
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  wire();
  
  // Update status
  const status = document.getElementById('status');
  status.textContent = '✅ Local AI system ready';
  status.style.background = 'rgba(34, 197, 94, 0.2)';
  
  console.log('🧠 Cognis Digital Local AI Agents initialized');
});

// Handle model changes
document.addEventListener('change', (e) => {
  if (e.target.id === 'modelSelect') {
    const status = document.getElementById('status');
    status.textContent = `🧠 Model: ${e.target.value}`;
  }
});