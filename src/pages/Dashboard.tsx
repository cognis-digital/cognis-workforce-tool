import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Bot, 
  Database, 
  Users, 
  Target,
  Activity,
  ArrowUpRight,
  Zap,
  Brain,
  Globe,
  ChevronRight
} from 'lucide-react';
import { useUserProfile } from '../store/authStore';
import { useAgents, useKnowledgeBases, useLeads, useInteractions, useTasks } from '../store/appStore';
import { useWallet } from '../contexts/WalletContext';
import PaygateWrapper from '../components/PaygateWrapper';
import { useDynamicText } from '../hooks/useDynamicText';

export default function Dashboard() {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const agents = useAgents();
  const knowledgeBases = useKnowledgeBases();
  const leads = useLeads();
  const interactions = useInteractions();
  const tasks = useTasks();
  const { network, isConnected } = useWallet();
  const { getWelcomeMessage, getFeatureDescription } = useDynamicText();
  
  // Calculate dynamic stats from actual data
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const totalAgentCompletedTasks = agents.reduce((total, agent) => total + (agent.tasks_completed || 0), 0);
  const totalKnowledgeBases = knowledgeBases.length;
  const generatedLeads = leads.length;
  const totalInteractions = interactions.length;
  const userTasks = tasks.filter(t => t.userId === userProfile?.user_id);
  const completedTasks = userTasks.filter(t => t.status === 'completed').length;

  const stats = [
    {
      label: 'Active AI Agents',
      value: activeAgents,
      icon: Bot,
      color: 'from-blue-500 to-cyan-400',
      change: `${agents.length} total`
    },
    {
      label: 'Completed Tasks',
      value: totalAgentCompletedTasks,
      icon: Activity,
      color: 'from-green-500 to-emerald-400',
      change: `${totalInteractions} interactions`
    },
    {
      label: 'Knowledge Bases',
      value: totalKnowledgeBases,
      icon: Database,
      color: 'from-purple-500 to-pink-400',
      change: `${knowledgeBases.reduce((total, kb) => total + (kb.usage_count || 0), 0)} queries`
    },
    {
      label: 'Generated Leads',
      value: generatedLeads,
      icon: Users,
      color: 'from-orange-500 to-red-400',
      change: `$${Math.round(leads.reduce((total, lead) => total + (lead.potential_value || 0), 0) / 1000)}K value`
    }
  ];

  const recentActivity = [
    { action: 'Lead Analysis Completed', agent: 'Sales Agent Pro', time: '2 minutes ago', type: 'success' },
    { action: 'Knowledge Base Updated', agent: 'Research Assistant', time: '15 minutes ago', type: 'info' },
    { action: 'Proposal Generated', agent: 'Business Dev AI', time: '1 hour ago', type: 'success' },
    { action: 'Market Research Started', agent: 'Analytics Agent', time: '2 hours ago', type: 'pending' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-heading mb-2">
            {getWelcomeMessage(userProfile?.display_name || 'User')}
          </h1>
          <p className="text-text-body">
            {getFeatureDescription('dashboard') || 'Your AI workforce is ready to execute. Monitor performance and manage operations from here.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Network Status */}
          <div className="card-bg rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <div>
                <p className="text-text-heading text-sm font-medium">
                  {isConnected ? network?.name || 'Connected' : 'Disconnected'}
                </p>
                <p className="text-text-muted text-xs">Blockchain Status</p>
              </div>
              <Globe className="w-5 h-5 text-text-muted" />
            </div>
          </div>
          
          {/* Quick Action */}
          <button 
            onClick={() => navigate('/agents')}
            className="primary-button px-6 py-3 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            New Agent
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="card-bg rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-text-muted text-xs">
                {stat.change}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-text-heading mb-1">{stat.value}</h3>
            <p className="text-text-body text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* AI Agents Overview */}
        <div className="lg:col-span-2">
          <div className="card-bg rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Active AI Agents ({activeAgents})
              </h2>
              <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {agents.slice(0, 3).map((agent, index) => (
                <div key={agent} className="bg-background-secondary/30 rounded-xl p-4 hover:bg-white/10 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${
                        index === 0 ? 'from-primary-600 to-primary-700' :
                        index === 1 ? 'from-primary-500 to-primary-600' :
                        'from-success-500 to-success-600'
                      } rounded-lg flex items-center justify-center`}>
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-text-heading font-medium">{agent.name || `Agent ${index + 1}`}</h3>
                        <p className="text-text-body text-sm">
                          {agent.description || agent.role || 'AI Agent'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-400 animate-pulse' :
                        agent.status === 'paused' ? 'bg-orange-400' :
                        'bg-blue-400'
                      }`}></div>
                      <span className={`text-sm capitalize ${
                        agent.status === 'active' ? 'text-green-400' :
                        agent.status === 'paused' ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>{agent.status || 'active'}</span>
                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
              
              {agents.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-text-subtle mx-auto mb-3" />
                  <p className="text-text-body">No agents created yet</p>
                  <PaygateWrapper action="agent_interaction">
                    <button 
                      onClick={() => navigate('/agents')}
                      className="mt-3 text-primary-400 hover:text-primary-300 transition-colors text-sm"
                    >
                      Create your first agent
                    </button>
                  </PaygateWrapper>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div className="card-bg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-heading mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'info' ? 'bg-blue-400' :
                    'bg-orange-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-text-heading text-sm font-medium">{activity.action}</p>
                    <p className="text-text-body text-xs">{activity.agent}</p>
                    <p className="text-text-subtle text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
              View All Activity
            </button>
          </div>

          {/* Performance Metrics */}
          <div className="card-bg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-heading mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-body">Task Completion Rate</span>
                  <span className="text-text-heading">{agents.length > 0 ? Math.round((completedTasks / Math.max(agents.length * 10, 1)) * 100) : 0}%</span>
                </div>
                <div className="bg-background-secondary/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-success-500 to-success-400 h-2 rounded-full" style={{ width: `${agents.length > 0 ? Math.round((completedTasks / Math.max(agents.length * 10, 1)) * 100) : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-body">Response Accuracy</span>
                  <span className="text-text-heading">{agents.length > 0 ? Math.round(agents.reduce((total, agent) => total + (agent.accuracy || 0), 0) / agents.length) : 0}%</span>
                </div>
                <div className="bg-background-secondary/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-2 rounded-full" style={{ width: `${agents.length > 0 ? Math.round(agents.reduce((total, agent) => total + (agent.accuracy || 0), 0) / agents.length) : 0}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-body">Agent Utilization</span>
                  <span className="text-text-heading">{Math.round((activeAgents / Math.max(agents.length, 1)) * 100)}%</span>
                </div>
                <div className="bg-background-secondary/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full" style={{ width: `${Math.round((activeAgents / Math.max(agents.length, 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}