import { EventEmitter } from 'events';
import { createTimeSeriesStore } from './timeSeriesStore';
import PolymorphicCodeGenerator from './polymorphicGenerator';
import { EvolutionEvent, OptimizationSuggestion } from './types';

/**
 * Application Evolution Manager
 * Central coordination for time-series state and polymorphic code generation
 */
class ApplicationEvolutionManager {
  private codeGenerator: PolymorphicCodeGenerator;
  private eventBus: EventEmitter;
  private stateVersions: Map<string, any>;
  private evolutionHistory: Array<{
    timestamp: number;
    action: string;
    metadata: any;
  }>;
  
  constructor() {
    this.codeGenerator = new PolymorphicCodeGenerator({
      outputPath: './src/generated',
      prettierConfig: { 
        semi: true,
        singleQuote: true,
        tabWidth: 2
      }
    });
    
    this.eventBus = new EventEmitter();
    this.stateVersions = new Map();
    this.evolutionHistory = [];
  }
  
  /**
   * Register a state store with the evolution manager
   * @param stateId Unique identifier for this state
   * @param initialState Initial state object
   * @returns Time-series store instance
   */
  registerStateEvolution<T extends object>(stateId: string, initialState: T) {
    const timeSeriesStore = createTimeSeriesStore(initialState, {
      maxHistory: 100,
      autoSnapshot: true
    });
    
    this.stateVersions.set(stateId, timeSeriesStore);
    
    // Listen for state changes
    const unsubscribe = timeSeriesStore.subscribe((state) => {
      this.onStateChanged(stateId, state);
    });
    
    return timeSeriesStore;
  }
  
  /**
   * Handle state changes and trigger appropriate actions
   * @param stateId State identifier
   * @param newState Updated state
   */
  async onStateChanged(stateId: string, newState: any) {
    // Record evolutionary step
    this.evolutionHistory.push({
      timestamp: Date.now(),
      action: 'state_updated',
      metadata: { stateId, snapshot: newState.current }
    });
    
    // Generate new code if necessary
    if (this.shouldRegenerateCode(stateId, newState)) {
      await this.regenerateCode(stateId, newState);
    }
    
    // Notify subscribers
    this.eventBus.emit('evolution', { 
      type: 'state_update',
      stateId,
      timestamp: Date.now()
    } as EvolutionEvent);
  }
  
  /**
   * Determine if code should be regenerated based on state changes
   */
  private shouldRegenerateCode(stateId: string, state: any): boolean {
    // Implement intelligent regeneration logic
    // For this implementation, regenerate code after significant state changes
    
    // Simple heuristic: regenerate after every 10th state change
    const historyLength = state.history.length;
    return historyLength % 10 === 0 && historyLength > 0;
  }
  
  /**
   * Generate code based on current state
   */
  async regenerateCode(stateId: string, state: any) {
    try {
      // 1. Generate types from the current state
      const typeDefinitions = this.codeGenerator.generateTypesFromState(
        state.current, 
        `${stateId}State`
      );
      
      // 2. Generate component templates based on the state
      const templateName = `${stateId}View`;
      
      // Check if we have a registered template first
      try {
        const componentCode = await this.codeGenerator.generateCode(templateName, state.current);
        
        // 3. Record the regeneration in evolution history
        this.evolutionHistory.push({
          timestamp: Date.now(),
          action: 'code_regeneration',
          metadata: { stateId, generatedCode: true }
        });
        
        // Notify about successful code generation
        this.eventBus.emit('evolution', {
          type: 'code_generated',
          stateId,
          timestamp: Date.now(),
          metadata: { typeDefinitions, componentCode }
        } as EvolutionEvent);
        
        return componentCode;
      } catch (error) {
        // Template not found, but we still generated type definitions
        this.evolutionHistory.push({
          timestamp: Date.now(),
          action: 'types_generation',
          metadata: { stateId, typeDefinitions }
        });
      }
    } catch (error) {
      console.error('Failed to regenerate code:', error);
      
      this.evolutionHistory.push({
        timestamp: Date.now(),
        action: 'code_regeneration_failed',
        metadata: { stateId, error: String(error) }
      });
    }
    
    return null;
  }
  
  /**
   * Register a component template for code generation
   */
  registerTemplate<T>(templateName: string, templateFunc: (data: T) => string) {
    this.codeGenerator.registerTemplate({
      name: templateName,
      getTemplate: templateFunc
    });
  }
  
  /**
   * Subscribe to evolution events
   * @param callback Event handler
   * @returns Unsubscribe function
   */
  subscribeToEvolution(callback: (event: EvolutionEvent) => void) {
    this.eventBus.on('evolution', callback);
    
    return () => {
      this.eventBus.off('evolution', callback);
    };
  }
  
  /**
   * Get evolution history with filtering options
   */
  getEvolutionHistory({ 
    startTime, 
    endTime, 
    actions, 
    stateIds 
  }: {
    startTime?: number;
    endTime?: number;
    actions?: string[];
    stateIds?: string[];
  } = {}) {
    return this.evolutionHistory.filter(entry => {
      if (startTime && entry.timestamp < startTime) return false;
      if (endTime && entry.timestamp > endTime) return false;
      if (actions && !actions.includes(entry.action)) return false;
      if (stateIds && entry.metadata.stateId && !stateIds.includes(entry.metadata.stateId)) return false;
      
      return true;
    });
  }
  
  /**
   * Get optimization suggestions based on evolution history
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    // Analyze evolution history to generate suggestions
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check for frequent state changes
    const stateChanges = new Map<string, number>();
    
    this.evolutionHistory.forEach(entry => {
      if (entry.action === 'state_updated' && entry.metadata.stateId) {
        const stateId = entry.metadata.stateId;
        stateChanges.set(stateId, (stateChanges.get(stateId) || 0) + 1);
      }
    });
    
    // Find states that change frequently
    for (const [stateId, count] of stateChanges.entries()) {
      if (count > 50) {
        suggestions.push({
          type: 'high_frequency_state_changes',
          description: `State '${stateId}' changes very frequently (${count} times). Consider optimizing updates or using memoization.`,
          priority: 'medium',
          affected: [stateId]
        });
      }
    }
    
    // Check for code regeneration failures
    const failedRegens = this.evolutionHistory.filter(
      entry => entry.action === 'code_regeneration_failed'
    );
    
    if (failedRegens.length > 0) {
      suggestions.push({
        type: 'code_generation_failures',
        description: `${failedRegens.length} code generation failures detected. Review template configurations.`,
        priority: 'high',
        affected: failedRegens.map(f => f.metadata.stateId)
      });
    }
    
    return suggestions;
  }
}

// Export singleton instance
const evolutionManager = new ApplicationEvolutionManager();
export default evolutionManager;
