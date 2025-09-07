import evolutionManager from './core/applicationEvolutionManager';
import stateAnalysisEngine from './core/stateAnalysisEngine';
import { AdaptiveUI, withAdaptiveEvolution, useEvolution } from './core/adaptiveUI';
import { createTimeSeriesStore } from './core/timeSeriesStore';
import PolymorphicCodeGenerator from './core/polymorphicGenerator';
import * as Types from './core/types';

// Re-export all components
export {
  // Singleton instances
  evolutionManager,
  stateAnalysisEngine,
  
  // UI components
  AdaptiveUI,
  withAdaptiveEvolution,
  useEvolution,
  
  // Core functionality
  createTimeSeriesStore,
  PolymorphicCodeGenerator,
  
  // Types
  Types
};

// Export implementations when available
export * from './implementations/index';

