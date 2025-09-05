import React, { useState } from 'react';
import { Bot, Search, Filter, Download, Star, Users, Zap, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { useDataActions, useNotificationActions } from '../../store/appStore';

interface AgentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrebuiltAgent {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  capabilities: string[];
  rating: number;
  downloads: number;
  tags: string[];
  preview: string;
  modelConfig: any;
  personality: string;
  responseStyle: string;
}

const categories = [
  'All Categories',
  'Customer Service',
  'Sales & Marketing',
  'Technical Support',
  'Content Creation',
  'Data Analysis',
  'HR & Recruitment',
  'Finance & Accounting',
  'Project Management'
];

const prebuiltAgents: PrebuiltAgent[] = [
  {
    id: 'lib-1',
    name: 'Customer Success Pro',
    role: 'Customer Success Manager',
    category: 'Customer Service',
    description: 'Expert at handling customer inquiries, resolving issues, and ensuring customer satisfaction with empathetic communication.',
    capabilities: ['Issue Resolution', 'Customer Onboarding', 'Satisfaction Surveys', 'Escalation Management'],
    rating: 4.9,
    downloads: 2847,
    tags: ['customer-service', 'support', 'communication'],
    preview: 'Hello! I\'m here to help you with any questions or concerns. How can I assist you today?',
    modelConfig: { model: 'gpt-4', temperature: 0.7, maxTokens: 800 },
    personality: 'Empathetic, patient, solution-focused',
    responseStyle: 'Warm and professional'
  },
  {
    id: 'lib-2',
    name: 'Sales Conversion Expert',
    role: 'Sales Representative',
    category: 'Sales & Marketing',
    description: 'Specialized in lead qualification, objection handling, and closing deals with proven sales methodologies.',
    capabilities: ['Lead Qualification', 'Objection Handling', 'Proposal Writing', 'Follow-up Automation'],
    rating: 4.8,
    downloads: 1923,
    tags: ['sales', 'conversion', 'leads'],
    preview: 'I understand you\'re looking for a solution that can help your business grow. Let me show you how we can achieve that together.',
    modelConfig: { model: 'gpt-4', temperature: 0.8, maxTokens: 1000 },
    personality: 'Confident, persuasive, goal-oriented',
    responseStyle: 'Engaging and results-focused'
  },
  {
    id: 'lib-3',
    name: 'Technical Documentation Writer',
    role: 'Technical Writer',
    category: 'Technical Support',
    description: 'Creates clear, comprehensive technical documentation, API guides, and developer resources.',
    capabilities: ['API Documentation', 'User Guides', 'Code Examples', 'Technical Tutorials'],
    rating: 4.7,
    downloads: 1456,
    tags: ['documentation', 'technical', 'developer'],
    preview: 'I\'ll help you create clear, comprehensive documentation that developers will actually want to read.',
    modelConfig: { model: 'gpt-4', temperature: 0.3, maxTokens: 1200 },
    personality: 'Precise, methodical, detail-oriented',
    responseStyle: 'Clear and structured'
  },
  {
    id: 'lib-4',
    name: 'Social Media Manager',
    role: 'Content Creator',
    category: 'Content Creation',
    description: 'Creates engaging social media content, manages posting schedules, and analyzes engagement metrics.',
    capabilities: ['Content Creation', 'Social Strategy', 'Engagement Analysis', 'Trend Monitoring'],
    rating: 4.6,
    downloads: 3241,
    tags: ['social-media', 'content', 'marketing'],
    preview: 'Ready to create content that resonates with your audience and drives engagement across all platforms!',
    modelConfig: { model: 'gpt-4', temperature: 0.9, maxTokens: 600 },
    personality: 'Creative, trendy, engaging',
    responseStyle: 'Energetic and creative'
  },
  {
    id: 'lib-5',
    name: 'Data Insights Analyst',
    role: 'Data Analyst',
    category: 'Data Analysis',
    description: 'Analyzes complex datasets, generates insights, and creates comprehensive reports with actionable recommendations.',
    capabilities: ['Data Analysis', 'Report Generation', 'Trend Identification', 'Predictive Modeling'],
    rating: 4.8,
    downloads: 1687,
    tags: ['analytics', 'data', 'insights'],
    preview: 'I\'ve analyzed your data and identified several key trends that could significantly impact your business strategy.',
    modelConfig: { model: 'gpt-4', temperature: 0.4, maxTokens: 1000 },
    personality: 'Analytical, objective, thorough',
    responseStyle: 'Data-driven and precise'
  },
  {
    id: 'lib-6',
    name: 'Recruitment Specialist',
    role: 'HR Recruiter',
    category: 'HR & Recruitment',
    description: 'Streamlines recruitment processes, screens candidates, and manages interview scheduling with efficiency.',
    capabilities: ['Candidate Screening', 'Interview Scheduling', 'Job Posting', 'Talent Pipeline'],
    rating: 4.5,
    downloads: 892,
    tags: ['recruitment', 'hr', 'hiring'],
    preview: 'I\'ll help you find the perfect candidates for your team by streamlining the entire recruitment process.',
    modelConfig: { model: 'gpt-4', temperature: 0.6, maxTokens: 800 },
    personality: 'Professional, thorough, people-focused',
    responseStyle: 'Professional and encouraging'
  }
];

export default function AgentLibraryModal({ isOpen, onClose }: AgentLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<PrebuiltAgent | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  
  const { addAgent } = useDataActions();
  const { addNotification } = useNotificationActions();

  const filteredAgents = prebuiltAgents.filter(agent => {
    const matchesCategory = selectedCategory === 'All Categories' || agent.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleImportAgent = async (agent: PrebuiltAgent) => {
    setImporting(agent.id);
    
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const importedAgent = {
        id: `imported-${Date.now()}`,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        capabilities: agent.capabilities,
        personality: agent.personality,
        responseStyle: agent.responseStyle,
        status: 'active',
        tasks_completed: 0,
        accuracy: 0,
        model_config: agent.modelConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      addAgent(importedAgent);
      addNotification({
        type: 'success',
        title: 'Agent Imported',
        message: `${agent.name} has been successfully imported to your workspace.`
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import agent. Please try again.'
      });
    } finally {
      setImporting(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Library"
      size="full"
    >
      <div className="p-6">
        {!selectedAgent ? (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white/5 border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white text-sm">{agent.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1">{agent.name}</h3>
                  <p className="text-blue-400 text-sm mb-2">{agent.role}</p>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{agent.description}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.capabilities.slice(0, 2).map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 bg-white/10 rounded text-xs text-white/80"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                        +{agent.capabilities.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {agent.downloads.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300">
                      View Details
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Agent Detail View */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedAgent(null)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Library
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                      <p className="text-blue-400">{selectedAgent.role}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white text-sm">{selectedAgent.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/60">
                          <Download className="w-4 h-4" />
                          <span className="text-sm">{selectedAgent.downloads.toLocaleString()} downloads</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/70 text-lg">{selectedAgent.description}</p>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Preview Conversation</h3>
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">{selectedAgent.preview}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Capabilities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAgent.capabilities.map((capability) => (
                      <div key={capability} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-white/80 text-sm">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Configuration</h3>
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Model</span>
                      <span className="text-white">{selectedAgent.modelConfig.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Personality</span>
                      <span className="text-white">{selectedAgent.personality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Response Style</span>
                      <span className="text-white">{selectedAgent.responseStyle}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Import Agent</h3>
                  <p className="text-white/60 text-sm mb-4">
                    This agent will be added to your workspace and can be customized further after import.
                  </p>
                  
                  <button
                    onClick={() => handleImportAgent(selectedAgent)}
                    disabled={importing === selectedAgent.id}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {importing === selectedAgent.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Import Agent
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Community Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white">{selectedAgent.rating}/5</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Downloads</span>
                      <span className="text-white">{selectedAgent.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Category</span>
                      <span className="text-white">{selectedAgent.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}