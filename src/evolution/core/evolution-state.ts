/**
 * Evolution State for the Evolution Architecture
 * 
 * Provides adaptive behavior based on usage patterns
 * and optimizes application performance automatically.
 */
import { useState, useCallback, useEffect } from 'react';
import { useTimeSeriesStore } from './time-series-store';

/**
 * Default evolution state interface
 */
export interface EvolutionState<T extends Record<string, any>> {
  state: T;
  updateState: (updater: T | ((prev: T) => T)) => void;
  resetState: () => void;
  evolve: (metrics: Record<string, number>) => void;
  createSnapshot: (name: string) => void;
  loadSnapshot: (name: string) => boolean;
}

/**
 * Evolution metrics for tracking performance and usage
 */
interface EvolutionMetrics {
  // Performance metrics
  renderTime: number[];
  responseTime: number[];
  errorRate: number;
  
  // Usage metrics
  featureUsage: Record<string, number>;
  userPreferences: Record<string, any>;
  
  // System metrics
  batteryLevel?: number;
  networkQuality?: number;
  memoryUsage?: number;
}

/**
 * Hook for managing evolution state
 * @param initialState Initial state
 * @returns Evolution state controller
 */
export function useEvolutionState<T extends Record<string, any>>(
  initialState: T
): EvolutionState<T> {
  // Use time-series store for state tracking
  const timeSeriesStore = useTimeSeriesStore<T & { _evolved: boolean }>(
    { ...initialState, _evolved: false }
  );
  
  // Metrics tracking
  const [metrics, setMetrics] = useState<EvolutionMetrics>({
    renderTime: [],
    responseTime: [],
    errorRate: 0,
    featureUsage: {},
    userPreferences: {}
  });
  
  /**
   * Update the evolution state
   */
  const updateState = useCallback((updater: T | ((prev: T) => T)) => {
    timeSeriesStore.updateState(prev => {
      const nextState = typeof updater === 'function' 
        ? (updater as ((prev: T) => T))({ ...prev, _evolved: undefined } as T)
        : updater;
      
      return { 
        ...nextState, 
        _evolved: true 
      };
    });
  }, [timeSeriesStore]);
  
  /**
   * Reset state to initial values
   */
  const resetState = useCallback(() => {
    timeSeriesStore.updateState({ ...initialState, _evolved: false });
  }, [timeSeriesStore, initialState]);
  
  /**
   * Evolve the state based on metrics
   * @param newMetrics New metrics to consider for evolution
   */
  const evolve = useCallback((newMetrics: Record<string, number>) => {
    // Update metrics
    setMetrics(prev => {
      const updated = { ...prev };
      
      // Process each metric
      Object.entries(newMetrics).forEach(([key, value]) => {
        switch (key) {
          case 'renderTime':
          case 'responseTime':
            updated[key] = [...(updated[key] || []).slice(-9), value];
            break;
          
          case 'errorRate':
            updated.errorRate = value;
            break;
            
          default:
            // Track feature usage
            if (key.startsWith('feature:')) {
              const featureName = key.substring(8);
              updated.featureUsage[featureName] = 
                (updated.featureUsage[featureName] || 0) + value;
            }
            // Track system metrics
            else if (key === 'batteryLevel' || key === 'networkQuality' || key === 'memoryUsage') {
              updated[key] = value;
            }
        }
      });
      
      return updated;
    });
    
    // Apply evolution rules
    const currentState = timeSeriesStore.getState();
    if (!currentState._evolved) {
      const avgRenderTime = metrics.renderTime.length > 0
        ? metrics.renderTime.reduce((sum, val) => sum + val, 0) / metrics.renderTime.length
        : 0;
      
      const avgResponseTime = metrics.responseTime.length > 0
        ? metrics.responseTime.reduce((sum, val) => sum + val, 0) / metrics.responseTime.length
        : 0;
      
      // Example evolution rules - customize based on application needs
      const evolvedState: Partial<T> = {} as Partial<T>;
      
      // Adjust precision based on device performance
      if (avgRenderTime > 100 || metrics.memoryUsage && metrics.memoryUsage > 80) {
        evolvedState['precision'] = 'low';
      } else if (avgRenderTime < 30 && (!metrics.memoryUsage || metrics.memoryUsage < 50)) {
        evolvedState['precision'] = 'high';
      }
      
      // Adjust tracking frequency based on battery and network
      if (metrics.batteryLevel && metrics.batteryLevel < 20) {
        evolvedState['trackingFrequency'] = 'low';
      } else if (metrics.networkQuality && metrics.networkQuality < 30) {
        evolvedState['trackingFrequency'] = 'low';
      } else if (
        (!metrics.batteryLevel || metrics.batteryLevel > 50) && 
        (!metrics.networkQuality || metrics.networkQuality > 70)
      ) {
        evolvedState['trackingFrequency'] = 'high';
      }
      
      // Apply evolved state if there are changes
      if (Object.keys(evolvedState).length > 0) {
        updateState(prev => ({
          ...prev,
          ...evolvedState
        }));
      }
    }
  }, [metrics, timeSeriesStore, updateState]);
  
  // Get current state without the internal _evolved flag
  const state = { ...timeSeriesStore.getState() };
  delete state._evolved;
  
  // Pass through snapshot methods
  const createSnapshot = timeSeriesStore.createSnapshot;
  const loadSnapshot = timeSeriesStore.loadSnapshot;
  
  return {
    state: state as T,
    updateState,
    resetState,
    evolve,
    createSnapshot,
    loadSnapshot
  };
}
