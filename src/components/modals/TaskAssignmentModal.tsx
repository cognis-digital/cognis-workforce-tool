import React, { useState } from 'react';
import { Bot, Calendar, FileText, Zap, Clock, Target, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAgents, useDataActions, useNotificationActions } from '../../store/appStore';
import { taskService, TaskTemplate } from '../../services/taskService';

interface TaskAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskAssignmentModal({ isOpen, onClose }: TaskAssignmentModalProps) {
  const agents = useAgents();
  const { addNotification } = useNotificationActions();
  
  const [step, setStep] = useState<'template' | 'agent' | 'configure' | 'review'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [taskConfig, setTaskConfig] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    deadline: '',
    deliverableFormat: 'pdf' as 'pdf' | 'csv' | 'docx' | 'json' | 'code' | 'markdown',
    parameters: {} as Record<string, any>
  });
  const [creating, setCreating] = useState(false);

  const taskTemplates = taskService.getTaskTemplates();

  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setTaskConfig(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      deliverableFormat: template.defaultFormat as any,
      parameters: {}
    }));
    setStep('agent');
  };

  const handleAgentSelect = (agent: any) => {
    setSelectedAgent(agent);
    setStep('configure');
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setTaskConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramName]: value
      }
    }));
  };

  const handleCreateTask = async () => {
    if (!selectedAgent || !selectedTemplate) return;

    setCreating(true);
    
    try {
      await taskService.createTask({
        title: taskConfig.title,
        description: taskConfig.description,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentType: selectedAgent.role,
        priority: taskConfig.priority,
        deadline: taskConfig.deadline || undefined,
        deliverableFormat: taskConfig.deliverableFormat,
        parameters: taskConfig.parameters
      });

      addNotification({
        type: 'success',
        title: 'Task Assigned',
        message: `${taskConfig.title} has been assigned to ${selectedAgent.name} and is being processed.`
      });

      onClose();
      resetForm();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Task Assignment Failed',
        message: 'Failed to assign task. Please try again.'
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(null);
    setSelectedAgent(null);
    setTaskConfig({
      title: '',
      description: '',
      priority: 'medium',
      deadline: '',
      deliverableFormat: 'pdf',
      parameters: {}
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return FileText;
      case 'csv': return FileText;
      case 'code': return FileText;
      default: return FileText;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'template' ? 'Choose Task Template' :
        step === 'agent' ? 'Select AI Agent' :
        step === 'configure' ? 'Configure Task' :
        'Review & Assign'
      }
      size="xl"
      closeOnOverlayClick={!creating}
    >
      <div className="p-6">
        {step === 'template' && (
          <div>
            <p className="text-white/60 mb-6">
              Choose a task template to get started with AI-powered deliverable generation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{template.name}</h3>
                      <p className="text-blue-400 text-sm">For {template.agentType} agents</p>
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Default format: {template.defaultFormat.toUpperCase()}</span>
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'agent' && (
          <div>
            <p className="text-white/60 mb-6">
              Select an AI agent to handle this task. Choose based on the agent's specialization and capabilities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.filter(agent => agent.status === 'active').map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className="bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{agent.name}</h3>
                      <p className="text-blue-400 text-sm">{agent.role}</p>
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4">{agent.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">{agent.accuracy || 95}% accuracy</span>
                      <span className="text-white/60">{agent.tasks_completed || 0} tasks</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  </div>
                </div>
              ))}
            </div>

            {agents.filter(agent => agent.status === 'active').length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Agents</h3>
                <p className="text-white/60">Create and activate an agent first to assign tasks.</p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep('template')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'configure' && selectedTemplate && (
          <div className="space-y-6">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-blue-400 font-medium">{selectedTemplate.name}</h3>
                  <p className="text-white/70 text-sm">Assigned to {selectedAgent?.name}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Task Title</label>
                <input
                  type="text"
                  value={taskConfig.title}
                  onChange={(e) => setTaskConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter task title..."
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-sm mb-2">Priority</label>
                <select
                  value={taskConfig.priority}
                  onChange={(e) => setTaskConfig(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  value={taskConfig.deadline}
                  onChange={(e) => setTaskConfig(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-sm mb-2">Output Format</label>
                <select
                  value={taskConfig.deliverableFormat}
                  onChange={(e) => setTaskConfig(prev => ({ ...prev, deliverableFormat: e.target.value as any }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="pdf">PDF Report</option>
                  <option value="docx">Word Document</option>
                  <option value="csv">CSV Data</option>
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON Data</option>
                  <option value="code">Code File</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Task Description</label>
              <textarea
                value={taskConfig.description}
                onChange={(e) => setTaskConfig(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Provide detailed instructions for the AI agent..."
              />
            </div>

            {/* Dynamic Parameters */}
            {selectedTemplate.parameters.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">Task Parameters</h3>
                <div className="space-y-4">
                  {selectedTemplate.parameters.map((param) => (
                    <div key={param.name}>
                      <label className="block text-white/60 text-sm mb-2">
                        {param.name.charAt(0).toUpperCase() + param.name.slice(1)}
                        {param.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      
                      {param.type === 'select' ? (
                        <select
                          value={taskConfig.parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          required={param.required}
                        >
                          <option value="">Select {param.name}...</option>
                          {param.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : param.type === 'textarea' ? (
                        <textarea
                          value={taskConfig.parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          placeholder={param.placeholder}
                          rows={3}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          required={param.required}
                        />
                      ) : (
                        <input
                          type={param.type}
                          value={taskConfig.parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, param.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                          placeholder={param.placeholder}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          required={param.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('agent')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!taskConfig.title || !taskConfig.description}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Review Task
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Task Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-white/60 text-sm">Title</p>
                    <p className="text-white font-medium">{taskConfig.title}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Assigned Agent</p>
                    <p className="text-white font-medium">{selectedAgent?.name}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Priority</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(taskConfig.priority)}`}>
                      {taskConfig.priority}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-white/60 text-sm">Output Format</p>
                    <p className="text-white font-medium">{taskConfig.deliverableFormat.toUpperCase()}</p>
                  </div>
                  {taskConfig.deadline && (
                    <div>
                      <p className="text-white/60 text-sm">Deadline</p>
                      <p className="text-white font-medium">{new Date(taskConfig.deadline).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-white/60 text-sm">Estimated Cost</p>
                    <p className="text-green-400 font-medium">$2.50 - $5.00</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-2">Description</p>
                <p className="text-white/80">{taskConfig.description}</p>
              </div>

              {Object.keys(taskConfig.parameters).length > 0 && (
                <div className="mt-4">
                  <p className="text-white/60 text-sm mb-2">Parameters</p>
                  <div className="bg-white/5 rounded-lg p-3">
                    {Object.entries(taskConfig.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-white/60 text-sm">{key}:</span>
                        <span className="text-white text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <h4 className="text-orange-400 font-medium">Billing Information</h4>
              </div>
              <p className="text-white/70 text-sm">
                This task will be processed by Cognis Digital's AI technology. You'll be charged based on the complexity and length of the generated deliverable.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('configure')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Assigning Task...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Assign Task
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}