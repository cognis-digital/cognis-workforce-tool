import { TransformerModel } from './onnxModel';

/**
 * Interface for research query results from client-side transformer
 */
export interface ResearchQueryResult {
  query: string;
  generatedResponse: string;
  sourceModel: string;
  timestamp: string;
  processingTime: number; // in milliseconds
}

/**
 * Interface for the research session options
 */
export interface ResearchSessionOptions {
  depth?: 'basic' | 'comprehensive' | 'expert';
  focusAreas?: string[];
  tokensLimit?: number;
  useLocalModel?: boolean;
}

/**
 * Class to connect client-side transformer models with Cognis Research AI
 */
export class ResearchAIConnector {
  private transformerModel: TransformerModel | null = null;
  private isConnected = false;
  private isProcessing = false;
  
  /**
   * Initialize the Research AI connector
   * @param modelId Optional model ID to use for local processing
   * @param merkleRoot Optional merkle root for verification
   */
  constructor(modelId?: string, merkleRoot?: string) {
    if (modelId && merkleRoot) {
      this.transformerModel = new TransformerModel(modelId, merkleRoot);
    }
  }
  
  /**
   * Connect to a transformer model
   * @param model The transformer model to use
   */
  public async connectModel(model: TransformerModel): Promise<boolean> {
    try {
      this.transformerModel = model;
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect transformer model:', error);
      return false;
    }
  }
  
  /**
   * Process a research query using the local transformer model
   * @param query The research query to process
   * @param options Research options
   */
  public async processResearchQuery(
    query: string,
    options: ResearchSessionOptions = {}
  ): Promise<ResearchQueryResult> {
    if (!this.transformerModel || !this.isConnected) {
      throw new Error('Transformer model not connected');
    }
    
    if (this.isProcessing) {
      throw new Error('Already processing a research query');
    }
    
    try {
      this.isProcessing = true;
      const startTime = Date.now();
      
      // Format the query with proper instructions based on depth
      let formattedQuery = query;
      if (options.depth) {
        switch (options.depth) {
          case 'comprehensive':
            formattedQuery = `Provide a comprehensive analysis of the following: ${query}`;
            break;
          case 'expert':
            formattedQuery = `Perform an expert-level deep analysis of the following: ${query}`;
            break;
          default:
            formattedQuery = `Provide a basic overview of: ${query}`;
        }
      }
      
      // Add focus areas if provided
      if (options.focusAreas?.length) {
        formattedQuery += `\nFocus on these aspects: ${options.focusAreas.join(', ')}`;
      }
      
      // Run inference
      const response = await this.transformerModel.runInference(formattedQuery);
      
      const processingTime = Date.now() - startTime;
      
      return {
        query,
        generatedResponse: response,
        sourceModel: 'client-side-transformer', // This identifies it came from the local model
        timestamp: new Date().toISOString(),
        processingTime
      };
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Send results to the main Cognis Research AI for enhancement
   * @param initialResult Results from local model
   * @param enhancementType Type of enhancement to request
   */
  public async enhanceWithResearchAI(
    initialResult: ResearchQueryResult,
    enhancementType: 'verify' | 'expand' | 'summarize'
  ): Promise<ResearchQueryResult> {
    try {
      // This would make an API call to the main Research AI service
      const response = await fetch('/api/v1/research/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initialResult,
          enhancementType
        })
      });
      
      if (!response.ok) {
        throw new Error(`Research AI enhancement failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error enhancing with Research AI:', error);
      // Fall back to the original result if enhancement fails
      return {
        ...initialResult,
        generatedResponse: `${initialResult.generatedResponse}\n\n[Note: Enhancement with Research AI failed]`
      };
    }
  }
  
  /**
   * Check if the local model can handle the research query
   * This is useful for deciding whether to use the local model or fallback to server
   */
  public async canHandleResearchQuery(query: string): Promise<boolean> {
    if (!this.transformerModel || !this.isConnected) {
      return false;
    }
    
    // Simple heuristic: if query is too long, it's probably better handled by server
    if (query.length > 500) {
      return false;
    }
    
    // Could add more sophisticated checks here
    return true;
  }
  
  /**
   * Disconnect the model
   */
  public disconnect(): void {
    this.transformerModel = null;
    this.isConnected = false;
  }
  
  /**
   * Get connection status
   */
  public isModelConnected(): boolean {
    return this.isConnected && this.transformerModel !== null;
  }
}
