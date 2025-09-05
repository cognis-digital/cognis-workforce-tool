import React, { useState } from 'react';
import { Bot, Briefcase, Users, TrendingUp, FileText, Headphones, Code, Palette, Eye, Crown, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import { useDataActions, useNotificationActions } from '../../store/appStore';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const agentTemplates = [
  {
    id: 'ceo-assistant',
    name: 'CEO Assistant',
    role: 'Executive Assistant',
    icon: Briefcase,
    color: 'from-purple-500 to-pink-400',
    description: 'Executive-level strategic planning and decision support',
    capabilities: ['Strategic Planning', 'Executive Reporting', 'Meeting Management', 'Decision Analysis'],
    personality: 'Professional, strategic, detail-oriented',
    responseStyle: 'Formal and comprehensive'
  },
  {
    id: 'sales-specialist',
    name: 'Sales Specialist',
    role: 'Sales Representative',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-400',
    description: 'Lead qualification, proposal generation, and sales optimization',
    capabilities: ['Lead Qualification', 'Proposal Creation', 'CRM Integration', 'Sales Analytics'],
    personality: 'Persuasive, enthusiastic, results-driven',
    responseStyle: 'Engaging and persuasive'
  },
  {
    id: 'hr-manager',
    name: 'HR Manager',
    role: 'Human Resources',
    icon: Users,
    color: 'from-blue-500 to-cyan-400',
    description: 'Recruitment, employee engagement, and HR operations',
    capabilities: ['Recruitment', 'Employee Onboarding', 'Performance Reviews', 'Policy Management'],
    personality: 'Empathetic, organized, supportive',
    responseStyle: 'Warm and professional'
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    role: 'Content Specialist',
    icon: FileText,
    color: 'from-orange-500 to-red-400',
    description: 'Content generation, copywriting, and marketing materials',
    capabilities: ['Content Writing', 'SEO Optimization', 'Social Media', 'Brand Messaging'],
    personality: 'Creative, adaptable, trend-aware',
    responseStyle: 'Creative and engaging'
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    role: 'Support Specialist',
    icon: Headphones,
    color: 'from-indigo-500 to-purple-400',
    description: 'Customer service, issue resolution, and support automation',
    capabilities: ['Issue Resolution', 'Product Knowledge', 'Escalation Management', 'Customer Satisfaction'],
    personality: 'Patient, helpful, solution-focused',
    responseStyle: 'Friendly and helpful'
  },
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    role: 'Documentation Specialist',
    icon: Code,
    color: 'from-teal-500 to-green-400',
    description: 'Technical documentation, API docs, and developer resources',
    capabilities: ['Technical Writing', 'API Documentation', 'Code Examples', 'User Guides'],
    personality: 'Precise, methodical, clear',
    responseStyle: 'Clear and technical'
  },
  {
    id: 'creative-designer',
    name: 'Creative Designer',
    role: 'Design Consultant',
    icon: Palette,
    color: 'from-pink-500 to-rose-400',
    description: 'Design consultation, creative direction, and visual strategy',
    capabilities: ['Design Strategy', 'Brand Guidelines', 'Visual Concepts', 'Creative Direction'],
    personality: 'Innovative, aesthetic, visionary',
    responseStyle: 'Inspiring and creative'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    role: 'Analytics Specialist',
    icon: TrendingUp,
    color: 'from-cyan-500 to-blue-400',
    description: 'Data analysis, reporting, and business intelligence',
    capabilities: ['Data Analysis', 'Report Generation', 'Trend Identification', 'KPI Tracking'],
    personality: 'Analytical, detail-oriented, objective',
    responseStyle: 'Data-driven and precise'
  }
];

export default function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const [step, setStep] = useState<'template' | 'customize' | 'advanced'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof agentTemplates[0] | null>(null);
  const [customAgent, setCustomAgent] = useState({
    name: '',
    role: '',
    description: '',
    capabilities: [] as string[],
    personality: '',
    responseStyle: '',
    knowledgeDomains: [] as string[],
    modelConfig: {
      model: 'Cognis-Zenith-4.0',
      maxTokens: 4000,
      temperature: 0.7,
      visionCapabilities: false,
      audioProcessing: false
    }
  });
  const [loading, setLoading] = useState(false);
  
  const { addAgent } = useDataActions();
  const { addNotification } = useNotificationActions();

  const handleTemplateSelect = (template: typeof agentTemplates[0]) => {
    setSelectedTemplate(template);
    setCustomAgent({
      name: template.name,
      role: template.role,
      description: template.description,
      capabilities: template.capabilities,
      personality: template.personality,
      responseStyle: template.responseStyle,
      knowledgeDomains: [],
      modelConfig: {
        model: 'Cognis-Zenith-4.0',
        maxTokens: 4000,
        temperature: 0.7,
        visionCapabilities: false,
        audioProcessing: false
      }
    });
    setStep('customize');
  };

  const handleCreateAgent = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newAgent = {
        id: `agent-${Date.now()}`,
        ...customAgent,
        status: 'active',
        tasks_completed: 0,
        accuracy: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      addAgent(newAgent);
      addNotification({
        type: 'success',
        title: 'Agent Created',
        message: `${customAgent.name} has been successfully created and is ready to work.`
      });

      onClose();
      resetForm();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create agent. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(null);
    setCustomAgent({
      name: '',
      role: '',
      description: '',
      capabilities: [],
      personality: '',
      responseStyle: '',
      knowledgeDomains: [],
      modelConfig: {
        model: 'Cognis-Zenith-4.0',
        maxTokens: 4000,
        temperature: 0.7,
        visionCapabilities: false,
        audioProcessing: false
      }
    });
  };

  const addCapability = (capability: string) => {
    if (capability.trim() && !customAgent.capabilities.includes(capability.trim())) {
      setCustomAgent(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, capability.trim()]
      }));
    }
  };

  const removeCapability = (index: number) => {
    setCustomAgent(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'template' ? 'Choose Agent Template' : step === 'customize' ? 'Customize Agent' : 'Advanced Configuration'}
      size="xl"
      closeOnOverlayClick={!loading}
    >
      <div className="p-6">
        {step === 'template' && (
          <div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <h3 className="text-blue-400 font-medium">Create AI Agent</h3>
              </div>
              <p className="text-white/70 text-sm">Create your next intelligent agent (0/15 used)</p>
            </div>
            
            <p className="text-white/60 mb-6">
              Choose a template to get started quickly, or create a custom agent from scratch.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {agentTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center`}>
                      <template.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{template.name}</h3>
                      <p className="text-white/60 text-sm">{template.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 bg-white/10 rounded text-xs text-white/80"
                      >
                        {capability}
                      </span>
                    ))}
                    {template.capabilities.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                        +{template.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep('customize');
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Create Custom Agent
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

        {step === 'customize' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={customAgent.name}
                  onChange={(e) => setCustomAgent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter agent name..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-sm mb-2">Role *</label>
                <input
                  type="text"
                  value={customAgent.role}
                  onChange={(e) => setCustomAgent(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g., Sales Specialist"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Description *</label>
              <textarea
                value={customAgent.description}
                onChange={(e) => setCustomAgent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Describe what this agent will do..."
                required
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Capabilities</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a capability..."
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCapability((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      addCapability(input.value);
                      input.value = '';
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {customAgent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customAgent.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                      >
                        {capability}
                        <button
                          onClick={() => removeCapability(index)}
                          className="hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Personality</label>
                <input
                  type="text"
                  value={customAgent.personality}
                  onChange={(e) => setCustomAgent(prev => ({ ...prev, personality: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g., Professional, friendly, analytical"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-sm mb-2">Response Style</label>
                <select
                  value={customAgent.responseStyle}
                  onChange={(e) => setCustomAgent(prev => ({ ...prev, responseStyle: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select style...</option>
                  <option value="formal">Formal and professional</option>
                  <option value="casual">Casual and friendly</option>
                  <option value="technical">Technical and precise</option>
                  <option value="creative">Creative and engaging</option>
                  <option value="concise">Concise and direct</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('template')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('advanced')}
                  className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Advanced Settings
                </button>
                <button
                  onClick={handleCreateAgent}
                  disabled={!customAgent.name || !customAgent.role || !customAgent.description || loading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                LLM Configuration
              </h3>
              
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <h4 className="text-blue-400 font-medium">Cognis Digital AI</h4>
                </div>
                <p className="text-white/70 text-sm">Advanced AI model suite powered by enterprise-grade infrastructure</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Cognis AI Model</label>
                  <select
                    value={customAgent.modelConfig.model}
                    onChange={(e) => setCustomAgent(prev => ({
                      ...prev,
                      modelConfig: { ...prev.modelConfig, model: e.target.value }
                    }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Cognis-Zenith-4.0">Cognis-Zenith-4.0 (Latest)</option>
                    <option value="Cognis-Apex-3.5">Cognis-Apex-3.5</option>
                    <option value="Cognis-Vertex-4.0">Cognis-Vertex-4.0</option>
                    <option value="Cognis-Nova-3.0">Cognis-Nova-3.0</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-2">Max Tokens</label>
                  <input
                    type="range"
                    min="100"
                    max="8000"
                    step="100"
                    value={customAgent.modelConfig.maxTokens}
                    onChange={(e) => setCustomAgent(prev => ({
                      ...prev,
                      modelConfig: { ...prev.modelConfig, maxTokens: parseInt(e.target.value) }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>100</span>
                    <span>{customAgent.modelConfig.maxTokens}</span>
                    <span>8000</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-2">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={customAgent.modelConfig.temperature}
                    onChange={(e) => setCustomAgent(prev => ({
                      ...prev,
                      modelConfig: { ...prev.modelConfig, temperature: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customAgent.modelConfig.visionCapabilities}
                    onChange={(e) => setCustomAgent(prev => ({
                      ...prev,
                      modelConfig: { ...prev.modelConfig, visionCapabilities: e.target.checked }
                    }))}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <Eye className="w-4 h-4 text-white/60" />
                  <span className="text-white text-sm">Vision Capabilities</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customAgent.modelConfig.audioProcessing}
                    onChange={(e) => setCustomAgent(prev => ({
                      ...prev,
                      modelConfig: { ...prev.modelConfig, audioProcessing: e.target.checked }
                    }))}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <Headphones className="w-4 h-4 text-white/60" />
                  <span className="text-white text-sm">Audio Processing</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">Core Capabilities</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Natural Language Processing',
                  'Data Analysis', 
                  'Content Creation',
                  'Code Generation',
                  'Financial Analysis',
                  'Market Research',
                  'Customer Service',
                  'Project Management'
                ].map((capability) => (
                  <button
                    key={capability}
                    onClick={() => {
                      if (!customAgent.capabilities.includes(capability)) {
                        setCustomAgent(prev => ({
                          ...prev,
                          capabilities: [...prev.capabilities, capability]
                        }));
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      customAgent.capabilities.includes(capability)
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-3 h-3" />
                      <span className="text-sm font-medium">{capability}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Knowledge Domains</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a knowledge domain..."
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value;
                        if (value.trim() && !customAgent.knowledgeDomains.includes(value.trim())) {
                          setCustomAgent(prev => ({
                            ...prev,
                            knowledgeDomains: [...prev.knowledgeDomains, value.trim()]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                
                {customAgent.knowledgeDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customAgent.knowledgeDomains.map((domain, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm"
                      >
                        {domain}
                        <button
                          onClick={() => setCustomAgent(prev => ({
                            ...prev,
                            knowledgeDomains: prev.knowledgeDomains.filter((_, i) => i !== index)
                          }))}
                          className="hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('customize')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={!customAgent.name || !customAgent.role || !customAgent.description || loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}