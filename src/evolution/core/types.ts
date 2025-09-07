/**
 * Core types for the Evolution Architecture
 */

export interface StateSnapshot<T> {
  timestamp: number;
  state: T;
  origin: 'user' | 'system' | 'ai' | 'sync' | 'blockchain';
  metadata?: Record<string, any>;
}

export interface TimeSeriesState<T> {
  current: T;
  history: StateSnapshot<T>[];
  snapshots: Map<string, T>; // Named snapshots
}

export interface TimeSeriesActions<T> {
  update: (partialState: Partial<T>, origin?: 'user' | 'system' | 'ai' | 'sync' | 'blockchain') => void;
  revertTo: (timestamp: number) => void;
  createSnapshot: (name: string) => void;
  loadSnapshot: (name: string) => void;
  purgeHistoryBefore: (timestamp: number) => void;
  getStateAtTime: (timestamp: number) => T | null;
}

export interface StateTransition<T> {
  fromState: Partial<T>;
  toState: Partial<T>;
  timestamp: number;
  duration?: number;
  action?: string;
  metadata?: Record<string, any>;
}

export interface CodeTemplate<T> {
  name: string;
  getTemplate: (data: T) => string;
}

export interface EvolutionEvent {
  type: 'state_update' | 'code_generated' | 'snapshot_created' | 'state_reverted' | 'anomaly_detected';
  stateId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  affected: string[];
  metadata?: Record<string, any>;
}

export interface EvolutionInsight {
  transitionCount: number;
  averageTransitionTime: number;
  frequentPatterns: any[];
  optimizationSuggestions: OptimizationSuggestion[];
  anomalies: any[];
}
