import React, { useState, useEffect } from 'react';
import { useGeoSpatial } from '../contexts/GeoSpatialContext';
import { cognisClient } from '../services/cognis-client';
import BlockchainVisualizer from './blockchain/BlockchainVisualizer';
import { useTimeSeriesStore } from '../evolution/core/time-series-store';

/**
 * Example workflow component that demonstrates integration between
 * Cognis API, Blockchain, and Geospatial systems.
 */
const WorkforceExampleFlow: React.FC = () => {
  // State
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'blockchain' | 'location'>('chat');
  const [streamingData, setStreamingData] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // GeoSpatial context
  const {
    isTracking,
    currentGID,
    currentRegime,
    nearbyUsers,
    startTracking,
    stopTracking,
    createSnapshot,
    loadSnapshot,
    trackingHistory
  } = useGeoSpatial();
  
  // Time series store for user interactions
  const interactionStore = useTimeSeriesStore<{
    queries: Array<{text: string, timestamp: number, location?: any}>;
    responses: Array<{text: string, timestamp: number}>;
    activeFeatures: Record<string, number>;
  }>({
    queries: [],
    responses: [],
    activeFeatures: {}
  });
  
  // Function to send query to Cognis API
  const sendQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Record query with location context
      interactionStore.updateState(prev => ({
        ...prev,
        queries: [
          ...prev.queries,
          {
            text: query,
            timestamp: Date.now(),
            location: currentGID ? {
              latitude: currentGID.coordinate.latitude,
              longitude: currentGID.coordinate.longitude,
              regimeId: currentRegime?.id
            } : undefined
          }
        ],
        activeFeatures: {
          ...prev.activeFeatures,
          chatCompletions: (prev.activeFeatures.chatCompletions || 0) + 1
        }
      }));
      
      // Create chat completion
      const completion = await cognisClient.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for the Cognis Workforce Tool. ${
              currentGID ? `The user is currently located at latitude ${currentGID.coordinate.latitude.toFixed(4)} and longitude ${currentGID.coordinate.longitude.toFixed(4)}.` : ''
            } ${
              currentRegime ? `They are in the ${currentRegime.name} area.` : ''
            } ${
              nearbyUsers.length > 0 ? `There are ${nearbyUsers.length} other users nearby.` : ''
            }`
          },
          { role: 'user', content: query }
        ],
        model: 'Cognis-Zenith-4.0'
      });
      
      // Extract assistant response
      const responseText = completion.choices[0].message.content;
      
      // Update state
      setResponse(responseText);
      
      // Record response
      interactionStore.updateState(prev => ({
        ...prev,
        responses: [
          ...prev.responses,
          {
            text: responseText,
            timestamp: Date.now()
          }
        ]
      }));
      
      // Create a snapshot for this interaction
      createSnapshot(`interaction-${Date.now()}`);
      
      // Clear query
      setQuery('');
    } catch (error) {
      console.error('Error sending query:', error);
      setResponse('Error: Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to stream a response
  const streamResponse = () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingData([]);
    
    // Record query
    interactionStore.updateState(prev => ({
      ...prev,
      queries: [
        ...prev.queries,
        {
          text: query,
          timestamp: Date.now(),
          location: currentGID ? {
            latitude: currentGID.coordinate.latitude,
            longitude: currentGID.coordinate.longitude,
            regimeId: currentRegime?.id
          } : undefined
        }
      ],
      activeFeatures: {
        ...prev.activeFeatures,
        streamingCompletions: (prev.activeFeatures.streamingCompletions || 0) + 1
      }
    }));
    
    // Create streaming chat completion
    cognisClient.createChatCompletionStream(
      {
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for the Cognis Workforce Tool. ${
              currentGID ? `The user is currently located at latitude ${currentGID.coordinate.latitude.toFixed(4)} and longitude ${currentGID.coordinate.longitude.toFixed(4)}.` : ''
            } ${
              currentRegime ? `They are in the ${currentRegime.name} area.` : ''
            } ${
              nearbyUsers.length > 0 ? `There are ${nearbyUsers.length} other users nearby.` : ''
            }`
          },
          { role: 'user', content: query }
        ],
        model: 'Cognis-Zenith-4.0'
      },
      // Handle each chunk
      (chunk) => {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          setStreamingData(prev => [...prev, content]);
        }
      },
      // Handle completion
      () => {
        setIsLoading(false);
        setIsStreaming(false);
        
        // Combine streaming data into a single response
        const fullResponse = streamingData.join('');
        setResponse(fullResponse);
        
        // Record response
        interactionStore.updateState(prev => ({
          ...prev,
          responses: [
            ...prev.responses,
            {
              text: fullResponse,
              timestamp: Date.now()
            }
          ]
        }));
        
        // Create a snapshot for this interaction
        createSnapshot(`streaming-${Date.now()}`);
        
        // Clear query
        setQuery('');
      },
      // Handle error
      (error) => {
        console.error('Streaming error:', error);
        setIsLoading(false);
        setIsStreaming(false);
        setResponse('Error: Failed to get a streaming response. Please try again.');
      }
    );
  };
  
  // Function to log blockchain activity
  const logToBlockchain = async () => {
    try {
      // Make a call to the blockchain API
      const response = await fetch('/api/v1/blockchain/log-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-cognis-workforce-tool-dev-key-12345'
        },
        body: JSON.stringify({
          agentId: 1,
          action: 'example_workflow',
          metadata: JSON.stringify({
            query,
            location: currentGID ? {
              latitude: currentGID.coordinate.latitude,
              longitude: currentGID.coordinate.longitude,
              regime: currentRegime?.name
            } : null,
            timestamp: Date.now()
          })
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      // Update active features
      interactionStore.updateState(prev => ({
        ...prev,
        activeFeatures: {
          ...prev.activeFeatures,
          blockchain: (prev.activeFeatures.blockchain || 0) + 1
        }
      }));
      
      return await response.json();
    } catch (error) {
      console.error('Error logging to blockchain:', error);
      return null;
    }
  };
  
  // Effect to initialize location tracking
  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }
  }, [isTracking, startTracking]);
  
  // Render tabs
  const renderTabs = () => (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-t-lg">
      <button 
        className={`px-4 py-2 rounded-t-lg ${
          activeTab === 'chat' 
            ? 'bg-white text-blue-600 font-semibold' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => setActiveTab('chat')}
      >
        Chat
      </button>
      <button 
        className={`px-4 py-2 rounded-t-lg ${
          activeTab === 'blockchain' 
            ? 'bg-white text-blue-600 font-semibold' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => setActiveTab('blockchain')}
      >
        Blockchain
      </button>
      <button 
        className={`px-4 py-2 rounded-t-lg ${
          activeTab === 'location' 
            ? 'bg-white text-blue-600 font-semibold' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        onClick={() => setActiveTab('location')}
      >
        Location
      </button>
    </div>
  );
  
  // Render chat content
  const renderChatContent = () => (
    <div className="p-4 bg-white rounded-b-lg">
      {response && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800">Response:</h3>
          <p className="mt-1 text-gray-700 whitespace-pre-wrap">{response}</p>
        </div>
      )}
      
      <div className="mt-4">
        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
          Your query:
        </label>
        <div className="flex space-x-2">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ask something..."
            disabled={isLoading}
          />
          <button
            onClick={sendQuery}
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={streamResponse}
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isStreaming ? 'Streaming...' : 'Stream'}
          </button>
          <button
            onClick={logToBlockchain}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Log to Blockchain
          </button>
        </div>
      </div>
      
      {isStreaming && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-medium text-green-800">Streaming Response:</h3>
          <p className="mt-1 text-green-700 whitespace-pre-wrap">
            {streamingData.join('')}
            <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse"></span>
          </p>
        </div>
      )}
    </div>
  );
  
  // Render blockchain content
  const renderBlockchainContent = () => (
    <div className="bg-white rounded-b-lg overflow-hidden">
      <BlockchainVisualizer 
        showTransactions={true}
        showNetworkHealth={true}
        showHistoricalCharts={true}
        theme="light"
        refreshInterval={15000}
      />
    </div>
  );
  
  // Render location content
  const renderLocationContent = () => (
    <div className="p-4 bg-white rounded-b-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800">Current Location</h3>
        {isTracking ? (
          <div className="mt-2">
            {currentGID ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Latitude:</span> {currentGID.coordinate.latitude.toFixed(6)}
                </div>
                <div>
                  <span className="font-semibold">Longitude:</span> {currentGID.coordinate.longitude.toFixed(6)}
                </div>
                <div>
                  <span className="font-semibold">Regime:</span> {currentRegime?.name || 'Unknown'}
                </div>
                <div>
                  <span className="font-semibold">Nearby Users:</span> {nearbyUsers.length}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Waiting for location data...</p>
            )}
            <div className="mt-4">
              <button
                onClick={() => stopTracking()}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-gray-500">Location tracking is not active.</p>
            <button
              onClick={() => startTracking()}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Tracking
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800">Location History</h3>
        <div className="mt-2 max-h-64 overflow-y-auto">
          {trackingHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trackingHistory.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.gid ? `${entry.gid.coordinate.latitude.toFixed(4)}, ${entry.gid.coordinate.longitude.toFixed(4)}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.regime?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.nearbyUserCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No location history available.</p>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatContent();
      case 'blockchain':
        return renderBlockchainContent();
      case 'location':
        return renderLocationContent();
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cognis Workforce Example Flow</h1>
      <p className="mb-6 text-gray-600">
        This example demonstrates the integration between the Cognis API, Blockchain visualization, 
        and Geospatial tracking using the Evolution Architecture for time-series state management.
      </p>
      
      {renderTabs()}
      {renderActiveTabContent()}
    </div>
  );
};

export default WorkforceExampleFlow;
