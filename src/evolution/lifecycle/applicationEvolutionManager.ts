import { EventEmitter } from 'events';
import { createTimeSeriesStore } from '../store/timeSeriesStore';
import PolymorphicCodeGenerator from '../codegen/polymorphicGenerator';

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
  
  registerStateEvolution<T>(stateId: string, initialState: T) {
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
    });
  }
  
  private shouldRegenerateCode(stateId: string, state: any): boolean {
    // Logic to determine if code should be regenerated
    // This can be based on specific state changes, time intervals, etc.
    
    // For this initial implementation, regenerate code
    // after every 10th state change
    const historyLength = state.history.length;
    return historyLength % 10 === 0;
  }
  
  async regenerateCode(stateId: string, state: any) {
    try {
      // 1. Generate types from the current state
      const typeDefinitions = this.codeGenerator.generateTypesFromState(
        state.current, 
        `${stateId}State`
      );
      
      // 2. Generate component templates based on the state
      const templateName = `${stateId}View`;
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
        timestamp: Date.now()
      });
      
      return componentCode;
    } catch (error) {
      console.error('Failed to regenerate code:', error);
      
      this.evolutionHistory.push({
        timestamp: Date.now(),
        action: 'code_regeneration_failed',
        metadata: { stateId, error: String(error) }
      });
      
      return null;
    }
  }
  
  // Subscribe to evolution events
  subscribeToEvolution(callback: (event: any) => void) {
    this.eventBus.on('evolution', callback);
    
    return () => {
      this.eventBus.off('evolution', callback);
    };
  }
  
  // Get evolution history with filtering options
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
}

export default ApplicationEvolutionManager;
