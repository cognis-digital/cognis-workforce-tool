import React, { useState, useEffect, useRef } from 'react';
import { cognisBackend } from '../services/cognisBackend';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Demo component for Cognis API Backend integration
 * Showcases chat completions functionality with streaming support
 */
const CognisApiDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [apiStatus, setApiStatus] = useState<{
    status: string;
    configured: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth();
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedResponse]);

  const checkApiHealth = async () => {
    try {
      const health = await cognisBackend.checkHealth();
      setApiStatus(health);
    } catch (error) {
      console.error('Error checking API health:', error);
      setApiStatus({
        status: 'error',
        configured: false
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    
    // Start loading
    setIsLoading(true);
    
    try {
      // Send to API
      const chatRequest = {
        messages: [...messages, userMessage],
      };
      
      // Use streaming for better UX
      setIsStreaming(true);
      setStreamedResponse('');
      
      await cognisBackend.streamChatCompletion(
        chatRequest,
        (content) => {
          setStreamedResponse(prev => prev + content);
        },
        () => {
          // On complete
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: streamedResponse }
          ]);
          setStreamedResponse('');
          setIsStreaming(false);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error during streaming:', error);
          setStreamedResponse(`Error: ${error.message}`);
          setIsStreaming(false);
          setIsLoading(false);
        }
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Error: ${error.message}. Please check your API configuration.` 
        }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border shadow-sm bg-white w-full max-w-4xl mx-auto my-8">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cognis API Demo</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm">API Status:</span>
          <span 
            className={`inline-block w-3 h-3 rounded-full ${
              apiStatus?.status === 'ok' 
                ? 'bg-green-500' 
                : apiStatus?.status === 'error'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
          ></span>
          <span className="text-sm">
            {apiStatus?.status === 'ok' 
              ? 'Connected' 
              : apiStatus?.status === 'error'
              ? 'Error'
              : 'Checking...'}
          </span>
        </div>
      </div>
      
      <div className="h-[500px] overflow-y-auto p-4 space-y-4">
        {messages.slice(1).map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-50 ml-12' 
                : 'bg-gray-50 mr-12'
            }`}
          >
            <div className="font-semibold mb-1">
              {message.role === 'user' ? 'You' : 'Assistant'}:
            </div>
            <div className="whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        ))}
        
        {isStreaming && (
          <div className="p-3 rounded-lg bg-gray-50 mr-12">
            <div className="font-semibold mb-1">Assistant:</div>
            <div className="whitespace-pre-wrap">
              {streamedResponse || (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse"></span>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <textarea
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-md ${
              isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
      
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        <p>
          This demo uses the Cognis API Backend to communicate with the Cognis AI services.
          {!apiStatus?.configured && (
            <span className="text-red-500 ml-1">
              API key not configured. Using development mode with mock responses.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default CognisApiDemo;
