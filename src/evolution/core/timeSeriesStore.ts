import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TimeSeriesState, TimeSeriesActions, StateSnapshot } from './types';

/**
 * Creates a time-series store with full state history tracking and snapshot capabilities
 * @param initialState Initial state object
 * @param options Configuration options
 * @returns Zustand store with time-series capabilities
 */
export const createTimeSeriesStore = <T extends object>(
  initialState: T, 
  options?: { maxHistory?: number, autoSnapshot?: boolean, persistKey?: string }
) => create(
  immer<TimeSeriesState<T> & TimeSeriesActions<T>>((set, get) => ({
    current: initialState,
    history: [{ timestamp: Date.now(), state: initialState, origin: 'system' }],
    snapshots: new Map(),

    update: (partialState, origin = 'user') => {
      set(state => {
        const timestamp = Date.now();
        const newState = { ...state.current, ...partialState };
        
        state.current = newState;
        
        // Add to history
        state.history.push({
          timestamp,
          state: newState,
          origin
        });
        
        // Limit history size if needed
        if (options?.maxHistory && state.history.length > options.maxHistory) {
          state.history = state.history.slice(state.history.length - options.maxHistory);
        }
        
        // Auto-create snapshot if enabled
        if (options?.autoSnapshot && state.history.length % 10 === 0) {
          state.snapshots.set(`auto-${timestamp}`, newState);
        }
      });
    },

    revertTo: (timestamp) => {
      const targetStateItem = get().history.find(item => item.timestamp === timestamp);
      if (targetStateItem) {
        set(state => {
          state.current = targetStateItem.state;
          // Add this revert as a new history point
          state.history.push({
            timestamp: Date.now(),
            state: targetStateItem.state,
            origin: 'system',
            metadata: { revertedFrom: timestamp }
          });
        });
      }
    },

    createSnapshot: (name) => {
      set(state => {
        state.snapshots.set(name, state.current);
      });
    },

    loadSnapshot: (name) => {
      const snapshot = get().snapshots.get(name);
      if (snapshot) {
        set(state => {
          state.current = snapshot;
          state.history.push({
            timestamp: Date.now(),
            state: snapshot,
            origin: 'system',
            metadata: { loadedSnapshot: name }
          });
        });
      }
    },

    purgeHistoryBefore: (timestamp) => {
      set(state => {
        state.history = state.history.filter(item => item.timestamp >= timestamp);
      });
    },

    getStateAtTime: (timestamp) => {
      // Find the closest state before or at the requested time
      const historyItems = get().history;
      const sorted = [...historyItems].sort((a, b) => b.timestamp - a.timestamp);
      
      for (const item of sorted) {
        if (item.timestamp <= timestamp) {
          return item.state;
        }
      }
      
      return null;
    }
  }))
);
