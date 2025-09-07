import { StateTransition, OptimizationSuggestion } from './types';

interface StateAnalysisOptions {
  patternDetection: boolean;
  optimizationSuggestions: boolean;
  anomalyDetection: boolean;
  maxTransitions: number;
}

/**
 * State Analysis Engine
 * Analyzes state transitions to detect patterns, anomalies, and suggest optimizations
 */
class StateAnalysisEngine {
  private transitions: StateTransition<any>[] = [];
  private patterns: any[] = [];
  private options: StateAnalysisOptions;
  
  constructor(options: Partial<StateAnalysisOptions> = {}) {
    this.options = {
      patternDetection: true,
      optimizationSuggestions: true,
      anomalyDetection: true,
      maxTransitions: 1000,
      ...options
    };
  }
  
  /**
   * Record a state transition for analysis
   * @param fromState Previous state
   * @param toState New state
   * @param action Action that caused the transition
   * @returns The recorded transition
   */
  recordTransition(fromState: any, toState: any, action?: string): StateTransition<any> {
    const timestamp = Date.now();
    const lastTransition = this.transitions[this.transitions.length - 1];
    
    const transition: StateTransition<any> = {
      fromState,
      toState,
      timestamp,
      duration: lastTransition ? timestamp - lastTransition.timestamp : 0,
      action
    };
    
    // Add to transitions array with limit
    this.transitions.push(transition);
    
    // Enforce max transitions limit
    if (this.transitions.length > this.options.maxTransitions) {
      this.transitions = this.transitions.slice(
        this.transitions.length - this.options.maxTransitions
      );
    }
    
    // Run analysis if needed (every 10 transitions)
    if (this.transitions.length % 10 === 0) {
      this.analyzeTransitions();
    }
    
    return transition;
  }
  
  /**
   * Analyze recorded transitions for patterns and anomalies
   */
  private analyzeTransitions() {
    if (this.options.patternDetection) {
      this.detectPatterns();
    }
    
    if (this.options.optimizationSuggestions) {
      this.suggestOptimizations();
    }
    
    if (this.options.anomalyDetection) {
      this.detectAnomalies();
    }
  }
  
  /**
   * Detect recurring patterns in state transitions using recursive analysis
   */
  private detectPatterns() {
    // Implement recursive pattern detection - find sequences of actions
    const transitionPatterns = this.findRecurringSequences(
      this.transitions.map(t => t.action).filter(Boolean) as string[]
    );
    
    this.patterns = transitionPatterns.map(pattern => ({
      sequence: pattern.sequence,
      occurrences: pattern.occurrences,
      confidence: pattern.confidence
    }));
  }
  
  /**
   * Recursively find sequences in an array
   * @param items Array to analyze
   * @param minLength Minimum sequence length
   * @param maxLength Maximum sequence length
   */
  private findRecurringSequences(
    items: string[], 
    minLength = 2, 
    maxLength = 5, 
    minOccurrences = 2
  ) {
    const patterns: { sequence: string[], occurrences: number, confidence: number }[] = [];
    
    // Base case - too few items
    if (items.length < minLength * minOccurrences) {
      return patterns;
    }
    
    // For each possible sequence length
    for (let length = minLength; length <= maxLength; length++) {
      // Map to count sequence occurrences
      const sequenceCounts = new Map<string, number>();
      
      // Generate all subsequences of the current length
      for (let i = 0; i <= items.length - length; i++) {
        const sequence = items.slice(i, i + length);
        const key = sequence.join(',');
        sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
      }
      
      // Filter to sequences that occur multiple times
      for (const [key, count] of sequenceCounts.entries()) {
        if (count >= minOccurrences) {
          const sequence = key.split(',');
          patterns.push({
            sequence,
            occurrences: count,
            confidence: count / (items.length - length + 1)
          });
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Generate optimization suggestions based on transition analysis
   */
  private suggestOptimizations() {
    // Analyze transitions for optimization opportunities
    // Will be implemented in getInsights()
  }
  
  /**
   * Detect anomalies in state transitions
   */
  private detectAnomalies() {
    // Find outliers in transition durations
    const durations = this.transitions.map(t => t.duration).filter(d => d > 0);
    
    if (durations.length < 5) return []; // Need more data
    
    // Calculate mean and standard deviation
    const sum = durations.reduce((a, b) => a + b, 0);
    const mean = sum / durations.length;
    
    const squaredDiffs = durations.map(d => Math.pow(d - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    // Find transitions with durations > 2 standard deviations from mean
    const anomalies = this.transitions.filter(t => 
      t.duration > 0 && Math.abs(t.duration - mean) > 2 * stdDev
    );
    
    return anomalies;
  }
  
  /**
   * Get analysis insights
   * @returns Object with analysis results
   */
  getInsights() {
    return {
      transitionCount: this.transitions.length,
      averageTransitionTime: this.calculateAverageTransitionTime(),
      frequentPatterns: this.patterns,
      optimizationSuggestions: this.generateOptimizationSuggestions(),
      anomalies: this.findAnomalies()
    };
  }
  
  /**
   * Calculate average transition time
   */
  private calculateAverageTransitionTime() {
    if (this.transitions.length <= 1) return 0;
    
    const totalTime = this.transitions
      .slice(1) // Skip first transition (no duration)
      .reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return totalTime / (this.transitions.length - 1);
  }
  
  /**
   * Generate optimization suggestions based on analysis
   */
  private generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check for high frequency state changes
    const actionCounts = new Map<string, number>();
    this.transitions.forEach(t => {
      if (t.action) {
        actionCounts.set(t.action, (actionCounts.get(t.action) || 0) + 1);
      }
    });
    
    // Find high frequency actions
    for (const [action, count] of actionCounts.entries()) {
      if (count > 20 && this.transitions.length > 50) {
        suggestions.push({
          type: 'high_frequency_action',
          description: `Action '${action}' occurs very frequently (${count} times). Consider batching or optimizing.`,
          priority: 'medium',
          affected: [action]
        });
      }
    }
    
    // Check for slow transitions
    const anomalies = this.findAnomalies();
    if (anomalies.length > 0) {
      suggestions.push({
        type: 'slow_transitions',
        description: `Detected ${anomalies.length} unusually slow state transitions. Review performance.`,
        priority: 'high',
        affected: anomalies.map(a => a.action || 'unknown')
      });
    }
    
    // Check for recurring patterns that could be optimized
    if (this.patterns.length > 0) {
      const highConfidencePatterns = this.patterns.filter(p => p.confidence > 0.5);
      if (highConfidencePatterns.length > 0) {
        suggestions.push({
          type: 'recurring_patterns',
          description: `Detected ${highConfidencePatterns.length} recurring action patterns. Consider creating compound actions.`,
          priority: 'medium',
          affected: highConfidencePatterns.map(p => p.sequence.join('->'))
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Find anomalies in state transitions
   */
  private findAnomalies() {
    return this.detectAnomalies().map(anomaly => ({
      timestamp: anomaly.timestamp,
      duration: anomaly.duration,
      action: anomaly.action || 'unknown',
      severity: 'high'
    }));
  }
}

// Export singleton instance
const stateAnalysisEngine = new StateAnalysisEngine();
export default stateAnalysisEngine;
