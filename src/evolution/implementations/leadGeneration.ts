import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';
import { withAdaptiveEvolution } from '../core/adaptiveUI';
import { hasFeatureAccess } from './rbacSystem';

/**
 * Lead data model with full contact and company information
 */
export interface Lead {
  id: string;
  company: string;
  industry: string;
  location: string;
  size: string;
  budget: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes: string;
  createdAt: number;
  updatedAt: number;
  lastStatusChange: number;
  history: Array<{
    timestamp: number;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    notes?: string;
  }>;
}

/**
 * Search parameters for lead generation
 */
export interface LeadGenSearchParams {
  industry: string | null;
  location: string | null;
  companySize: string | null;
  budgetRange: string | null;
  requirements: string;
}

/**
 * Lead Generation state with temporal tracking
 */
export interface LeadGenState {
  leads: Record<string, Lead>;
  searchParams: LeadGenSearchParams;
  currentSearch: {
    inProgress: boolean;
    startTime: number | null;
    results: string[];  // Lead IDs
    totalResults: number;
  };
  stats: {
    totalLeads: number;
    qualificationRate: number;
    averageScore: number;
    totalValue: number;
    lastUpdated: number;
  };
  searchHistory: Array<{
    timestamp: number;
    params: LeadGenSearchParams;
    resultCount: number;
    executionTime: number;  // ms
    generatedLeads: string[]; // Lead IDs
  }>;
  demoMode: boolean;
}

// Initialize lead generation state based on the Lead Generation Hub screenshot
const initialLeadGenState: LeadGenState = {
  leads: {},
  searchParams: {
    industry: null,
    location: null,
    companySize: null,
    budgetRange: null,
    requirements: ''
  },
  currentSearch: {
    inProgress: false,
    startTime: null,
    results: [],
    totalResults: 0
  },
  stats: {
    totalLeads: 0,
    qualificationRate: 0,
    averageScore: 0,
    totalValue: 0,
    lastUpdated: Date.now()
  },
  searchHistory: [],
  demoMode: true
};

// Create time-series store for lead generation
export const leadGenStore = createTimeSeriesStore(initialLeadGenState, {
  maxHistory: 50,
  autoSnapshot: true
});

// Register with evolution manager
evolutionManager.registerStateEvolution('leadGeneration', initialLeadGenState);

/**
 * Update search parameters
 * @param params New search parameter values
 */
export const updateSearchParams = (params: Partial<LeadGenSearchParams>): void => {
  const { current } = leadGenStore.getState();
  
  leadGenStore.getState().update({
    searchParams: {
      ...current.searchParams,
      ...params
    }
  });
  
  // Record for analysis
  stateAnalysisEngine.recordTransition(
    { searchParams: current.searchParams },
    { searchParams: { ...current.searchParams, ...params } },
    'update_search_params'
  );
};

/**
 * Recursive function to generate leads based on criteria
 * Demonstrates recursive programming patterns for lead generation
 * 
 * @param count Number of leads to generate
 * @param depth Current recursion depth
 * @param accumulator Accumulated leads
 * @returns Generated leads
 */
export const generateLeads = async (
  count: number = 5, 
  depth: number = 0,
  accumulator: Lead[] = []
): Promise<Lead[]> => {
  // Base case
  if (depth >= count) return accumulator;
  
  const { current } = leadGenStore.getState();
  const params = current.searchParams;
  
  // In demo mode, generate synthetic leads
  if (current.demoMode) {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail'];
    const sizes = ['1-10', '11-50', '51-200', '201-500', '501+'];
    const budgetRanges = ['$10K-$50K', '$50K-$100K', '$100K-$500K', '$500K+'];
    
    // Recursive lead generation with improved pattern matching
    const generateLeadRecursively = (
      requirementsText: string,
      baseScore: number = 50
    ): Lead => {
      // Pattern matching for industry
      const industryMatch = params.industry || 
                           findPatternMatch(requirementsText, industries) || 
                           industries[Math.floor(Math.random() * industries.length)];
      
      // Pattern matching for company size
      const sizeMatch = params.companySize || 
                       findPatternMatch(requirementsText, sizes) || 
                       sizes[Math.floor(Math.random() * sizes.length)];
      
      // Pattern matching for budget
      const budgetMatch = params.budgetRange || 
                         findBudgetRange(requirementsText) || 
                         budgetRanges[Math.floor(Math.random() * budgetRanges.length)];
      
      // Calculate lead score based on match quality
      const scoreFactors = calculateScoreFactors(
        requirementsText,
        industryMatch,
        sizeMatch,
        budgetMatch
      );
      
      const score = Math.min(100, Math.max(0, Math.floor(
        baseScore + 
        (scoreFactors.industryRelevance * 20) +
        (scoreFactors.sizeRelevance * 10) +
        (scoreFactors.budgetRelevance * 15) +
        (Math.random() * 10) // Add some randomness
      )));
      
      const now = Date.now();
      
      return {
        id: `lead-${now}-${Math.random().toString(36).substring(2, 7)}`,
        company: `${generateCompanyName(industryMatch)} ${generateCompanySuffix(industryMatch)}`,
        industry: industryMatch,
        location: params.location || generateLocation(),
        size: sizeMatch,
        budget: budgetMatch,
        contact: {
          name: generateContactName(),
          email: generateEmail(industryMatch),
          phone: generatePhone(),
          position: generatePosition(industryMatch, sizeMatch)
        },
        score,
        status: 'new',
        notes: params.requirements || generateLeadNotes(industryMatch, sizeMatch),
        createdAt: now,
        updatedAt: now,
        lastStatusChange: now,
        history: [{
          timestamp: now,
          status: 'new'
        }]
      };
    };
    
    const lead = generateLeadRecursively(params.requirements || '');
    
    // Continue recursion with timeout to simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(generateLeads(count, depth + 1, [...accumulator, lead]));
      }, 200);
    });
  } else {
    // In real mode, would call actual API
    // Here we just return the accumulator
    return accumulator;
  }
};

/**
 * Perform lead search with recursive lead generation
 * @returns Generated lead IDs
 */
export const searchForLeads = async (): Promise<string[]> => {
  const { current } = leadGenStore.getState();
  
  // Start search
  leadGenStore.getState().update({
    currentSearch: {
      ...current.currentSearch,
      inProgress: true,
      startTime: Date.now(),
      results: [],
      totalResults: 0
    }
  });
  
  // Record search in history
  const startTime = Date.now();
  
  try {
    // Generate leads using our recursive function
    const newLeads = await generateLeads(5);
    const leadMap: Record<string, Lead> = {};
    const leadIds: string[] = [];
    
    // Process new leads
    newLeads.forEach(lead => {
      leadMap[lead.id] = lead;
      leadIds.push(lead.id);
    });
    
    // Record search completion
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Calculate new stats
    const updatedStats = calculateUpdatedStats(current.stats, newLeads);
    
    // Update state with new leads
    leadGenStore.getState().update({
      leads: {
        ...current.leads,
        ...leadMap
      },
      currentSearch: {
        inProgress: false,
        startTime: null,
        results: leadIds,
        totalResults: leadIds.length
      },
      stats: updatedStats,
      searchHistory: [
        ...current.searchHistory,
        {
          timestamp: startTime,
          params: current.searchParams,
          resultCount: leadIds.length,
          executionTime,
          generatedLeads: leadIds
        }
      ]
    });
    
    // Create snapshot after successful search
    leadGenStore.getState().createSnapshot(`lead-search-${startTime}`);
    
    // Record state transition for analysis
    stateAnalysisEngine.recordTransition(
      { leads: current.leads, stats: current.stats },
      { leads: { ...current.leads, ...leadMap }, stats: updatedStats },
      'lead_search'
    );
    
    return leadIds;
  } catch (error) {
    // Handle failure
    leadGenStore.getState().update({
      currentSearch: {
        ...current.currentSearch,
        inProgress: false,
        startTime: null
      }
    });
    
    throw error;
  }
};

/**
 * Update lead status with full state tracking
 * @param leadId Lead identifier
 * @param status New status
 * @param notes Optional notes
 */
export const updateLeadStatus = (
  leadId: string, 
  status: Lead['status'],
  notes?: string
): void => {
  const { current } = leadGenStore.getState();
  const lead = current.leads[leadId];
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  
  const prevStatus = lead.status;
  const timestamp = Date.now();
  
  const updatedHistory = [
    {
      timestamp,
      status,
      notes
    },
    ...lead.history
  ];
  
  leadGenStore.getState().update({
    leads: {
      ...current.leads,
      [leadId]: {
        ...lead,
        status,
        notes: notes || lead.notes,
        updatedAt: timestamp,
        lastStatusChange: timestamp,
        history: updatedHistory
      }
    }
  });
  
  // Update stats after status change
  if (status !== prevStatus) {
    updateStatsAfterStatusChange(leadId, prevStatus, status);
  }
  
  // Track the lead lifecycle change
  stateAnalysisEngine.recordTransition(
    { status: prevStatus },
    { status },
    `lead_status_change_${prevStatus}_to_${status}`
  );
};

/**
 * Toggle demo mode
 * @param enabled Whether demo mode is enabled
 */
export const toggleDemoMode = (enabled: boolean): void => {
  leadGenStore.getState().update({ demoMode: enabled });
};

/**
 * Helper function to find pattern matches in text
 * @param text Text to search in
 * @param patterns Patterns to look for
 * @returns Best matching pattern or null
 */
function findPatternMatch(text: string, patterns: string[]): string | null {
  if (!text) return null;
  
  text = text.toLowerCase();
  
  // Find the pattern with the highest match score
  let bestMatch: { pattern: string, score: number } | null = null;
  
  for (const pattern of patterns) {
    const lowerPattern = pattern.toLowerCase();
    
    // Check for direct inclusion
    if (text.includes(lowerPattern)) {
      return pattern;
    }
    
    // Calculate fuzzy match score
    let score = 0;
    const words = lowerPattern.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && text.includes(word)) {
        score += word.length;
      }
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { pattern, score };
    }
  }
  
  return bestMatch ? bestMatch.pattern : null;
}

/**
 * Find budget range from text
 * @param text Text to search in
 * @returns Matched budget range or null
 */
function findBudgetRange(text: string): string | null {
  if (!text) return null;
  
  // Match patterns like $50K, $100K, $1M, etc.
  const matches = text.match(/\$\s*\d+\s*[KkMm]/g);
  
  if (matches && matches.length > 0) {
    const lowerBound = matches[0].replace(/\s+/g, '');
    
    if (matches.length > 1) {
      const upperBound = matches[1].replace(/\s+/g, '');
      return `${lowerBound}-${upperBound}`;
    }
    
    // If only one bound is mentioned, create a range
    if (lowerBound.includes('K')) {
      const value = parseInt(lowerBound.replace(/[^0-9]/g, ''));
      return `${lowerBound}-$${value * 5}K`;
    } else if (lowerBound.includes('M')) {
      return `${lowerBound}-$${parseInt(lowerBound.replace(/[^0-9]/g, '')) * 2}M`;
    }
    
    return `${lowerBound}+`;
  }
  
  return null;
}

/**
 * Calculate score factors for lead quality
 */
function calculateScoreFactors(
  requirements: string,
  industry: string,
  size: string,
  budget: string
): { industryRelevance: number, sizeRelevance: number, budgetRelevance: number } {
  if (!requirements) {
    return {
      industryRelevance: 0.5,
      sizeRelevance: 0.5,
      budgetRelevance: 0.5
    };
  }
  
  const req = requirements.toLowerCase();
  const ind = industry.toLowerCase();
  
  // Industry relevance - how well does the industry match requirements
  const industryRelevance = req.includes(ind) ? 1 : 
                           ind.split(/\s+/).some(word => req.includes(word) && word.length > 3) ? 0.7 : 0.5;
  
  // Size relevance - check if company size is mentioned
  const sizeRelevance = req.includes(size.toLowerCase()) ? 1 : 0.5;
  
  // Budget relevance - check if budget range aligns with requirements
  const budgetValues = budget.match(/\d+/g);
  const reqValues = req.match(/\d+/g);
  
  let budgetRelevance = 0.5;
  if (budgetValues && reqValues) {
    // Some budget values match requirements
    budgetRelevance = 0.8;
  }
  if (req.includes('budget') && req.includes(budget.toLowerCase())) {
    // Direct budget mention
    budgetRelevance = 1;
  }
  
  return {
    industryRelevance,
    sizeRelevance,
    budgetRelevance
  };
}

/**
 * Calculate updated stats after adding new leads
 */
function calculateUpdatedStats(currentStats: LeadGenState['stats'], newLeads: Lead[]): LeadGenState['stats'] {
  const totalLeads = currentStats.totalLeads + newLeads.length;
  
  // Calculate new average score
  const totalScoreOld = currentStats.averageScore * currentStats.totalLeads;
  const totalScoreNew = newLeads.reduce((sum, lead) => sum + lead.score, 0);
  const averageScore = totalLeads > 0 ? (totalScoreOld + totalScoreNew) / totalLeads : 0;
  
  // For demo, we'll calculate a synthetic value based on scores
  const leadValueEstimates = newLeads.map(lead => {
    const baseValue = lead.score * 200; // $200 per score point
    const multiplier = lead.budget.includes('500K') ? 5 : 
                      lead.budget.includes('100K') ? 2 : 1;
    return baseValue * multiplier;
  });
  
  const totalValue = currentStats.totalValue + 
                    leadValueEstimates.reduce((sum, val) => sum + val, 0);
  
  return {
    totalLeads,
    qualificationRate: totalLeads > 0 ? (totalLeads * 0.3) / totalLeads : 0, // 30% for demo
    averageScore,
    totalValue,
    lastUpdated: Date.now()
  };
}

/**
 * Update stats after changing lead status
 */
function updateStatsAfterStatusChange(
  leadId: string,
  prevStatus: Lead['status'],
  newStatus: Lead['status']
): void {
  const { current } = leadGenStore.getState();
  const lead = current.leads[leadId];
  
  if (!lead) return;
  
  // Clone current stats
  const stats = { ...current.stats };
  
  // Update qualification rate if lead became qualified or unqualified
  if (newStatus === 'qualified' && prevStatus !== 'qualified') {
    stats.qualificationRate = (stats.totalLeads > 0) ?
      (stats.qualificationRate * stats.totalLeads + 1) / stats.totalLeads :
      0;
  } else if (prevStatus === 'qualified' && newStatus !== 'qualified') {
    stats.qualificationRate = (stats.totalLeads > 0) ?
      (stats.qualificationRate * stats.totalLeads - 1) / stats.totalLeads :
      0;
  }
  
  // Cap qualification rate between 0-1
  stats.qualificationRate = Math.min(1, Math.max(0, stats.qualificationRate));
  
  // Update stats
  leadGenStore.getState().update({ stats });
}

/**
 * Generate sample data helpers for demo mode
 */
function generateCompanyName(industry: string): string {
  const techPrefixes = ['Tech', 'Byte', 'Data', 'Cloud', 'Cyber', 'Digi', 'Quantum'];
  const healthPrefixes = ['Health', 'Care', 'Med', 'Bio', 'Life', 'Cure', 'Wellness'];
  const financePrefixes = ['Fin', 'Wealth', 'Asset', 'Capital', 'Trust', 'Money', 'Bank'];
  const retailPrefixes = ['Shop', 'Retail', 'Market', 'Store', 'Consumer', 'Goods'];
  const manufPrefixes = ['Manu', 'Build', 'Craft', 'Industrial', 'Factory', 'Pro', 'Forge'];
  
  const commonWords = ['Nova', 'Global', 'Advanced', 'Smart', 'Prime', 'Peak', 'Elite'];
  
  // Select industry-specific prefix
  let prefixes;
  if (industry.toLowerCase().includes('tech')) {
    prefixes = techPrefixes;
  } else if (industry.toLowerCase().includes('health')) {
    prefixes = healthPrefixes;
  } else if (industry.toLowerCase().includes('finan')) {
    prefixes = financePrefixes;
  } else if (industry.toLowerCase().includes('retail')) {
    prefixes = retailPrefixes;
  } else if (industry.toLowerCase().includes('manufact')) {
    prefixes = manufPrefixes;
  } else {
    prefixes = commonWords;
  }
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const common = commonWords[Math.floor(Math.random() * commonWords.length)];
  
  // 50% chance to combine with common word
  return Math.random() > 0.5 ? `${prefix}${common}` : prefix;
}

function generateCompanySuffix(industry: string): string {
  const techSuffixes = ['Systems', 'Technologies', 'Solutions', 'AI', 'Networks', 'Labs'];
  const healthSuffixes = ['Care', 'Sciences', 'Medical', 'Therapeutics', 'Health'];
  const financeSuffixes = ['Financial', 'Partners', 'Capital', 'Investments', 'Advisors'];
  const retailSuffixes = ['Retail', 'Stores', 'Market', 'Goods', 'Traders', 'Commerce'];
  const manufSuffixes = ['Manufacturing', 'Industries', 'Products', 'Works', 'Builders'];
  
  // Select industry-specific suffix
  let suffixes;
  if (industry.toLowerCase().includes('tech')) {
    suffixes = techSuffixes;
  } else if (industry.toLowerCase().includes('health')) {
    suffixes = healthSuffixes;
  } else if (industry.toLowerCase().includes('finan')) {
    suffixes = financeSuffixes;
  } else if (industry.toLowerCase().includes('retail')) {
    suffixes = retailSuffixes;
  } else if (industry.toLowerCase().includes('manufact')) {
    suffixes = manufSuffixes;
  } else {
    suffixes = [...techSuffixes, ...healthSuffixes, ...financeSuffixes, ...retailSuffixes, ...manufSuffixes];
  }
  
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}

function generateContactName(): string {
  const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Emma', 'John', 'Olivia', 'Robert', 'Sophia'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson'];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generateEmail(industry: string): string {
  const domains = ['gmail.com', 'outlook.com', 'company.com', 'business.net', 'enterprise.org'];
  const name = generateContactName().toLowerCase().replace(' ', '.');
  return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function generatePhone(): string {
  return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generatePosition(industry: string, size: string): string {
  const isSmall = size.includes('1-10') || size.includes('11-50');
  
  const techPositions = isSmall ? ['CTO', 'CEO', 'Founder'] : ['IT Director', 'VP of Engineering', 'CTO'];
  const healthPositions = isSmall ? ['Medical Director', 'CEO'] : ['Chief Medical Officer', 'Healthcare Director'];
  const financePositions = isSmall ? ['CFO', 'CEO'] : ['Financial Director', 'VP of Finance', 'Investment Manager'];
  const retailPositions = isSmall ? ['Owner', 'General Manager'] : ['Purchasing Manager', 'Retail Director'];
  const manufPositions = isSmall ? ['Operations Manager', 'Owner'] : ['Production Manager', 'VP of Operations'];
  const generalPositions = isSmall ? ['CEO', 'Founder', 'Owner'] : ['Director', 'VP', 'Manager', 'Department Head'];
  
  let positions;
  if (industry.toLowerCase().includes('tech')) {
    positions = techPositions;
  } else if (industry.toLowerCase().includes('health')) {
    positions = healthPositions;
  } else if (industry.toLowerCase().includes('finan')) {
    positions = financePositions;
  } else if (industry.toLowerCase().includes('retail')) {
    positions = retailPositions;
  } else if (industry.toLowerCase().includes('manufact')) {
    positions = manufPositions;
  } else {
    positions = generalPositions;
  }
  
  return positions[Math.floor(Math.random() * positions.length)];
}

function generateLocation(): string {
  const cities = ['San Francisco', 'New York', 'Chicago', 'Los Angeles', 'Boston', 'Seattle', 'Austin', 'Denver', 'Miami', 'Dallas'];
  const states = ['CA', 'NY', 'IL', 'CA', 'MA', 'WA', 'TX', 'CO', 'FL', 'TX'];
  
  const index = Math.floor(Math.random() * cities.length);
  return `${cities[index]}, ${states[index]}`;
}

function generateLeadNotes(industry: string, size: string): string {
  const industryNotes = {
    'Technology': 'Looking for technology solutions to improve operations.',
    'Healthcare': 'Seeking healthcare innovations for patient care.',
    'Finance': 'Interested in financial technology and services.',
    'Manufacturing': 'Needs manufacturing optimization and efficiency improvements.',
    'Retail': 'Searching for retail solutions to enhance customer experience.'
  };
  
  const sizeNotes = {
    '1-10': 'Small startup with growing needs.',
    '11-50': 'Expanding company looking to scale operations.',
    '51-200': 'Mid-sized business seeking enterprise solutions.',
    '201-500': 'Large company undergoing digital transformation.',
    '501+': 'Enterprise with complex integration requirements.'
  };
  
  let note = industryNotes[industry] || 'General business inquiry.';
  note += ' ' + (sizeNotes[size] || '');
  
  return note;
}

/**
 * Create adaptive lead generation component
 * @param LeadGenerationComponent Component to enhance
 * @returns Enhanced component with evolution capabilities
 */
export const createAdaptiveLeadGeneration = (LeadGenerationComponent: React.ComponentType<any>) => {
  return withAdaptiveEvolution(
    LeadGenerationComponent,
    'leadGeneration',
    evolutionManager,
    true
  );
};
