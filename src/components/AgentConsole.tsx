import React, { useState } from 'react';
import { modelRegistry } from '../models/modelRegistry';

interface Props {
  onRun: (modelRepo: string, message: string, stream: boolean) => void;
}

export const AgentConsole: React.FC<Props> = ({ onRun }) => {
  const [message, setMessage] = useState('');
  const [modelRepo, setModelRepo] = useState(modelRegistry[0].repo);
  const [stream, setStream] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRun = () => {
    if (!message.trim()) return;
    setIsProcessing(true);
    onRun(modelRepo, message, stream);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4 bg-slate-800/30 p-6 rounded-xl border border-white/10">
      <select
        className="w-full bg-slate-900/40 border border-white/20 rounded-md p-2 text-white"
        value={modelRepo}
        onChange={(e) => setModelRepo(e.target.value)}
      >
        {modelRegistry.map((m) => (
          <option key={m.id} value={m.repo}>
            {m.label}
          </option>
        ))}
      </select>

      <textarea
        className="w-full h-32 bg-slate-900/40 border border-white/20 rounded-md p-3 text-white"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={stream}
            onChange={(e) => setStream(e.target.checked)}
          />
          Stream response
        </label>

        <button
          onClick={handleRun}
          disabled={isProcessing}
          className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 rounded-lg text-white disabled:opacity-50"
        >
          {isProcessing ? 'Running...' : 'Run Agent'}
        </button>
      </div>
    </div>
  );
};
