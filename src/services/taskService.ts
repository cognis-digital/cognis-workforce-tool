import { database } from './database';
import { openaiService } from './openai';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { usageService } from './usageService';

export interface Task {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  agentType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  deliverableFormat: 'pdf' | 'csv' | 'docx' | 'json' | 'code' | 'markdown';
  parameters: Record<string, any>;
  result?: {
    content: string;
    downloadUrl?: string;
    tokensUsed: number;
    cost: number;
    completedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  agentType: string;
  defaultFormat: string;
  parameters: Array<{
    name: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>;
}

export interface TokenUsage {
  agentId: string;
  taskId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: string;
}

export class TaskService {
  private readonly COST_PER_TOKEN = 0.00003; // $0.03 per 1K tokens
  private readonly MARKUP_MULTIPLIER = 1.5; // 50% markup
  private readonly FREE_DOWNLOADS = 3;

  async createTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Task> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');

    // Check usage limit before creating task
    const canProceed = await usageService.trackUsage('task_assignment', 1, {
      agentId: taskData.agentId,
      taskType: taskData.deliverableFormat,
      priority: taskData.priority
    });
    
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Please upgrade to continue assigning tasks.');
    }

    const task: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to store
    useAppStore.getState().addTask(task);

    // Start processing immediately
    this.processTask(task.id);

    return task;
  }

  async processTask(taskId: string): Promise<void> {
    const tasks = useAppStore.getState().tasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    // Update status to in_progress
    useAppStore.getState().updateTask(taskId, { 
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    });

    try {
      // Get agent configuration
      const agents = useAppStore.getState().agents;
      const agent = agents.find(a => a.id === task.agentId);
      if (!agent) throw new Error('Agent not found');

      // Generate content based on agent type and task parameters
      const content = await this.generateDeliverable(agent, task);
      
      // Calculate costs
      const tokensUsed = this.estimateTokens(content);
      const cost = this.calculateCost(tokensUsed);

      // Create downloadable file
      const downloadUrl = await this.createDownloadableFile(content, task.deliverableFormat, task.title);

      // Update task with results
      useAppStore.getState().updateTask(taskId, {
        status: 'completed',
        result: {
          content,
          downloadUrl,
          tokensUsed,
          cost,
          completedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });

      // Track token usage
      this.trackTokenUsage({
        agentId: task.agentId,
        taskId: task.id,
        promptTokens: Math.floor(tokensUsed * 0.3),
        completionTokens: Math.floor(tokensUsed * 0.7),
        totalTokens: tokensUsed,
        cost,
        timestamp: new Date().toISOString()
      });

      // Add notification
      useAppStore.getState().addNotification({
        type: 'success',
        title: 'Task Completed',
        message: `${task.title} has been completed by ${agent.name}. Ready for download.`
      });

    } catch (error) {
      console.error('Task processing failed:', error);
      
      useAppStore.getState().updateTask(taskId, {
        status: 'failed',
        updatedAt: new Date().toISOString()
      });

      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Task Failed',
        message: `Failed to complete ${task.title}. Please try again.`
      });
    }
  }

  private async generateDeliverable(agent: any, task: Task): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(agent, task);
    const userPrompt = this.buildUserPrompt(task);

    try {
      const response = await openaiService.createChatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: agent.model_config?.model || 'gpt-4',
        temperature: agent.model_config?.temperature || 0.7,
        max_tokens: agent.model_config?.max_tokens || 2000
      });

      return response.choices[0]?.message?.content || 'Failed to generate content';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate deliverable content');
    }
  }

  private buildSystemPrompt(agent: any, task: Task): string {
    return `You are ${agent.name}, a ${agent.role} powered by Cognis Digital's advanced AI technology.

Your expertise: ${agent.description}
Your capabilities: ${agent.capabilities?.join(', ') || 'General assistance'}
Your personality: ${agent.personality || 'Professional and helpful'}
Your response style: ${agent.responseStyle || 'Clear and comprehensive'}

You are tasked with creating a ${task.deliverableFormat.toUpperCase()} deliverable for: ${task.title}

IMPORTANT INSTRUCTIONS:
- Generate professional, production-ready content
- Format your response appropriately for ${task.deliverableFormat} output
- Include actionable insights and recommendations
- Maintain Cognis Digital branding and professionalism
- Ensure content is comprehensive and valuable
- Do not mention OpenAI or any other AI providers - you are powered by Cognis Digital AI

${task.deliverableFormat === 'pdf' ? 'Structure your response with clear headings, sections, and bullet points suitable for PDF formatting.' : ''}
${task.deliverableFormat === 'csv' ? 'Provide data in CSV format with proper headers and structured rows.' : ''}
${task.deliverableFormat === 'code' ? 'Generate clean, well-commented code with proper documentation.' : ''}
${task.deliverableFormat === 'markdown' ? 'Use proper markdown formatting with headers, lists, and emphasis.' : ''}`;
  }

  private buildUserPrompt(task: Task): string {
    let prompt = `Task: ${task.title}\n\nDescription: ${task.description}`;
    
    if (task.parameters && Object.keys(task.parameters).length > 0) {
      prompt += '\n\nAdditional Parameters:\n';
      Object.entries(task.parameters).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
    }

    if (task.deadline) {
      prompt += `\n\nDeadline: ${task.deadline}`;
    }

    prompt += `\n\nPlease generate a comprehensive ${task.deliverableFormat.toUpperCase()} deliverable that addresses all aspects of this task.`;

    return prompt;
  }

  private async createDownloadableFile(content: string, format: string, title: string): Promise<string> {
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${format}`;
    
    let blob: Blob;
    let mimeType: string;

    switch (format) {
      case 'pdf':
        // In a real implementation, you'd use a PDF library like jsPDF
        blob = new Blob([content], { type: 'text/plain' });
        mimeType = 'application/pdf';
        break;
      case 'csv':
        blob = new Blob([content], { type: 'text/csv' });
        mimeType = 'text/csv';
        break;
      case 'docx':
        blob = new Blob([content], { type: 'text/plain' });
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'json':
        blob = new Blob([content], { type: 'application/json' });
        mimeType = 'application/json';
        break;
      case 'code':
        blob = new Blob([content], { type: 'text/plain' });
        mimeType = 'text/plain';
        break;
      default:
        blob = new Blob([content], { type: 'text/markdown' });
        mimeType = 'text/markdown';
    }

    // Create download URL
    const url = URL.createObjectURL(blob);
    return url;
  }

  private estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }

  private calculateCost(tokens: number): number {
    const baseCost = tokens * this.COST_PER_TOKEN;
    return baseCost * this.MARKUP_MULTIPLIER;
  }

  private trackTokenUsage(usage: TokenUsage): void {
    const currentUsage = useAppStore.getState().tokenUsage;
    useAppStore.getState().setTokenUsage([...currentUsage, usage]);
  }

  async downloadDeliverable(taskId: string): Promise<void> {
    const user = useAuthStore.getState().user;
    const userProfile = useAuthStore.getState().userProfile;
    if (!user || !userProfile) throw new Error('User not authenticated');

    // Check download limits for free users
    if (userProfile.tier === 'free') {
      const userDownloads = useAppStore.getState().userDownloads;
      const userDownloadCount = userDownloads.filter(d => d.userId === user.id).length;
      
      if (userDownloadCount >= this.FREE_DOWNLOADS) {
        useAppStore.getState().addNotification({
          type: 'warning',
          title: 'Download Limit Reached',
          message: 'You have reached your free download limit. Upgrade to Pro for unlimited downloads.'
        });
        
        // Trigger upgrade modal
        useAppStore.getState().setActiveModal('upgrade');
        return;
      }
    }

    const tasks = useAppStore.getState().tasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.result?.downloadUrl) {
      throw new Error('Task or download URL not found');
    }

    // Track download
    useAppStore.getState().addUserDownload({
      id: `download-${Date.now()}`,
      userId: user.id,
      taskId: taskId,
      fileName: `${task.title}.${task.deliverableFormat}`,
      cost: task.result.cost,
      timestamp: new Date().toISOString()
    });

    // Trigger download
    const link = document.createElement('a');
    link.href = task.result.downloadUrl;
    link.download = `${task.title}.${task.deliverableFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    useAppStore.getState().addNotification({
      type: 'success',
      title: 'Download Started',
      message: `${task.title} is being downloaded.`
    });
  }

  getTaskTemplates(): TaskTemplate[] {
    return [
      {
        id: 'market-analysis',
        name: 'Market Analysis Report',
        description: 'Comprehensive market research and competitive analysis',
        agentType: 'analyst',
        defaultFormat: 'pdf',
        parameters: [
          { name: 'industry', type: 'text', required: true, placeholder: 'e.g., SaaS, Healthcare, Finance' },
          { name: 'region', type: 'text', required: true, placeholder: 'e.g., North America, Europe, Global' },
          { name: 'timeframe', type: 'select', required: true, options: ['Q1 2025', 'Q2 2025', 'H1 2025', 'Full Year 2025'] },
          { name: 'competitors', type: 'textarea', required: false, placeholder: 'List key competitors to analyze' }
        ]
      },
      {
        id: 'content-strategy',
        name: 'Content Marketing Strategy',
        description: 'Complete content marketing plan with calendar and topics',
        agentType: 'content',
        defaultFormat: 'pdf',
        parameters: [
          { name: 'brand', type: 'text', required: true, placeholder: 'Your brand name' },
          { name: 'audience', type: 'text', required: true, placeholder: 'Target audience description' },
          { name: 'platforms', type: 'textarea', required: true, placeholder: 'Social media platforms and channels' },
          { name: 'duration', type: 'select', required: true, options: ['1 Month', '3 Months', '6 Months', '1 Year'] }
        ]
      },
      {
        id: 'sales-proposal',
        name: 'Sales Proposal Generator',
        description: 'Professional sales proposal with pricing and terms',
        agentType: 'sales',
        defaultFormat: 'pdf',
        parameters: [
          { name: 'clientName', type: 'text', required: true, placeholder: 'Client company name' },
          { name: 'projectScope', type: 'textarea', required: true, placeholder: 'Describe the project scope' },
          { name: 'budget', type: 'number', required: true, placeholder: 'Estimated budget' },
          { name: 'timeline', type: 'text', required: true, placeholder: 'Project timeline' }
        ]
      },
      {
        id: 'code-review',
        name: 'Code Review & Analysis',
        description: 'Comprehensive code review with recommendations',
        agentType: 'technical',
        defaultFormat: 'markdown',
        parameters: [
          { name: 'language', type: 'select', required: true, options: ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust'] },
          { name: 'codebase', type: 'textarea', required: true, placeholder: 'Paste your code here' },
          { name: 'reviewType', type: 'select', required: true, options: ['Security', 'Performance', 'Best Practices', 'Full Review'] }
        ]
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis Report',
        description: 'Statistical analysis and insights from your data',
        agentType: 'analyst',
        defaultFormat: 'csv',
        parameters: [
          { name: 'dataSource', type: 'text', required: true, placeholder: 'Describe your data source' },
          { name: 'analysisType', type: 'select', required: true, options: ['Descriptive', 'Predictive', 'Prescriptive', 'Diagnostic'] },
          { name: 'metrics', type: 'textarea', required: true, placeholder: 'Key metrics to analyze' }
        ]
      },
      {
        id: 'business-plan',
        name: 'Business Plan Generator',
        description: 'Complete business plan with financial projections',
        agentType: 'strategy',
        defaultFormat: 'pdf',
        parameters: [
          { name: 'businessName', type: 'text', required: true, placeholder: 'Your business name' },
          { name: 'industry', type: 'text', required: true, placeholder: 'Industry sector' },
          { name: 'targetMarket', type: 'textarea', required: true, placeholder: 'Describe your target market' },
          { name: 'fundingGoal', type: 'number', required: false, placeholder: 'Funding goal (optional)' }
        ]
      }
    ];
  }

  async getUserDownloadCount(userId: string): Promise<number> {
    const downloads = useAppStore.getState().userDownloads;
    return downloads.filter(d => d.userId === userId).length;
  }

  async getUserTokenUsage(userId: string, timeframe: 'day' | 'week' | 'month' = 'month'): Promise<TokenUsage[]> {
    const usage = useAppStore.getState().tokenUsage;
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return usage.filter(u => {
      const tasks = useAppStore.getState().tasks;
      const task = tasks.find(t => t.id === u.taskId);
      return task?.userId === userId && new Date(u.timestamp) >= startDate;
    });
  }

  calculateTotalCost(userId: string): number {
    const downloads = useAppStore.getState().userDownloads;
    return downloads
      .filter(d => d.userId === userId)
      .reduce((total, download) => total + download.cost, 0);
  }

  getAgentPerformanceStats(agentId: string) {
    const tasks = useAppStore.getState().tasks;
    const agentTasks = tasks.filter(t => t.agentId === agentId);
    
    const completed = agentTasks.filter(t => t.status === 'completed').length;
    const failed = agentTasks.filter(t => t.status === 'failed').length;
    const total = agentTasks.length;
    
    const totalTokens = agentTasks.reduce((sum, task) => 
      sum + (task.result?.tokensUsed || 0), 0
    );
    
    const totalCost = agentTasks.reduce((sum, task) => 
      sum + (task.result?.cost || 0), 0
    );

    const avgCompletionTime = completed > 0 ? 
      agentTasks
        .filter(t => t.status === 'completed' && t.result?.completedAt)
        .reduce((sum, task) => {
          const start = new Date(task.createdAt).getTime();
          const end = new Date(task.result!.completedAt).getTime();
          return sum + (end - start);
        }, 0) / completed / 1000 / 60 // Convert to minutes
      : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      totalTokens,
      totalCost,
      avgCompletionTime: Math.round(avgCompletionTime)
    };
  }
}

export const taskService = new TaskService();