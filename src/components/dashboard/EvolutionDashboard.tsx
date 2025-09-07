import React, { useState, useEffect } from 'react';
import { LineChart, AreaChart, BarChart, PieChart, Line, Area, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Database, GitBranch, Zap, GitCommit, BarChart2, Activity, Terminal, Layers } from 'lucide-react';
import Logo from '../branding/Logo';
import { evolutionManager, stateAnalysisEngine } from '../../evolution';
import { withAdaptiveEvolution } from '../../evolution/core/adaptiveUI';
import ConnectionStatus from '../ConnectionStatus';

// Mock data for evolution metrics
const generateEvolutionData = () => {
  const data = [];
  const now = Date.now();
  for (let i = 10; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stateTransitions: Math.floor(Math.random() * 150) + 50,
      codeGenerated: Math.floor(Math.random() * 10) + 1,
      adaptations: Math.floor(Math.random() * 5),
      snapshotsCreated: Math.floor(Math.random() * 8) + 2,
    });
  }
  return data;
};

const mockPerformanceData = [
  { name: 'Initial State', value: 30 },
  { name: 'Optimized', value: 45 },
  { name: 'Adaptive', value: 85 }
];

const mockStateTypes = [
  { name: 'User Credentials', value: 25 },
  { name: 'RBAC', value: 15 },
  { name: 'AI Chat', value: 35 },
  { name: 'Knowledge Stack', value: 15 },
  { name: 'Wallet Connect', value: 10 }
];

interface DashboardMetric {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  description: string;
}

interface DashboardProps {
  className?: string;
}

/**
 * EvolutionDashboard Component
 * Shows metrics and visualizations for the Evolution Architecture
 */
const EvolutionDashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [evolutionData, setEvolutionData] = useState(generateEvolutionData());
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'states' | 'adaptations' | 'insights'>('metrics');

  // Generate metrics based on evolution data
  useEffect(() => {
    const history = evolutionManager.getEvolutionHistory();
    const analysisInsights = stateAnalysisEngine.getInsights();
    
    const calculatedMetrics: DashboardMetric[] = [
      {
        title: 'Total States',
        value: history.length,
        change: +15,
        icon: <Database className="w-5 h-5 text-blue-400" />,
        description: 'Total states tracked in evolution history'
      },
      {
        title: 'Snapshots',
        value: Math.floor(history.length * 0.3),
        change: +8,
        icon: <GitBranch className="w-5 h-5 text-green-400" />,
        description: 'Temporal snapshots for state reversion'
      },
      {
        title: 'Code Generations',
        value: evolutionData.reduce((sum, item) => sum + item.codeGenerated, 0),
        change: +3,
        icon: <Terminal className="w-5 h-5 text-purple-400" />,
        description: 'Polymorphic code generations'
      },
      {
        title: 'Adaptations',
        value: evolutionData.reduce((sum, item) => sum + item.adaptations, 0),
        change: +6,
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        description: 'UI adaptations based on usage patterns'
      }
    ];
    
    setMetrics(calculatedMetrics);
    
    // Extract insights from state analysis engine
    const extractedInsights = [
      ...(analysisInsights.optimizationSuggestions || []).map(suggestion => ({
        type: 'optimization',
        title: suggestion.description,
        priority: suggestion.priority
      })),
      ...(analysisInsights.anomalies || []).map(anomaly => ({
        type: 'anomaly',
        title: `Unusual transition: ${anomaly.action}`,
        priority: 'high'
      }))
    ];
    
    setInsights(extractedInsights);
  }, [evolutionData]);

  return (
    <div className={`evolution-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-white">Evolution Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">System Status:</div>
          <ConnectionStatus status="online" />
        </div>
      </div>
      
      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-400 text-sm">{metric.title}</h3>
                <div className="flex items-baseline mt-1">
                  <span className="text-2xl font-bold text-white">{metric.value}</span>
                  {metric.change && (
                    <span className={`ml-2 text-xs font-semibold ${metric.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-900/70">
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-800 mb-6">
        <button 
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'metrics' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          <BarChart2 className="w-4 h-4 inline mr-1" />
          Evolution Metrics
        </button>
        <button 
          onClick={() => setActiveTab('states')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'states' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Database className="w-4 h-4 inline mr-1" />
          State Distribution
        </button>
        <button 
          onClick={() => setActiveTab('adaptations')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'adaptations' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Activity className="w-4 h-4 inline mr-1" />
          Performance Impact
        </button>
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'insights' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Zap className="w-4 h-4 inline mr-1" />
          AI Insights
        </button>
      </div>
      
      {/* Tab content */}
      <div className="mb-6">
        {activeTab === 'metrics' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-bold text-white mb-4">Evolution Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} 
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="stateTransitions" name="State Transitions" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="codeGenerated" name="Code Generated" stroke="#82ca9d" />
                <Line type="monotone" dataKey="adaptations" name="UI Adaptations" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {activeTab === 'states' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-bold text-white mb-4">State Distribution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={mockStateTypes} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60}
                      outerRadius={80} 
                      fill="#8884d8" 
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {mockStateTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#ffc658'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-md font-medium text-white mb-3">Evolution History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {evolutionData.flatMap((day, i) => [
                    <div key={`day-${i}`} className="text-sm font-medium text-gray-300 mt-3">{day.date}</div>,
                    ...Array(Math.min(3, day.stateTransitions % 5 + 1)).fill(0).map((_, j) => (
                      <div key={`event-${i}-${j}`} className="flex items-start bg-gray-900/50 rounded-lg p-2">
                        <GitCommit className="w-4 h-4 text-blue-400 mt-0.5 mr-2" />
                        <div>
                          <div className="text-sm text-white">State update in {
                            ['User Credentials', 'RBAC System', 'AI Chat Interface', 'Knowledge Stack', 'Wallet Connect'][Math.floor(Math.random() * 5)]
                          }</div>
                          <div className="text-xs text-gray-500">{new Date(Date.now() - (i * 86400000 + j * 3600000)).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))
                  ])}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'adaptations' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-bold text-white mb-4">Performance Impact</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-white mb-3">Performance Improvement</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
                    <Bar dataKey="value" name="Performance Score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-md font-medium text-white mb-3">Adaptation Impact</h3>
                <div className="space-y-4">
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium text-white">Response Time</div>
                      <div className="text-sm font-medium text-green-400">-32%</div>
                    </div>
                    <div className="mt-2 bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium text-white">Memory Usage</div>
                      <div className="text-sm font-medium text-green-400">-24%</div>
                    </div>
                    <div className="mt-2 bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium text-white">User Interaction Steps</div>
                      <div className="text-sm font-medium text-green-400">-41%</div>
                    </div>
                    <div className="mt-2 bg-gray-800 h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '59%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg font-bold text-white mb-4">Evolution Insights</h2>
            <div className="space-y-4">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      insight.type === 'optimization' 
                        ? 'bg-blue-900/20 border-blue-800/30' 
                        : 'bg-amber-900/20 border-amber-800/30'
                    }`}
                  >
                    <div className="flex items-start">
                      {insight.type === 'optimization' ? (
                        <Zap className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
                      ) : (
                        <Activity className="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">{insight.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Priority: <span className={
                            insight.priority === 'high' ? 'text-red-400' : 
                            insight.priority === 'medium' ? 'text-yellow-400' : 
                            'text-green-400'
                          }>{insight.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No insights available yet. The system needs more interaction data.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Evolution architecture footer */}
      <div className="rounded-lg bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 p-4 border border-indigo-800/30 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-indigo-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-white">Evolution Architecture</h3>
            <p className="text-xs text-gray-400">Last update: {new Date().toLocaleString()}</p>
          </div>
        </div>
        <div>
          <button className="px-3 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-sm flex items-center">
            <GitBranch className="w-4 h-4 mr-1" />
            Create Snapshot
          </button>
        </div>
      </div>
    </div>
  );
};

// Export enhanced version with evolution capabilities
export default withAdaptiveEvolution(
  EvolutionDashboard,
  'evolutionDashboard',
  evolutionManager,
  true
);
