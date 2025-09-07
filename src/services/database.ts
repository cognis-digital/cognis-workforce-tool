// Browser-compatible in-memory database service
// Replaces better-sqlite3 with JavaScript objects for WebContainer compatibility

interface DatabaseTable {
  [key: string]: any[];
}

// In-memory database storage
const _inMemoryStore: DatabaseTable = {
  organizations: [],
  user_profiles: [],
  ai_agents: [],
  knowledge_bases: [],
  knowledge_items: [],
  agent_interactions: [],
  leads: []
};

// Initialize database with schema and demo data
const initDatabase = () => {
  // Clear existing data
  Object.keys(_inMemoryStore).forEach(table => {
    _inMemoryStore[table] = [];
  });

  // Insert demo data
  insertDemoData();
};

const insertDemoData = () => {
  // Demo organization
  const orgId = 'demo-org-id';
  _inMemoryStore.organizations.push({
    id: orgId,
    name: 'Demo Organization',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Demo user profile
  const userId = 'demo-user-id';
  _inMemoryStore.user_profiles.push({
    id: 'demo-profile-id',
    user_id: userId,
    org_id: orgId,
    display_name: 'Demo User',
    role: 'demo',
    tier: 'free', // Demo user starts with free tier for testing
    trial_ends_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Demo AI agents
  const agents = [
    {
      id: 'agent-1',
      org_id: orgId,
      name: 'Sales Agent Pro',
      role: 'Sales Specialist',
      description: 'Advanced AI agent specialized in B2B sales processes',
      status: 'active',
      model_config: {},
      capabilities: ['Lead Analysis', 'Proposal Creation', 'CRM Integration'],
      tasks_completed: 142,
      accuracy: 98,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'agent-2',
      org_id: orgId,
      name: 'Research Assistant',
      role: 'Market Researcher',
      description: 'AI-powered research agent for market analysis',
      status: 'active',
      model_config: {},
      capabilities: ['Data Collection', 'Trend Analysis', 'Report Generation'],
      tasks_completed: 89,
      accuracy: 95,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'agent-3',
      org_id: orgId,
      name: 'Business Dev AI',
      role: 'Business Development',
      description: 'Strategic AI agent focused on business development',
      status: 'training',
      model_config: {},
      capabilities: ['Partnership Analysis', 'Strategy Planning', 'ROI Calculation'],
      tasks_completed: 34,
      accuracy: 87,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  _inMemoryStore.ai_agents.push(...agents);

  // Demo knowledge bases
  const knowledgeBases = [
    {
      id: 'kb-1',
      org_id: orgId,
      name: 'Market Analysis Q1 2025',
      description: 'Comprehensive market research and analysis',
      size_bytes: 2400000,
      status: 'ready',
      accuracy: 98,
      usage_count: 87,
      agents_connected: 3,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'kb-2',
      org_id: orgId,
      name: 'Competitor Research',
      description: 'Detailed competitor analysis and insights',
      size_bytes: 15800000,
      status: 'ready',
      accuracy: 95,
      usage_count: 76,
      agents_connected: 2,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  _inMemoryStore.knowledge_bases.push(...knowledgeBases);

  // Demo leads
  const leads = [
    {
      id: 'lead-1',
      org_id: orgId,
      company: 'TechFlow Solutions',
      contact_name: 'Sarah Chen',
      contact_title: 'VP of Operations',
      email: 'sarah.chen@techflow.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      industry: 'SaaS',
      score: 92,
      status: 'qualified',
      potential_value: 45000,
      metadata: {},
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'lead-2',
      org_id: orgId,
      company: 'Global Manufacturing Inc',
      contact_name: 'Michael Rodriguez',
      contact_title: 'Chief Technology Officer',
      email: 'mrodriguez@globalmanuf.com',
      phone: '+1 (555) 987-6543',
      location: 'Chicago, IL',
      industry: 'Manufacturing',
      score: 88,
      status: 'proposal',
      potential_value: 120000,
      metadata: {},
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  _inMemoryStore.leads.push(...leads);
};

// Database service class
export class DatabaseService {
  // Current session storage
  private currentSession: any = null;
  private authListeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    initDatabase();
  }

  // Auth property to match Supabase client API
  auth = {
    getSession: async () => {
      const sessionId = localStorage.getItem('mock_session_id');
      if (sessionId && this.currentSession) {
        return { data: { session: this.currentSession }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      if (this.currentSession) {
        return { data: { user: this.currentSession.user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.authListeners.push(callback);
      return {
        data: { subscription: { unsubscribe: () => {
          const index = this.authListeners.indexOf(callback);
          if (index > -1) {
            this.authListeners.splice(index, 1);
          }
        }}},
        error: null
      };
    },

    signOut: async () => {
      this.currentSession = null;
      localStorage.removeItem('mock_session_id');
      this.authListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    }
  };

  // Legacy auth methods (keeping for backward compatibility)
  signInWithPassword(email: string, password: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'demo@cognis.digital' && password === 'demo123') {
          const user = {
            id: 'demo-user-id',
            email: 'demo@cognis.digital',
            created_at: new Date().toISOString()
          };
          const session = { user, access_token: 'mock-token', expires_at: Date.now() + 3600000 };
          this.currentSession = session;
          localStorage.setItem('mock_session_id', 'demo-session');
          this.authListeners.forEach(listener => listener('SIGNED_IN', session));
          resolve({ data: { user, session }, error: null });
        } else if (email && password) {
          const user = {
            id: `user-${Date.now()}`,
            email,
            created_at: new Date().toISOString()
          };
          const session = { user, access_token: 'mock-token', expires_at: Date.now() + 3600000 };
          this.currentSession = session;
          localStorage.setItem('mock_session_id', `session-${Date.now()}`);
          this.authListeners.forEach(listener => listener('SIGNED_IN', session));
          resolve({ data: { user, session }, error: null });
        } else {
          resolve({ data: { user: null, session: null }, error: { message: 'Invalid credentials' } });
        }
      }, 500);
    });
  }

  signUp(email: string, password: string, orgName?: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = {
          id: `user-${Date.now()}`,
          email,
          created_at: new Date().toISOString()
        };
        const session = { user, access_token: 'mock-token', expires_at: Date.now() + 3600000 };
        this.currentSession = session;
        localStorage.setItem('mock_session_id', `session-${Date.now()}`);
        this.authListeners.forEach(listener => listener('SIGNED_IN', session));
        resolve({ data: { user, session }, error: null });
      }, 500);
    });
  }

  // Table operations
  from(table: string) {
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => this.selectSingle(table, columns, column, value),
          limit: (count: number) => this.selectMany(table, columns, column, value, count)
        }),
        order: (column: string, options?: { ascending: boolean }) => ({
          limit: (count: number) => this.selectMany(table, columns, null, null, count)
        }),
        single: () => this.selectSingle(table, columns),
        limit: (count: number) => this.selectMany(table, columns, null, null, count)
      }),
      insert: (data: any[]) => ({
        select: () => ({
          single: () => this.insert(table, data[0])
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => this.update(table, data, column, value)
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => this.delete(table, column, value)
      })
    };
  }

  private selectSingle(table: string, columns: string, whereColumn?: string, whereValue?: any) {
    try {
      const tableData = _inMemoryStore[table] || [];
      let result;
      
      if (whereColumn && whereValue !== undefined) {
        result = tableData.find(row => row[whereColumn] === whereValue);
      } else {
        result = tableData[0];
      }
      
      return Promise.resolve({ data: result || null, error: null });
    } catch (error) {
      return Promise.resolve({ data: null, error });
    }
  }

  private selectMany(table: string, columns: string, whereColumn?: string, whereValue?: any, limit?: number) {
    try {
      const tableData = _inMemoryStore[table] || [];
      let results = tableData;
      
      if (whereColumn && whereValue !== undefined) {
        results = tableData.filter(row => row[whereColumn] === whereValue);
      }
      
      if (limit) {
        results = results.slice(0, limit);
      }
      
      return Promise.resolve({ data: results, error: null });
    } catch (error) {
      return Promise.resolve({ data: [], error });
    }
  }

  private insert(table: string, data: any) {
    try {
      const id = data.id || `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newRecord = {
        ...data,
        id,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      _inMemoryStore[table] = _inMemoryStore[table] || [];
      _inMemoryStore[table].push(newRecord);
      
      return Promise.resolve({ data: newRecord, error: null });
    } catch (error) {
      return Promise.resolve({ data: null, error });
    }
  }

  private update(table: string, data: any, whereColumn: string, whereValue: any) {
    try {
      const tableData = _inMemoryStore[table] || [];
      const index = tableData.findIndex(row => row[whereColumn] === whereValue);
      
      if (index !== -1) {
        tableData[index] = {
          ...tableData[index],
          ...data,
          updated_at: new Date().toISOString()
        };
        return Promise.resolve({ data: tableData[index], error: null });
      }
      
      return Promise.resolve({ data: null, error: { message: 'Record not found' } });
    } catch (error) {
      return Promise.resolve({ data: null, error });
    }
  }

  private delete(table: string, whereColumn: string, whereValue: any) {
    try {
      const tableData = _inMemoryStore[table] || [];
      const index = tableData.findIndex(row => row[whereColumn] === whereValue);
      
      if (index !== -1) {
        tableData.splice(index, 1);
      }
      
      return Promise.resolve({ error: null });
    } catch (error) {
      return Promise.resolve({ error });
    }
  }

  // Functions simulation
  functions = {
    invoke: (functionName: string, options: any) => {
      return this.simulateEdgeFunction(functionName, options);
    }
  };

  private async simulateEdgeFunction(functionName: string, options: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (functionName) {
      case 'ai-chat':
        return this.simulateAIChat(options.body);
      case 'create-checkout':
        return this.simulateCreateCheckout(options.body);
      default:
        return { data: null, error: { message: 'Function not found' } };
    }
  }

  private async simulateAIChat(request: any) {
    const { agentId, messages } = request;
    
    // Get agent info
    const agentData = _inMemoryStore.ai_agents.find(agent => agent.id === agentId);
    if (!agentData) {
      return { data: null, error: { message: 'Agent not found' } };
    }

    // Simulate AI response
    const responses = [
      "I've analyzed your request and here's my recommendation based on current market data...",
      "Based on the information provided, I suggest the following strategic approach...",
      "I've processed your query and identified several key opportunities for optimization...",
      "After reviewing the data, here are the actionable insights I've generated..."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Log interaction
    const interaction = {
      id: `interaction-${Date.now()}`,
      agent_id: agentId,
      user_id: 'demo-user-id',
      prompt: messages[messages.length - 1]?.content || '',
      response: response,
      tokens_used: Math.floor(Math.random() * 500) + 100,
      duration_ms: Math.floor(Math.random() * 2000) + 500,
      blockchain_tx_hash: null,
      created_at: new Date().toISOString()
    };

    _inMemoryStore.agent_interactions.push(interaction);

    // Update agent stats
    const agent = _inMemoryStore.ai_agents.find(a => a.id === agentId);
    if (agent) {
      agent.tasks_completed += 1;
      agent.updated_at = new Date().toISOString();
    }

    return {
      data: {
        message: response,
        usage: { total_tokens: Math.floor(Math.random() * 500) + 100 },
        agent: agentData.name
      },
      error: null
    };
  }

  private async simulateCreateCheckout(request: any) {
    // Simulate Stripe checkout creation
    return {
      data: { url: 'https://checkout.stripe.com/demo-session' },
      error: null
    };
  }
}

export const database = new DatabaseService();