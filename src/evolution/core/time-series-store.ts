/**
 * Time Series Store for Evolution Architecture
 * 
 * Provides a store that tracks state changes over time,
 * allows snapshots, and supports time travel debugging.
 */
import { useState, useCallback, useEffect } from 'react';

interface TimeSeriesStoreOptions {
  maxHistoryLength?: number;
  autoSnapshotInterval?: number;
}

/**
 * Hook for time-series state management
 * @param initialState Initial state object
 * @param options Store configuration options
 */
export function useTimeSeriesStore<T extends Record<string, any>>(
  initialState: T,
  options: TimeSeriesStoreOptions = {}
) {
  // Default options
  const {
    maxHistoryLength = 100,
    autoSnapshotInterval = 0 // 0 means disabled
  } = options;
  
  // State
  const [current, setCurrent] = useState<T>(initialState);
  const [history, setHistory] = useState<Array<{ state: T; timestamp: number }>>([
    { state: initialState, timestamp: Date.now() }
  ]);
  const [snapshots, setSnapshots] = useState<Record<string, T>>({});
  
  /**
   * Update state with time tracking
   * @param updater Function to update state or new state value
   */
  const updateState = useCallback((updater: T | ((prev: T) => T)) => {
    setCurrent(prev => {
      const nextState = typeof updater === 'function' 
        ? (updater as ((prev: T) => T))(prev)
        : updater;
      
      setHistory(prevHistory => {
        // Add new entry to history
        const newEntry = { state: nextState, timestamp: Date.now() };
        
        // Limit history length if specified
        if (maxHistoryLength > 0 && prevHistory.length >= maxHistoryLength) {
          return [...prevHistory.slice(-(maxHistoryLength - 1)), newEntry];
        }
        
        return [...prevHistory, newEntry];
      });
      
      return nextState;
    });
  }, [maxHistoryLength]);
  
  /**
   * Create a named snapshot of the current state
   * @param name Snapshot name
   */
  const createSnapshot = useCallback((name: string) => {
    setSnapshots(prev => ({
      ...prev,
      [name]: { ...current }
    }));
  }, [current]);
  
  /**
   * Load a named snapshot
   * @param name Snapshot name
   * @returns True if snapshot was found and loaded
   */
  const loadSnapshot = useCallback((name: string): boolean => {
    if (snapshots[name]) {
      // Load snapshot state
      setCurrent(snapshots[name]);
      
      // Add to history
      setHistory(prevHistory => [
        ...prevHistory,
        { state: snapshots[name], timestamp: Date.now() }
      ]);
      
      return true;
    }
    
    return false;
  }, [snapshots]);
  
  /**
   * Get history between timestamps
   * @param options Time range options
   * @returns Filtered history
   */
  const getHistory = useCallback((options?: {
    startTime?: number;
    endTime?: number;
  }) => {
    if (!options) return history;
    
    const { startTime, endTime } = options;
    
    return history.filter(entry => {
      if (startTime && entry.timestamp < startTime) return false;
      if (endTime && entry.timestamp > endTime) return false;
      return true;
    });
  }, [history]);
  
  // Auto-snapshot functionality
  useEffect(() => {
    if (autoSnapshotInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      // Create auto-snapshot with timestamp
      const timestamp = new Date().toISOString();
      createSnapshot(`auto_${timestamp}`);
    }, autoSnapshotInterval);
    
    return () => clearInterval(intervalId);
  }, [autoSnapshotInterval, createSnapshot]);
  
  return {
    current,
    history,
    updateState,
    createSnapshot,
    loadSnapshot,
    getHistory,
    getState: () => current,
  };
}
