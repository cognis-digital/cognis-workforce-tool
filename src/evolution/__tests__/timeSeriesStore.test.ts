import { createTimeSeriesStore } from '../store/timeSeriesStore';

describe('TimeSeriesStore', () => {
  // Define test state
  interface TestState {
    counter: number;
    text: string;
    items: string[];
  }
  
  const initialState: TestState = {
    counter: 0,
    text: '',
    items: []
  };
  
  it('should initialize with the correct state', () => {
    const store = createTimeSeriesStore(initialState);
    const { current, history } = store.getState();
    
    expect(current).toEqual(initialState);
    expect(history.length).toBe(1);
    expect(history[0].state).toEqual(initialState);
    expect(history[0].origin).toBe('system');
  });
  
  it('should update state correctly', () => {
    const store = createTimeSeriesStore(initialState);
    
    // Update state
    store.getState().update({ counter: 1, text: 'test' });
    
    const { current, history } = store.getState();
    
    // Check current state
    expect(current).toEqual({
      counter: 1,
      text: 'test',
      items: []
    });
    
    // Check history
    expect(history.length).toBe(2);
    expect(history[1].state).toEqual(current);
    expect(history[1].origin).toBe('user');
  });
  
  it('should create and load snapshots', () => {
    const store = createTimeSeriesStore(initialState);
    
    // Update state
    store.getState().update({ counter: 1 });
    
    // Create snapshot
    store.getState().createSnapshot('test-snapshot');
    
    // Update state again
    store.getState().update({ counter: 2 });
    
    expect(store.getState().current.counter).toBe(2);
    
    // Load snapshot
    store.getState().loadSnapshot('test-snapshot');
    
    // Check state is reverted to snapshot
    expect(store.getState().current.counter).toBe(1);
    
    // Check history has a new entry for loading snapshot
    const { history } = store.getState();
    expect(history[history.length - 1].metadata?.loadedSnapshot).toBe('test-snapshot');
  });
  
  it('should retrieve state at a specific time', () => {
    const store = createTimeSeriesStore(initialState);
    
    // First update
    const firstUpdateTime = Date.now();
    store.getState().update({ counter: 1 });
    
    // Wait a moment
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await wait(100);
    
    // Second update
    const secondUpdateTime = Date.now();
    store.getState().update({ counter: 2 });
    
    // Get state at first update time
    const stateAtFirstUpdate = store.getState().getStateAtTime(firstUpdateTime + 1);
    
    expect(stateAtFirstUpdate?.counter).toBe(1);
    
    // Get state at second update time
    const stateAtSecondUpdate = store.getState().getStateAtTime(secondUpdateTime + 1);
    
    expect(stateAtSecondUpdate?.counter).toBe(2);
  });
  
  it('should respect max history limit', () => {
    const store = createTimeSeriesStore(initialState, { maxHistory: 3 });
    
    // Make 4 updates
    store.getState().update({ counter: 1 });
    store.getState().update({ counter: 2 });
    store.getState().update({ counter: 3 });
    store.getState().update({ counter: 4 });
    
    // Check history length is capped at 3
    const { history } = store.getState();
    expect(history.length).toBe(3);
    
    // Check oldest history item is counter: 2
    expect(history[0].state.counter).toBe(2);
  });
});
