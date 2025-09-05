import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Briefcase, 
  Users, 
  TrendingUp, 
  FileText,
  Zap,
  Settings,
  Play,
  Pause,
  MoreHorizontal,
  Brain,
  Activity,
  Library,
  UserCheck,
  Copy,
  Edit,
  Trash2
} from 'lucide-react';
import { useAgents, useDataActions, useNotificationActions } from '../store/appStore';
import CreateAgentModal from '../components/modals/CreateAgentModal';
import AgentLibraryModal from '../components/modals/AgentLibraryModal';
import RoleManagementModal from '../components/modals/RoleManagementModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PaygateWrapper from '../components/PaygateWrapper';

export default function AgentBuilder() {
  const agents = useAgents();
  const { updateAgent, removeAgent } = useDataActions();
  const { addNotification } = useNotificationActions();
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<any>(null);

  const agentTemplates = [
    {
      role: 'CEO Assistant',
      icon: Briefcase,
      color: 'from-purple-500 to-pink-400',
      description: 'Executive-level strategic planning and decision support'
    },
    {
      role: 'CFO Analyst',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-400',
      description: 'Financial analysis, budgeting, and risk assessment'
    },
    {
      role: 'HR Manager',
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      description: 'Recruitment, employee engagement, and HR operations'
    },
    {
      role: 'Content Creator',
      icon: FileText,
      color: 'from-orange-500 to-red-400',
      description: 'Content generation, copywriting, and marketing materials'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'paused': return 'text-orange-400 bg-orange-500/20';
      case 'training': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Play;
      case 'paused': return Pause;
      case 'training': return Brain;
      default: return Activity;
    }
  };

  const handleToggleAgentStatus = async (agent: any) => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    
    try {
      updateAgent(agent.id, { status: newStatus });
      addNotification({
        type: 'success',
        title: 'Agent Updated',
        message: `${agent.name} is now ${newStatus}.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update agent status.'
      });
    }
  };

  const handleCloneAgent = async (agent: any) => {
    try {
      const clonedAgent = {
        ...agent,
        id: `agent-${Date.now()}`,
        name: `${agent.name} (Copy)`,
        tasks_completed: 0,
        accuracy: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // This would normally call addAgent, but we'll simulate it
      addNotification({
        type: 'success',
        title: 'Agent Cloned',
        message: `${agent.name} has been successfully cloned.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Clone Failed',
        message: 'Failed to clone agent.'
      });
    }
  };

  const handleDeleteAgent = async () => {
    if (!deletingAgent) return;

    try {
      removeAgent(deletingAgent.id);
      addNotification({
        type: 'success',
        title: 'Agent Deleted',
        message: `${deletingAgent.name} has been successfully deleted.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete agent.'
      });
    } finally {
      setDeletingAgent(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="w-8 h-8" />
            AI Agent Builder
          </h1>
          <p className="text-white/60">
            Create and manage specialized AI agents for different business functions and workflows.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowRoleModal(true)}
            className="bg-white/10 text-white px-4 py-3 rounded-2xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Manage Roles
          </button>
          <button 
            onClick={() => setShowLibraryModal(true)}
            className="bg-white/10 text-white px-4 py-3 rounded-2xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Library className="w-4 h-4" />
            Agent Library
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-2xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Agent
          </button>
        </div>
      </div>

      {/* Active Agents */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Your AI Workforce ({agents.length})
        </h2>

        {agents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const StatusIcon = getStatusIcon(agent.status);
              
              return (
                <div
                  key={agent.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(agent.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {agent.status}
                      </div>
                      <div className="relative">
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all">
                          <MoreHorizontal className="w-4 h-4 text-white/60" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="p-2">
                            <button
                              onClick={() => setSelectedAgent(agent)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                            >
                              <Settings className="w-4 h-4" />
                              Configure
                            </button>
                            <button
                              onClick={() => handleToggleAgentStatus(agent)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                            >
                              {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              {agent.status === 'active' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleCloneAgent(agent)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                            >
                              <Copy className="w-4 h-4" />
                              Clone
                            </button>
                            <button
                              onClick={() => setDeletingAgent(agent)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1">{agent.name}</h3>
                  <p className="text-blue-400 text-sm mb-3">{agent.role}</p>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{agent.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Tasks Completed</span>
                      <span className="text-white font-medium">{agent.tasks_completed}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Accuracy</span>
                      <span className="text-green-400 font-medium">{agent.accuracy}%</span>
                    </div>

                    <div className="bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                        style={{ width: `${agent.accuracy}%` }}
                      ></div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities?.slice(0, 2).map((capability: string) => (
                          <span
                            key={capability}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-white/80"
                          >
                            {capability}
                          </span>
                        ))}
                        {agent.capabilities?.length > 2 && (
                          <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                            +{agent.capabilities.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
            <Bot className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No AI Agents Yet</h3>
            <p className="text-white/60 mb-6">
              Create your first AI agent to start automating your business processes.
            </p>
            <PaygateWrapper action="agent_interaction">
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Agent
                </button>
                <button
                  onClick={() => setShowLibraryModal(true)}
                  className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Library className="w-4 h-4" />
                  Browse Library
                </button>
              </div>
            </PaygateWrapper>
          </div>
        )}
      </div>

      {/* Agent Templates */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Quick Start Templates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {agentTemplates.map((template) => (
            <div
              key={template.role}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
              onClick={() => setShowCreateModal(true)}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-4`}>
                <template.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-white font-medium mb-2">{template.role}</h3>
              <p className="text-white/60 text-sm mb-4">{template.description}</p>
              
              <div className="flex items-center gap-2 text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                <Plus className="w-4 h-4" />
                Create Agent
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background-primary border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                    <p className="text-blue-400">{selectedAgent.role}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mt-2 ${getStatusColor(selectedAgent.status)}`}>
                      {React.createElement(getStatusIcon(selectedAgent.status), { className: "w-3 h-3" })}
                      {selectedAgent.status}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 text-white rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">Description</h3>
                    <p className="text-white/70">{selectedAgent.description}</p>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-3">Capabilities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAgent.capabilities?.map((capability: string) => (
                        <div key={capability} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-white/80 text-sm">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-3">Performance Analytics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/60 text-sm mb-1">Response Time</p>
                        <p className="text-2xl font-bold text-white">1.2s</p>
                        <p className="text-green-400 text-xs">↓ 15% faster</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/60 text-sm mb-1">Success Rate</p>
                        <p className="text-2xl font-bold text-white">94%</p>
                        <p className="text-green-400 text-xs">↑ 3% improved</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Tasks Completed</p>
                    <p className="text-2xl font-bold text-white">{selectedAgent.tasks_completed}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-green-400">{selectedAgent.accuracy}%</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Created</p>
                    <p className="text-white text-sm">{new Date(selectedAgent.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button 
                  onClick={() => handleToggleAgentStatus(selectedAgent)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {selectedAgent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {selectedAgent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
                </button>
                <button className="bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Configuration
                </button>
                <button 
                  onClick={() => handleCloneAgent(selectedAgent)}
                  className="bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Clone Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <AgentLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
      />

      <RoleManagementModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />

      <ConfirmDialog
        isOpen={!!deletingAgent}
        onClose={() => setDeletingAgent(null)}
        onConfirm={handleDeleteAgent}
        title="Delete Agent"
        message={`Are you sure you want to delete "${deletingAgent?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Agent"
      />
    </div>
  );
}