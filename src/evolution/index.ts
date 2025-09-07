import ApplicationEvolutionManager from './lifecycle/applicationEvolutionManager';
import StateAnalysisEngine from './lifecycle/stateAnalysisEngine';
import { AdaptiveUI, withAdaptiveEvolution } from './lifecycle/adaptiveUI';
import { createTimeSeriesStore } from './store/timeSeriesStore';
import PolymorphicCodeGenerator from './codegen/polymorphicGenerator';

// Create singleton instances
const evolutionManager = new ApplicationEvolutionManager();
const stateAnalysisEngine = new StateAnalysisEngine();

export {
  evolutionManager,
  stateAnalysisEngine,
  AdaptiveUI,
  withAdaptiveEvolution,
  createTimeSeriesStore,
  PolymorphicCodeGenerator,
  ApplicationEvolutionManager,
  StateAnalysisEngine
};
