import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Download,
  Filter,
  Search,
  MapPin,
  Building,
  Mail,
  Phone,
  ExternalLink,
  Zap,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Star,
  AlertCircle
} from 'lucide-react';
import { useLeads } from '../store/appStore';
import { useUser, useUserProfile } from '../store/authStore';
import { useDataActions, useNotificationActions } from '../store/appStore';
import FeatureGate from '../components/FeatureGate';
import { useFeaturePaygate } from '../hooks/useFeaturePaygate';
import { searchService } from '../services/searchService';

interface Lead {
  id: string;
  company: string;
  contact: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  industry: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal';
  value: number;
  lastActivity: string;
}

export default function LeadGeneration() {
  const leadsFromState = useLeads();
  const user = useUser();
  const { addLead } = useDataActions();
  const { addNotification } = useNotificationActions();
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('manage');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchParams, setSearchParams] = useState<LeadSearchParams>({
    industry: '',
    companySize: '',
    location: '',
    budgetRange: '',
    requirements: ''
  });
  
  // Self-hosted instance metrics
  const [lastSearchDate, setLastSearchDate] = useState<Date | null>(null);
  const [searchesPerformed, setSearchesPerformed] = useState(0);

  // Use leads from state, fallback to demo data if empty
  const leads: Lead[] = leadsFromState.length > 0 ? leadsFromState.map(lead => ({
    id: lead.id,
    company: lead.company,
    contact: lead.contact_name || 'Unknown Contact',
    title: lead.contact_title || 'Unknown Title',
    email: lead.email || 'No email',
    phone: lead.phone || 'No phone',
    location: lead.location || 'Unknown location',
    industry: lead.industry || 'Unknown industry',
    score: lead.score || 0,
    status: lead.status as 'new' | 'contacted' | 'qualified' | 'proposal',
    value: lead.potential_value || 0,
    lastActivity: new Date(lead.updated_at).toLocaleDateString() || 'Unknown'
  })) : [];

  // Calculate dynamic statistics based on actual leads data
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified' || lead.status === 'proposal').length;
  const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const averageScore = totalLeads > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / totalLeads) : 0;
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-400 bg-blue-500/20';
      case 'contacted': return 'text-orange-400 bg-orange-500/20';
      case 'qualified': return 'text-green-400 bg-green-500/20';
      case 'proposal': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'qualified': return CheckCircle;
      case 'proposal': return TrendingUp;
      default: return Clock;
    }
  };

  // Feature gating for lead searches
  const { 
    canAccess, 
    isLoading: checkingUsage, 
    usage: leadSearchUsage, 
    handleIncrement: incrementLeadSearch
  } = useFeaturePaygate({
    feature: 'leadSearches',
    redirectToUpgrade: true
  });

  const handleGenerateLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.industry || !searchParams.location) {
      addNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please specify at least the target industry and location to generate leads.'
      });
      return;
    }

    // Check if user can perform another search based on subscription
    if (!canAccess) {
      addNotification({
        type: 'error',
        title: 'Usage Limit Reached',
        message: `You've reached your limit of ${leadSearchUsage.limit} lead searches for this billing period.`,
        action: 'Upgrade',
        actionUrl: '/pricing'
      });
      return;
    }

    setGenerating(true);
    
    try {
      // Track lead search usage
      await incrementLeadSearch();
      
      // Track self-hosted instance metrics
      setLastSearchDate(new Date());
      setSearchesPerformed(prev => prev + 1);
      
      addNotification({
        type: 'info',
        title: 'Searching for Leads',
        message: 'Cognis Digital self-hosted AI is searching the web for qualified leads matching your criteria...'
      });

      // Use Google search to find real leads
      const generatedLeads = await searchService.searchForLeads(searchParams);
      
      // Notify about self-hosted search completion
      addNotification({
        type: 'success',
        title: 'Self-Hosted Search Complete',
        message: `Found ${generatedLeads.length} leads using local search engine.`
      });
      
      // Convert to our lead format and add to state
      for (const generatedLead of generatedLeads) {
        const newLead = {
          id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          company: generatedLead.company,
          contact_name: 'Contact Research Needed',
          contact_title: 'Decision Maker',
          email: generatedLead.contactInfo.email || null,
          phone: generatedLead.contactInfo.phone || null,
          location: generatedLead.location,
          industry: generatedLead.industry,
          score: generatedLead.score,
          status: 'new',
          potential_value: estimateLeadValue(generatedLead, searchParams.budgetRange),
          metadata: {
            website: generatedLead.website,
            description: generatedLead.description,
            reasoning: generatedLead.reasoning,
            source: generatedLead.source,
            estimatedSize: generatedLead.estimatedSize
          },
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        addLead(newLead);
      }
      
      addNotification({
        type: 'success',
        title: 'Leads Generated Successfully',
        message: `Found ${generatedLeads.length} qualified leads matching your criteria. Check the Manage Leads tab to review them.`
      });
      
      // Switch to manage tab to show results
      setActiveTab('manage');
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Lead Generation Failed',
        message: error.message || 'Failed to generate leads. Please try again with different criteria.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const estimateLeadValue = (lead: any, budgetRange: string): number => {
    const baseValue = {
      '10k-50k': 30000,
      '50k-100k': 75000,
      '100k-500k': 300000,
      '500k+': 750000
    }[budgetRange] || 50000;
    
    // Adjust based on lead score
    const scoreMultiplier = lead.score / 100;
    return Math.round(baseValue * scoreMultiplier);
  };

  const handleInputChange = (field: keyof LeadSearchParams, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
    setGenerating(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Lead Generation Hub
          </h1>
          <p className="text-white/60">
            AI-powered web search and lead generation using Cognis Digital's advanced search algorithms.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-white text-lg font-bold">{totalLeads}</p>
            <p className="text-white/60 text-sm">Total Leads</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-white text-lg font-bold">{qualificationRate}%</p>
            <p className="text-white/60 text-sm">Qualification Rate</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-white text-lg font-bold">${(totalValue / 1000).toFixed(0)}K</p>
            <p className="text-white/60 text-sm">Total Value</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeTab === 'generate'
              ? 'bg-blue-500/30 text-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Generate Leads
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
            activeTab === 'manage'
              ? 'bg-blue-500/30 text-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Manage Leads ({totalLeads})
        </button>
      </div>

      {/* Search Performance Metrics Section - Architecturally Designed */}
      <div className="mb-8 bg-indigo-900 rounded-3xl p-6 shadow-lg border border-indigo-800">
        <h2 className="text-2xl font-bold text-white mb-6">Search Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Qualification Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <h3 className="text-xl text-white/80 font-medium">Qualification Rate</h3>
              <span className="text-2xl font-bold text-green-400">{qualificationRate}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" 
                style={{ width: `${qualificationRate}%` }}
              ></div>
            </div>
          </div>
          
          {/* Average Lead Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <h3 className="text-xl text-white/80 font-medium">Avg. Lead Score</h3>
              <span className="text-2xl font-bold text-blue-400">{averageScore}</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" 
                style={{ width: `${averageScore}%` }}
              ></div>
            </div>
          </div>
          
          {/* Total Pipeline Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <h3 className="text-xl text-white/80 font-medium">Total Pipeline Value</h3>
              <span className="text-2xl font-bold text-purple-400">${(totalValue / 1000).toFixed(0)}K</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" 
                style={{ width: `${Math.min(totalValue / 100000 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Insights Section - Architecturally Designed */}
      <div className="mb-8 bg-indigo-900/80 rounded-3xl p-6 shadow-lg border border-indigo-800">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-bold text-white">Search Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Web Search Coverage */}
          <div className="bg-indigo-800/40 p-6 rounded-2xl border border-indigo-700/40">
            <h3 className="text-xl font-bold text-blue-400 mb-3">Web Search Coverage</h3>
            <p className="text-white/80">
              Cognis Digital searches across millions of business websites to find qualified prospects matching your criteria.
            </p>
          </div>
          
          {/* Real-time Data */}
          <div className="bg-green-900/20 p-6 rounded-2xl border border-green-800/30">
            <h3 className="text-xl font-bold text-green-400 mb-3">Real-time Data</h3>
            <p className="text-white/80">
              All leads are sourced from live web data, ensuring up-to-date company information and contact details.
            </p>
          </div>
          
          {/* Smart Scoring */}
          <div className="bg-purple-900/20 p-6 rounded-2xl border border-purple-800/30">
            <h3 className="text-xl font-bold text-purple-400 mb-3">Smart Scoring</h3>
            <p className="text-white/80">
              Each lead is automatically scored based on relevance, company profile, and potential value indicators.
            </p>
          </div>
        </div>

        {/* Self-Hosted Instance Info */}
        <div className="mt-4 bg-blue-900/20 p-6 rounded-2xl border border-blue-800/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-blue-400">Self-Hosted Search Engine</h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm">Last Search</p>
              <p className="text-white">{lastSearchDate ? lastSearchDate.toLocaleString() : 'No searches yet'}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Searches</p>
              <p className="text-white">{searchesPerformed}</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'generate' ? (
        /* Lead Generation Tab */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generation Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6" />
                AI Lead Generator
              </h2>

              {!searchService.isConfigured() && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-orange-400 font-medium">Demo Mode Active</h3>
                  </div>
                  <p className="text-white/70 text-sm">
                    Using demo lead data for testing. Real web search will be enabled automatically when API access is available.
                  </p>
                </div>
              )}

              <form onSubmit={handleGenerateLeads} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Target Industry</label>
                    <select 
                      value={searchParams.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    >
                      <option value="">Select industry...</option>
                      <option value="SaaS">SaaS & Technology</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Finance">Financial Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail & E-commerce</option>
                      <option value="Consulting">Consulting Services</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Education">Education & Training</option>
                      <option value="Marketing">Marketing & Advertising</option>
                      <option value="Legal">Legal Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Company Size</label>
                    <select 
                      value={searchParams.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select size...</option>
                      <option value="startup">Startup (1-50)</option>
                      <option value="small">Small (51-200)</option>
                      <option value="medium">Medium (201-1000)</option>
                      <option value="large">Large (1000+)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Location</label>
                    <input
                      type="text"
                      value={searchParams.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Budget Range</label>
                    <select 
                      value={searchParams.budgetRange}
                      onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select range...</option>
                      <option value="10k-50k">$10K - $50K</option>
                      <option value="50k-100k">$50K - $100K</option>
                      <option value="100k-500k">$100K - $500K</option>
                      <option value="500k+">$500K+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Key Requirements</label>
                  <textarea
                    value={searchParams.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="Describe your ideal customer profile and specific needs..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <FeatureGate 
                  feature="leadSearches"
                  incrementOnRender={false}
                  redirectToUpgrade={true}
                >
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Generate Leads ({leadSearchUsage.current}/{leadSearchUsage.limit})
                      </>
                    )}
                  </button>
                </FeatureGate>
              </form>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Search Insights
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Web Search Coverage</h4>
                  <p className="text-white/70 text-sm">Cognis Digital searches across millions of business websites to find qualified prospects matching your criteria.</p>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <h4 className="text-green-400 font-medium mb-2">Real-time Data</h4>
                  <p className="text-white/70 text-sm">All leads are sourced from live web data, ensuring up-to-date company information and contact details.</p>
                </div>

                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <h4 className="text-orange-400 font-medium mb-2">Smart Scoring</h4>
                  <p className="text-white/70 text-sm">Each lead is automatically scored based on relevance, company profile, and potential value indicators.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Search Performance</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Qualification Rate</span>
                  <span className="text-green-400 font-medium">{qualificationRate}%</span>
                </div>
                <div className="bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" style={{ width: `${qualificationRate}%` }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/60">Avg. Lead Score</span>
                  <span className="text-blue-400 font-medium">{averageScore}</span>
                </div>
                <div className="bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: `${averageScore}%` }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Pipeline Value</span>
                  <span className="text-purple-400 font-medium">${(totalValue / 1000).toFixed(0)}K</span>
                </div>
                <div className="bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full" style={{ width: `${Math.min((totalValue / 500000) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lead Management Tab */
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{totalLeads}</p>
              <p className="text-white/60 text-sm">Total Leads</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{qualifiedLeads}</p>
              <p className="text-white/60 text-sm">Qualified</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{averageScore}</p>
              <p className="text-white/60 text-sm">Avg Score</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">${(totalValue / 1000).toFixed(0)}K</p>
              <p className="text-white/60 text-sm">Pipeline Value</p>
            </div>
          </div>
          {/* Leads List */}
          {totalLeads > 0 ? (
            <div className="space-y-4">
            {leads.map((lead) => {
              const StatusIcon = getStatusIcon(lead.status);
              
              return (
                <div
                  key={lead.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Company Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{lead.company}</h3>
                          <p className="text-white/60">{lead.industry}</p>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-white/70">
                          <Mail className="w-4 h-4" />
                          <span>{lead.contact} - {lead.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <MapPin className="w-4 h-4" />
                          <span>{lead.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <ExternalLink className="w-4 h-4" />
                          <span>{lead.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex lg:flex-col gap-6 lg:gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{lead.score}</p>
                        <p className="text-white/60 text-sm">Lead Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">${(lead.value / 1000).toFixed(0)}K</p>
                        <p className="text-white/60 text-sm">Potential Value</p>
                      </div>
                      <div className="text-center">
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(lead.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {lead.status}
                        </div>
                        <p className="text-white/40 text-xs mt-1">{lead.lastActivity}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <button className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm">
                        Contact
                      </button>
                      <button className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Leads Yet</h3>
              <p className="text-white/60 mb-6">
                Search for your first leads using our AI-powered web search technology.
              </p>
              <button
                onClick={() => setActiveTab('generate')}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
              >
                <Globe className="w-4 h-4" />
                Start Searching for Leads
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}