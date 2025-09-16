import React, { useState } from 'react';
import { AgentConsole } from '../components/AgentConsole';
import { generate } from '../utils/llmLoader';

const LocalAgents: React.FC = () => {
  const [output, setOutput] = useState('');

  const handleRun = async (modelRepo: string, message: string, stream: boolean) => {
    setOutput('');
    try {
      if (stream) {
        await generate(modelRepo, message, (tok) => setOutput((prev) => prev + tok));
      } else {
        const full = await generate(modelRepo, message);
        setOutput(full);
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">🧠 Local AI Agents (WASM)</h2>
      <AgentConsole onRun={handleRun} />
      <pre className="bg-black/40 text-green-300 p-4 rounded-lg whitespace-pre-wrap min-h-[200px]">
        {output || 'Console output will appear here...'}
      </pre>
    </div>
  );
};

export default LocalAgents;
