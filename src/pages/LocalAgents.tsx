import React, { useState, useEffect } from 'react';
import { AgentConsole } from '../components/AgentConsole';
import { generate, initTransformersEnvironment, checkWasmSupport } from '../models/modelLoader';
import { testWasmSupport, testWasmMemory, testOnnxRuntime } from '../utils/wasmTestUtils';

const LocalAgents: React.FC = () => {
  const [output, setOutput] = useState('');
  const [wasmSupport, setWasmSupport] = useState<{supported: boolean; reason?: string} | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [wasmDiagnostics, setWasmDiagnostics] = useState<{
    wasmTest: {success: boolean; message: string} | null;
    onnxTest: {success: boolean; message: string} | null;
  }>({ wasmTest: null, onnxTest: null });

  useEffect(() => {
    // Check WASM support and initialize environment on component mount
    const init = async () => {
      try {
        setIsInitializing(true);
        setOutput('⏳ Testing WASM environment...');
        
        // Basic WASM support check
        const supportDetails = testWasmSupport();
        const support = checkWasmSupport();
        setWasmSupport(support);
        
        // Detailed testing
        if (supportDetails.supported) {
          setOutput(prev => `${prev}\n✓ Basic WASM support detected\n- Features: ${Object.entries(supportDetails.features)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(', ')}`);
          
          // Test WASM memory
          const memoryTest = await testWasmMemory();
          setWasmDiagnostics(prev => ({ ...prev, wasmTest: memoryTest }));
          setOutput(prev => `${prev}\n${memoryTest.success ? '✓' : '❌'} Memory test: ${memoryTest.message}`);
          
          // Test ONNX Runtime
          try {
            const onnxTest = await testOnnxRuntime();
            setWasmDiagnostics(prev => ({ ...prev, onnxTest }));
            setOutput(prev => `${prev}\n${onnxTest.success ? '✓' : '❌'} ONNX test: ${onnxTest.message}`);
          } catch (onnxErr: any) {
            setOutput(prev => `${prev}\n❌ ONNX test failed: ${onnxErr.message}`);
          }
          
          // Initialize transformers environment
          if (support.supported) {
            await initTransformersEnvironment();
            setOutput(prev => `${prev}\n\n✅ Environment ready for September 16th deployment`);
          }
        } else {
          setOutput(`⚠️ WebAssembly not fully supported: ${support.reason}\n${supportDetails.message}`);
        }
      } catch (err: any) {
        setOutput(prev => `${prev}\n\n❌ Error initializing WASM: ${err.message}`);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, []);

  const handleRun = async (modelRepo: string, message: string, stream: boolean) => {
    setOutput(prev => `${prev}\n\n⏳ Running ${modelRepo}...`);
    try {
      if (stream) {
        // For streaming, we append tokens
        setOutput(''); // Clear first
        await generate(modelRepo, message, (tok) => setOutput((prev) => prev + tok));
      } else {
        // For non-streaming, we show the full result at once
        setOutput('⏳ Processing...');
        const full = await generate(modelRepo, message);
        setOutput(full);
      }
    } catch (e: any) {
      setOutput(`❌ Error: ${e.message}`);
      console.error('Model execution error:', e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🧠 Local AI Agents (WASM)</h2>
        <div className="text-sm text-white bg-blue-900/50 px-2 py-1 rounded">
          Ready for Sept 16, 2025
        </div>
      </div>
      
      {wasmSupport?.supported === false ? (
        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg">
          <h3 className="font-bold">WebAssembly Support Issue</h3>
          <p>{wasmSupport.reason}</p>
          <p className="mt-2">This feature requires WebAssembly support in your browser.</p>
          <p className="mt-2 text-yellow-300">Fix needed before September 16th deployment!</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4 text-sm text-white">
            <div className={`px-3 py-1 rounded ${wasmDiagnostics.wasmTest?.success ? 'bg-green-900/50' : wasmDiagnostics.wasmTest === null ? 'bg-gray-700/50' : 'bg-red-900/50'}`}>
              WASM: {wasmDiagnostics.wasmTest?.success ? 'Ready ✓' : wasmDiagnostics.wasmTest === null ? 'Testing...' : 'Issue ❌'}
            </div>
            <div className={`px-3 py-1 rounded ${wasmDiagnostics.onnxTest?.success ? 'bg-green-900/50' : wasmDiagnostics.onnxTest === null ? 'bg-gray-700/50' : 'bg-red-900/50'}`}>
              ONNX: {wasmDiagnostics.onnxTest?.success ? 'Ready ✓' : wasmDiagnostics.onnxTest === null ? 'Testing...' : 'Issue ❌'}
            </div>
          </div>
          <AgentConsole onRun={handleRun} disabled={isInitializing} />
          <pre className="bg-black/40 text-green-300 p-4 rounded-lg whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto">
            {isInitializing ? 'Initializing WASM environment...' : output || 'Console output will appear here...'}
          </pre>
        </>
      )}
    </div>
  );
};

export default LocalAgents;
