interface StateTransition {
  fromState: any;
  toState: any;
  timestamp: number;
  duration: number;
  userAction?: string;
}

interface StateAnalysisOptions {
  patternDetection: boolean;
  optimizationSuggestions: boolean;
  anomalyDetection: boolean;
}

class StateAnalysisEngine {
  private transitions: StateTransition[] = [];
  private patterns: any[] = [];
  private options: StateAnalysisOptions;
  
  constructor(options: Partial<StateAnalysisOptions> = {}) {
    this.options = {
      patternDetection: true,
      optimizationSuggestions: true,
      anomalyDetection: true,
      ...options
    };
  }
  
  recordTransition(fromState: any, toState: any, userAction?: string) {
    const timestamp = Date.now();
    const lastTransition = this.transitions[this.transitions.length - 1];
    
    const transition: StateTransition = {
      fromState,
      toState,
      timestamp,
      duration: lastTransition ? timestamp - lastTransition.timestamp : 0,
      userAction
    };
    
    this.transitions.push(transition);
    
    // Run analysis if needed
    if (this.transitions.length % 10 === 0) {
      this.analyzeTransitions();
    }
    
    return transition;
  }
  
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
  
  private detectPatterns() {
    // Basic pattern detection - look for repeated sequences
    // In a production system, this would use more sophisticated algorithms
    
    // For now, just detect immediate state transitions that happen frequently
    const transitionCounts = new Map<string, number>();
    
    for (let i = 1; i < this.transitions.length; i++) {
      const prev = this.transitions[i - 1];
      const curr = this.transitions[i];
      
      // Create a simple key for the transition
      const transitionKey = JSON.stringify({
        fromAction: prev.userAction,
        toAction: curr.userAction
      });
      
      const count = transitionCounts.get(transitionKey) || 0;
      transitionCounts.set(transitionKey, count + 1);
    }
    
    // Find frequent transitions (occurring > 3 times)
    const frequentTransitions = Array.from(transitionCounts.entries())
      .filter(([_, count]) => count > 3)
      .map(([key, count]) => ({ transition: JSON.parse(key), count }));
    
    this.patterns = frequentTransitions;
  }
  
  private suggestOptimizations() {
    // Simple optimization suggestions based on transition patterns
    const suggestions = [];
    
    // Check for rapid back-and-forth between states (potential UI issue)
    const stateFrequency = new Map<string, number>();
    
    for (const transition of this.transitions) {
      const stateKey = JSON.stringify(transition.toState);
      const count = stateFrequency.get(stateKey) || 0;
      stateFrequency.set(stateKey, count + 1);
    }
    
    return suggestions;
  }
  
  private detectAnomalies() {
    // Simple anomaly detection - find outliers in transition times
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
  
  getInsights() {
    return {
      transitionCount: this.transitions.length,
      averageTransitionTime: this.calculateAverageTransitionTime(),
      frequentPatterns: this.patterns,
      optimizationSuggestions: this.generateOptimizationSuggestions(),
      anomalies: this.findAnomalies()
    };
  }
  
  private calculateAverageTransitionTime() {
    if (this.transitions.length <= 1) return 0;
    
    const totalTime = this.transitions
      .slice(1) // Skip first transition (no duration)
      .reduce((sum, t) => sum + t.duration, 0);
    
    return totalTime / (this.transitions.length - 1);
  }
  
  private generateOptimizationSuggestions() {
    // Generate actual optimization suggestions based on analysis
    return [
      // Example suggestions that will be populated based on real analysis
      {
        type: 'memoization',
        description: 'Consider memoizing frequently accessed state properties',
        priority: 'medium'
      }
    ];
  }
  
  private findAnomalies() {
    return this.detectAnomalies().map(anomaly => ({
      timestamp: anomaly.timestamp,
      duration: anomaly.duration,
      action: anomaly.userAction || 'unknown',
      severity: 'high'
    }));
  }
}

export default StateAnalysisEngine;
