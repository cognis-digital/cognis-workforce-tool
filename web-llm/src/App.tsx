import React, { useEffect, useState, useRef } from 'react';
import { useAgents, createDefaultAgent } from './state/agents';
import { wire, register } from './lib/events';
import { chat, ChatMessage } from './lib/client';

// CSS styles for the application
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    marginBottom: '20px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '20px',
  },
  sidebar: {
    backgroundColor: '#f0f0f0',
    padding: '15px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  agentCard: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #ddd',
  },
  agentCardSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #d9d9d9',
    marginBottom: '10px',
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    width: '100%',
    height: '120px',
    borderRadius: '4px',
    border: '1px solid #d9d9d9',
    marginBottom: '10px',
    resize: 'vertical' as const,
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '0 5px 5px 0',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    color: '#000',
    border: '1px solid #d9d9d9',
  },
  buttonDanger: {
    backgroundColor: '#ff4d4f',
  },
  console: {
    backgroundColor: '#282c34',
    color: '#abb2bf',
    fontFamily: 'monospace',
    padding: '15px',
    borderRadius: '4px',
    minHeight: '200px',
    whiteSpace: 'pre-wrap' as const,
    overflowY: 'auto' as const,
    maxHeight: '400px',
  },
  modelSelect: {
    marginBottom: '10px',
    width: '100%',
    padding: '8px',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    marginLeft: '5px',
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
  },
};

// Available model configurations
const modelOptions = [
  { id: 'Xenova/TinyLlama-1.1B-Chat-v1.0', name: 'TinyLlama 1.1B (Fast)', profile: 'ultraLight' },
  { id: 'Xenova/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini 4K (Balanced)', profile: 'medium' }
];

// Available tools
const availableTools = [
  { id: 'echo', name: 'Echo', description: 'Echo the input back' },
  { id: 'httpGet', name: 'HTTP Get', description: 'Fetch content from a URL' },
  { id: 'regex', name: 'Regex', description: 'Extract text using regex pattern' },
  { id: 'calculate', name: 'Calculate', description: 'Evaluate a math expression' },
  { id: 'datetime', name: 'Date & Time', description: 'Get current date/time' }
];

export default function App() {
  // Get agent state from store
  const { 
    agents, 
    selectedAgentId, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    selectAgent, 
    getSelectedAgent 
  } = useAgents();
  
  // Local state
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('Xenova/TinyLlama-1.1B-Chat-v1.0');
  const [newAgentTemp, setNewAgentTemp] = useState(0.7);
  const [selectedTools, setSelectedTools] = useState<string[]>(['echo', 'datetime']);
  
  // Refs
  const consoleRef = useRef<HTMLPreElement>(null);
  
  // Initialize with default agent if none exist
  useEffect(() => {
    if (agents.length === 0) {
      const defaultAgent = createDefaultAgent();
      addAgent(defaultAgent);
    }
    
    // Initialize UI event bindings
    wire();
    
    // Clean up event bindings
    return () => {
      // Clean up could be implemented if needed
    };
  }, []);
  
  // Scroll console to bottom when content changes
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);
  
  // Register event handlers
  useEffect(() => {
    // Run the agent with current input
    register('agent:run', async () => {
      await runAgent();
    });
    
    // Plan execution with step-by-step approach
    register('agent:plan', async () => {
      const selectedAgent = getSelectedAgent();
      if (!selectedAgent) return;
      
      setIsProcessing(true);
      setConsoleOutput('Planning approach...\n\n');
      
      try {
        const planPrompt = `I need to accomplish this task: ${userInput}\n\nCreate a step-by-step plan to solve this problem.`;
        
        const response = await chat({
          model: selectedAgent.model,
          messages: [
            { role: 'system', content: 'You are a planning assistant. Create clear, concise plans with numbered steps.' },
            { role: 'user', content: planPrompt }
          ],
          temperature: 0.3 // Lower temperature for planning
        });
        
        setConsoleOutput(prev => prev + response.choices[0].message.content);
      } catch (error: any) {
        setConsoleOutput(prev => prev + `\nError: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    });
    
    // Execute a specific step or task
    register('agent:execute', async () => {
      if (!userInput.trim()) {
        setConsoleOutput('Please enter a specific task to execute.');
        return;
      }
      
      await runAgent(true); // Execute with more structured approach
    });
    
    // Create a new agent
    register('agent:create', () => {
      if (!newAgentName.trim() || !newAgentPrompt.trim()) {
        return; // Validation failed
      }
      
      const newAgent = {
        id: `agent_${Date.now()}`,
        name: newAgentName,
        systemPrompt: newAgentPrompt,
        model: newAgentModel,
        temperature: newAgentTemp,
        tools: selectedTools,
      };
      
      addAgent(newAgent);
      setShowAgentForm(false);
      resetAgentForm();
    });
    
    // Delete selected agent
    register('agent:delete', () => {
      if (selectedAgentId && agents.length > 1) {
        deleteAgent(selectedAgentId);
      }
    });
    
    // Update agent settings
    register('agent:update', () => {
      if (!selectedAgentId) return;
      
      updateAgent(selectedAgentId, {
        name: newAgentName || getSelectedAgent()?.name,
        systemPrompt: newAgentPrompt || getSelectedAgent()?.systemPrompt,
        model: newAgentModel,
        temperature: newAgentTemp,
        tools: selectedTools
      });
      
      setShowAgentForm(false);
    });
    
    // Cancel agent form
    register('agent:cancel', () => {
      setShowAgentForm(false);
      resetAgentForm();
    });
    
    // Edit selected agent
    register('agent:edit', () => {
      const agent = getSelectedAgent();
      if (!agent) return;
      
      setNewAgentName(agent.name);
      setNewAgentPrompt(agent.systemPrompt);
      setNewAgentModel(agent.model);
      setNewAgentTemp(agent.temperature);
      setSelectedTools(agent.tools);
      setShowAgentForm(true);
    });
    
    // Toggle tool selection
    register('tool:toggle', (el) => {
      const toolId = el.dataset.toolId;
      if (!toolId) return;
      
      setSelectedTools(prev => {
        if (prev.includes(toolId)) {
          return prev.filter(id => id !== toolId);
        } else {
          return [...prev, toolId];
        }
      });
    });
  }, [
    userInput, 
    selectedAgentId, 
    newAgentName, 
    newAgentPrompt, 
    newAgentModel, 
    newAgentTemp,
    selectedTools
  ]);
  
  // Run the selected agent
  const runAgent = async (isExecute = false) => {
    const selectedAgent = getSelectedAgent();
    if (!selectedAgent || !userInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setConsoleOutput('');
    
    try {
      // Adjust system prompt based on mode
      let effectivePrompt = selectedAgent.systemPrompt;
      if (isExecute) {
        effectivePrompt = `${effectivePrompt}\nFocus on direct execution of the specific task. If you need to use tools, use the format [[tool=toolname|input=value]].`;
      }
      
      // Build messages
      const messages: ChatMessage[] = [
        { role: 'system', content: effectivePrompt },
        { role: 'user', content: userInput }
      ];
      
      // Send to API
      const response = await chat({
        model: selectedAgent.model,
        messages,
        temperature: selectedAgent.temperature,
      });
      
      // Output results
      setConsoleOutput(response.choices[0].message.content);
      
      // Check for tool calls and handle them
      const toolPattern = /\[\[tool=([^|\]]+)\|input=(.+?)\]\]/;
      const toolMatch = response.choices[0].message.content.match(toolPattern);
      
      if (toolMatch && selectedAgent.tools.includes(toolMatch[1])) {
        // Tool call detected - send followup request
        setConsoleOutput(prev => prev + '\n\nExecuting tool call...');
        
        const toolName = toolMatch[1];
        const toolInput = toolMatch[2];
        
        // Simulate tool execution on the frontend
        let toolOutput = '';
        if (toolName === 'echo') {
          toolOutput = toolInput;
        } else if (toolName === 'datetime') {
          toolOutput = new Date().toString();
        } else {
          toolOutput = `(Tool execution for ${toolName} would happen on the server)`;
        }
        
        setConsoleOutput(prev => prev + `\n\nTool "${toolName}" output:\n${toolOutput}\n\nContinuing...\n`);
        
        // Make followup request with tool output
        const followupMessages = [
          ...messages,
          { role: 'assistant', content: response.choices[0].message.content },
          { role: 'user', content: `Tool "${toolName}" output:\n${toolOutput}\nContinue.` }
        ];
        
        const followupResponse = await chat({
          model: selectedAgent.model,
          messages: followupMessages,
          temperature: selectedAgent.temperature,
        });
        
        setConsoleOutput(prev => prev + '\n' + followupResponse.choices[0].message.content);
      }
    } catch (error: any) {
      setConsoleOutput(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset agent form
  const resetAgentForm = () => {
    setNewAgentName('');
    setNewAgentPrompt('');
    setNewAgentModel('Xenova/TinyLlama-1.1B-Chat-v1.0');
    setNewAgentTemp(0.7);
    setSelectedTools(['echo', 'datetime']);
  };
  
  // Get selected agent
  const selectedAgent = getSelectedAgent();
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🧠 Local LLM Agent System</h1>
        <p>Powered by transformers.js WASM - 100% in-browser inference</p>
      </div>
      
      <div style={styles.mainGrid}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <h2>Agents</h2>
          
          {/* Agent list */}
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {agents.map(agent => (
              <div 
                key={agent.id}
                onClick={() => selectAgent(agent.id)}
                style={{
                  ...styles.agentCard,
                  ...(agent.id === selectedAgentId ? styles.agentCardSelected : {})
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{agent.name}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {agent.tools.length} tools • {agent.temperature.toFixed(1)} temp
                </div>
              </div>
            ))}
          </div>
          
          {/* Agent actions */}
          <div>
            <button 
              style={styles.button} 
              onClick={() => {
                resetAgentForm();
                setShowAgentForm(true);
              }}
            >
              New Agent
            </button>
            
            {selectedAgentId && (
              <>
                <button 
                  data-action="agent:edit"
                  style={{...styles.button, ...styles.buttonSecondary}}
                >
                  Edit
                </button>
                
                {agents.length > 1 && (
                  <button 
                    data-action="agent:delete"
                    style={{...styles.button, ...styles.buttonDanger}}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Agent form */}
          {showAgentForm && (
            <div style={{ marginTop: '15px' }}>
              <h3>{selectedAgentId ? 'Edit Agent' : 'New Agent'}</h3>
              
              <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
              <input
                type="text"
                style={styles.input}
                value={newAgentName}
                onChange={e => setNewAgentName(e.target.value)}
                placeholder="Agent name"
              />
              
              <label style={{ display: 'block', marginBottom: '5px' }}>System Prompt</label>
              <textarea
                style={styles.textarea}
                value={newAgentPrompt}
                onChange={e => setNewAgentPrompt(e.target.value)}
                placeholder="System prompt for the agent"
              />
              
              <label style={{ display: 'block', marginBottom: '5px' }}>Model</label>
              <select
                style={styles.modelSelect}
                value={newAgentModel}
                onChange={e => setNewAgentModel(e.target.value)}
              >
                {modelOptions.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Temperature: {newAgentTemp.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={newAgentTemp}
                onChange={e => setNewAgentTemp(parseFloat(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />
              
              <label style={{ display: 'block', marginBottom: '5px' }}>Tools</label>
              <div style={{ marginBottom: '15px' }}>
                {availableTools.map(tool => (
                  <div key={tool.id} style={{ marginBottom: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool.id)}
                        onChange={() => {}}
                        data-action="tool:toggle"
                        data-tool-id={tool.id}
                      />
                      <span style={{ marginLeft: '5px' }}>{tool.name}</span>
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>
                        - {tool.description}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              <div>
                <button
                  data-action={selectedAgentId ? 'agent:update' : 'agent:create'}
                  style={styles.button}
                >
                  {selectedAgentId ? 'Update' : 'Create'}
                </button>
                
                <button
                  data-action="agent:cancel"
                  style={{...styles.button, ...styles.buttonSecondary}}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div style={styles.content}>
          {/* Current agent info */}
          {selectedAgent && (
            <div style={{ marginBottom: '20px' }}>
              <h2>
                {selectedAgent.name}
                <span style={styles.badge}>
                  {modelOptions.find(m => m.id === selectedAgent.model)?.profile || 'custom'}
                </span>
              </h2>
              <p style={{ color: '#666' }}>{selectedAgent.systemPrompt}</p>
            </div>
          )}
          
          {/* Input area */}
          <div>
            <textarea
              style={styles.textarea}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Enter your message or task..."
              rows={4}
            />
            
            <button
              data-action="agent:run"
              style={styles.button}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span style={styles.loadingSpinner}></span> Processing...
                </>
              ) : (
                'Run'
              )}
            </button>
            
            <button
              data-action="agent:plan"
              style={{...styles.button, ...styles.buttonSecondary}}
              disabled={isProcessing}
            >
              Plan
            </button>
            
            <button
              data-action="agent:execute"
              style={{...styles.button, ...styles.buttonSecondary}}
              disabled={isProcessing}
            >
              Execute
            </button>
          </div>
          
          {/* Console output */}
          <div>
            <h3>Output</h3>
            <pre 
              ref={consoleRef}
              style={styles.console}
            >
              {consoleOutput || 'Output will appear here...'}
            </pre>
          </div>
        </div>
      </div>
      
      {/* Add some global styles */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
