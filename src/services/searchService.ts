export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  position: number;
}

export interface LeadSearchParams {
  industry: string;
  companySize: string;
  location: string;
  budgetRange: string;
  requirements: string;
}

export interface GeneratedLead {
  company: string;
  website: string;
  description: string;
  industry: string;
  location: string;
  estimatedSize: string;
  contactInfo: {
    email?: string;
    phone?: string;
    linkedIn?: string;
  };
  score: number;
  reasoning: string;
  source: string;
}

export class SearchService {
  private readonly SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY;
  private readonly SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

  async searchForLeads(params: LeadSearchParams): Promise<GeneratedLead[]> {
    // Import usage service here to avoid circular imports
    const { usageService } = await import('./usageService');
    
    // Check usage before proceeding
    const canProceed = await usageService.trackUsage('lead_generation', 1, {
      industry: params.industry,
      location: params.location,
      companySize: params.companySize
    });
    
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Please upgrade to continue generating leads.');
    }

    try {
      // Build search queries based on user input
      const searchQueries = this.buildSearchQueries(params);
      const allResults: SearchResult[] = [];

      // Execute multiple searches for comprehensive results
      for (const query of searchQueries) {
        const results = await this.executeSearch(query, params.location);
        allResults.push(...results);
      }

      // Process search results into leads
      const leads = await this.processSearchResults(allResults, params);
      
      return leads;
    } catch (error) {
      console.error('Lead search error:', error);
      // Fallback to demo leads if search fails
      return this.generateDemoLeads(params);
    }
  }

  private buildSearchQueries(params: LeadSearchParams): string[] {
    const { industry, companySize, location, budgetRange, requirements } = params;
    
    const queries: string[] = [];
    
    // Primary industry search with contact information
    if (industry && location) {
      queries.push(`"${industry}" companies in "${location}" contact email phone`);
      queries.push(`${industry} businesses "${location}" "contact us" directory`);
    }
    
    // Company size specific searches
    if (companySize && industry) {
      const sizeTerms = {
        'startup': 'startup early stage',
        'small': 'small business SMB',
        'medium': 'mid-size medium enterprise',
        'large': 'large enterprise corporation'
      };
      
      const sizeTerm = sizeTerms[companySize as keyof typeof sizeTerms] || companySize;
      queries.push(`${sizeTerm} ${industry} companies "${location}" contact`);
    }
    
    // Requirements-based searches
    if (requirements) {
      const keywords = requirements.split(' ').filter(word => word.length > 3).slice(0, 3);
      if (keywords.length > 0) {
        queries.push(`companies "${location}" ${keywords.join(' ')} ${industry || ''} contact`);
      }
    }
    
    return queries.slice(0, 3); // Limit to 3 searches to avoid rate limits
  }

  private async executeSearch(query: string, location?: string): Promise<SearchResult[]> {
    // If no API key, return empty results (will fallback to demo)
    if (!this.SERPAPI_KEY) {
      console.warn('SerpApi key not configured, using demo data');
      return [];
    }

    try {
      const url = new URL(this.SERPAPI_BASE_URL);
      url.searchParams.set('api_key', this.SERPAPI_KEY);
      url.searchParams.set('engine', 'google');
      url.searchParams.set('q', query);
      url.searchParams.set('num', '10');
      url.searchParams.set('safe', 'active');
      
      // Add location parameter if provided
      if (location) {
        url.searchParams.set('location', location);
      }
      
      // Add filters for business results
      url.searchParams.set('tbm', ''); // Regular search
      url.searchParams.set('filter', '1'); // Enable similar results filter

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`SerpApi error (${response.status}): ${errorText}`);
        return [];
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn('SerpApi error:', data.error);
        return [];
      }
      
      return (data.organic_results || []).map((item: any, index: number) => ({
        title: item.title || '',
        url: item.link || '',
        snippet: item.snippet || '',
        domain: item.displayed_link ? new URL(item.link).hostname : '',
        position: index + 1
      })).filter((result: SearchResult) => result.title && result.url);
      
    } catch (error) {
      console.warn('Search execution failed, using demo data:', error);
      return [];
    }
  }

  private async processSearchResults(results: SearchResult[], params: LeadSearchParams): Promise<GeneratedLead[]> {
    if (results.length === 0) {
      return this.generateDemoLeads(params);
    }

    // Group results by domain to avoid duplicates
    const uniqueDomains = new Map<string, SearchResult>();
    results.forEach(result => {
      if (result.domain && !uniqueDomains.has(result.domain)) {
        uniqueDomains.set(result.domain, result);
      }
    });

    const uniqueResults = Array.from(uniqueDomains.values()).slice(0, 10);
    const leads: GeneratedLead[] = [];

    // Process each unique result
    for (const result of uniqueResults) {
      try {
        const lead = await this.extractLeadFromResult(result, params);
        if (lead) {
          leads.push(lead);
        }
      } catch (error) {
        console.error('Error processing search result:', error);
      }
    }

    // If we don't have enough leads, supplement with demo data
    if (leads.length < 5) {
      const demoLeads = this.generateDemoLeads(params);
      leads.push(...demoLeads.slice(0, 5 - leads.length));
    }

    return leads.slice(0, 10); // Return max 10 leads
  }

  private estimateLeadValue(lead: any, budgetRange: string): number {
    const baseValue = {
      '10k-50k': 30000,
      '50k-100k': 75000,
      '100k-500k': 300000,
      '500k+': 750000
    }[budgetRange] || 50000;
    
    // Adjust based on lead score
    const scoreMultiplier = lead.score / 100;
    return Math.round(baseValue * scoreMultiplier);
  }

  private async extractLeadFromResult(result: SearchResult, params: LeadSearchParams): Promise<GeneratedLead | null> {
    try {
      // Extract company name from domain or title
      const company = this.extractCompanyName(result.domain, result.title);
      
      // Analyze search result for business information
      const analysis = this.analyzeSearchResult(result, params);
      
      return {
        company,
        website: result.url,
        description: result.snippet,
        industry: params.industry || analysis.estimatedIndustry,
        location: params.location || analysis.estimatedLocation,
        estimatedSize: params.companySize || analysis.estimatedSize,
        contactInfo: analysis.contactInfo,
        score: analysis.score,
        reasoning: analysis.reasoning,
        source: 'SerpApi Google Search'
      };
    } catch (error) {
      console.error('Error extracting lead:', error);
      return null;
    }
  }

  private extractCompanyName(domain: string, title: string): string {
    // Remove common TLDs and subdomains
    const cleanDomain = domain
      .replace(/^www\./, '')
      .replace(/\.(com|org|net|io|co|ai|tech|biz|info)$/, '')
      .split('.')[0];
    
    // Capitalize and format domain name
    const fromDomain = cleanDomain
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Try to extract company name from title
    const titleWords = title.split(' ');
    const potentialCompany = titleWords.slice(0, 3).join(' ');
    
    // Clean up common title suffixes
    const cleanTitle = potentialCompany
      .replace(/\s*-\s*.*$/, '') // Remove everything after dash
      .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe
      .replace(/\s*:.*$/, '') // Remove everything after colon
      .trim();
    
    // Return the more professional-looking option
    if (cleanTitle.length > 3 && cleanTitle.length < 50 && !cleanTitle.toLowerCase().includes('search')) {
      return cleanTitle;
    }
    
    return fromDomain || 'Unknown Company';
  }

  private analyzeSearchResult(result: SearchResult, params: LeadSearchParams) {
    const snippet = result.snippet.toLowerCase();
    const title = result.title.toLowerCase();
    const content = `${title} ${snippet}`;
    
    // Estimate company size based on content analysis
    let estimatedSize = 'small';
    if (content.includes('enterprise') || content.includes('corporation') || content.includes('fortune') || content.includes('global')) {
      estimatedSize = 'large';
    } else if (content.includes('medium') || content.includes('mid-size') || content.includes('growing') || content.includes('established')) {
      estimatedSize = 'medium';
    } else if (content.includes('startup') || content.includes('early stage') || content.includes('founded')) {
      estimatedSize = 'startup';
    }

    // Extract potential contact information using improved regex
    const emailMatch = snippet.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = snippet.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    
    // Look for LinkedIn profiles
    const linkedInMatch = result.url.includes('linkedin.com') || snippet.includes('linkedin');
    
    // Calculate lead score based on multiple factors
    let score = 40; // Base score
    
    // Industry relevance boost
    if (params.industry && content.includes(params.industry.toLowerCase())) {
      score += 25;
    }
    
    // Location relevance boost
    if (params.location && content.includes(params.location.toLowerCase())) {
      score += 20;
    }
    
    // Contact information boost
    if (emailMatch) score += 15;
    if (phoneMatch) score += 10;
    if (linkedInMatch) score += 5;
    
    // Business indicators boost
    const businessIndicators = [
      'services', 'solutions', 'consulting', 'technology', 'software',
      'company', 'corporation', 'inc', 'llc', 'ltd', 'business'
    ];
    const businessMatches = businessIndicators.filter(indicator => content.includes(indicator)).length;
    score += Math.min(businessMatches * 3, 15);
    
    // Quality indicators boost
    const qualityIndicators = ['about us', 'contact us', 'team', 'leadership', 'careers'];
    const qualityMatches = qualityIndicators.filter(indicator => content.includes(indicator)).length;
    score += Math.min(qualityMatches * 2, 10);
    
    // Position boost (higher ranking = more relevant)
    if (result.position <= 3) score += 10;
    else if (result.position <= 5) score += 5;
    
    // Cap score at 100
    score = Math.min(score, 100);

    // Generate reasoning
    const reasons = [];
    if (params.industry && content.includes(params.industry.toLowerCase())) {
      reasons.push('industry match');
    }
    if (params.location && content.includes(params.location.toLowerCase())) {
      reasons.push('location match');
    }
    if (emailMatch || phoneMatch) {
      reasons.push('contact info available');
    }
    if (businessMatches > 0) {
      reasons.push('business indicators present');
    }
    if (result.position <= 5) {
      reasons.push('high search ranking');
    }

    const reasoning = `Score: ${score}/100. ${reasons.length > 0 ? `Positive factors: ${reasons.join(', ')}.` : 'Basic business profile detected.'} Found via SerpApi Google search.`;

    return {
      estimatedIndustry: params.industry || this.guessIndustryFromContent(content),
      estimatedLocation: params.location || this.guessLocationFromContent(content),
      estimatedSize,
      contactInfo: {
        email: emailMatch?.[0],
        phone: phoneMatch?.[0],
        linkedIn: linkedInMatch ? result.url : undefined
      },
      score,
      reasoning
    };
  }

  private guessIndustryFromContent(content: string): string {
    const industryKeywords = {
      'Technology': ['software', 'tech', 'digital', 'app', 'platform', 'saas', 'cloud'],
      'Healthcare': ['health', 'medical', 'hospital', 'clinic', 'pharmaceutical'],
      'Finance': ['financial', 'bank', 'investment', 'insurance', 'accounting'],
      'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial'],
      'Retail': ['retail', 'store', 'shop', 'ecommerce', 'marketplace'],
      'Consulting': ['consulting', 'advisory', 'strategy', 'management'],
      'Real Estate': ['real estate', 'property', 'housing', 'commercial'],
      'Education': ['education', 'school', 'university', 'training', 'learning']
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return industry;
      }
    }

    return 'Business Services';
  }

  private guessLocationFromContent(content: string): string {
    // Common US cities and states
    const locations = [
      'San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Boston', 'Seattle',
      'Austin', 'Denver', 'Atlanta', 'Miami', 'Dallas', 'Phoenix', 'California',
      'Texas', 'Florida', 'New York', 'Illinois', 'Washington'
    ];

    for (const location of locations) {
      if (content.includes(location.toLowerCase())) {
        return location;
      }
    }

    return 'United States';
  }

  private generateDemoLeads(params: LeadSearchParams): GeneratedLead[] {
    const demoCompanies = [
      {
        name: 'TechFlow Solutions',
        industry: 'Technology',
        size: 'medium',
        location: 'San Francisco, CA',
        description: 'Leading provider of enterprise software solutions for modern businesses.',
        email: 'contact@techflow.com',
        phone: '+1 (555) 123-4567'
      },
      {
        name: 'Global Manufacturing Inc',
        industry: 'Manufacturing',
        size: 'large',
        location: 'Chicago, IL',
        description: 'Industrial manufacturing company specializing in automotive components.',
        email: 'info@globalmanuf.com',
        phone: '+1 (555) 987-6543'
      },
      {
        name: 'DataSync Analytics',
        industry: 'Technology',
        size: 'startup',
        location: 'Austin, TX',
        description: 'Data analytics startup helping businesses make data-driven decisions.',
        email: 'hello@datasync.io',
        phone: '+1 (555) 456-7890'
      },
      {
        name: 'CloudVision Systems',
        industry: 'Technology',
        size: 'medium',
        location: 'Seattle, WA',
        description: 'Cloud infrastructure and DevOps consulting services.',
        email: 'contact@cloudvision.com',
        phone: '+1 (555) 234-5678'
      },
      {
        name: 'InnovateTech Labs',
        industry: 'Technology',
        size: 'small',
        location: 'Boston, MA',
        description: 'R&D lab focused on emerging technologies and innovation.',
        email: 'info@innovatetech.com',
        phone: '+1 (555) 345-6789'
      },
      {
        name: 'NextGen Analytics',
        industry: 'Consulting',
        size: 'small',
        location: 'Denver, CO',
        description: 'Business intelligence and analytics consulting firm.',
        email: 'contact@nextgenanalytics.com',
        phone: '+1 (555) 567-8901'
      }
    ];

    // Filter demo companies based on search criteria
    let filteredCompanies = demoCompanies;
    
    if (params.industry) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.industry.toLowerCase().includes(params.industry.toLowerCase()) ||
        params.industry.toLowerCase().includes(company.industry.toLowerCase())
      );
    }
    
    if (params.companySize) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.size === params.companySize
      );
    }

    // If no matches, use all demo companies
    if (filteredCompanies.length === 0) {
      filteredCompanies = demoCompanies;
    }

    return filteredCompanies.slice(0, 6).map((company, index) => ({
      company: company.name,
      website: `https://${company.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
      description: company.description,
      industry: company.industry,
      location: params.location || company.location,
      estimatedSize: company.size,
      contactInfo: {
        email: company.email,
        phone: company.phone
      },
      score: Math.floor(Math.random() * 20) + 80, // 80-100 score range for demo
      reasoning: `Demo lead matching your ${params.industry || 'business'} criteria. High score due to industry alignment and complete contact information.`,
      source: 'Demo Data (SerpApi Ready)'
    }));
  }

  isConfigured(): boolean {
    return !!this.SERPAPI_KEY;
  }
}

export const searchService = new SearchService();