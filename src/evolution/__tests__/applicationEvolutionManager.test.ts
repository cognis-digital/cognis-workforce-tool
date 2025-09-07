import ApplicationEvolutionManager from '../lifecycle/applicationEvolutionManager';
import { EventEmitter } from 'events';

// Mock the code generator to avoid actual file operations
jest.mock('../codegen/polymorphicGenerator', () => {
  return jest.fn().mockImplementation(() => {
    return {
      generateTypesFromState: jest.fn().mockReturnValue('// Generated types'),
      generateCode: jest.fn().mockResolvedValue('// Generated component code')
    };
  });
});

describe('ApplicationEvolutionManager', () => {
  let manager: ApplicationEvolutionManager;
  
  beforeEach(() => {
    manager = new ApplicationEvolutionManager();
  });
  
  it('should register state evolution', () => {
    const initialState = { count: 0, text: 'test' };
    const store = manager.registerStateEvolution('testState', initialState);
    
    // Check store was created with initial state
    expect(store.getState().current).toEqual(initialState);
  });
  
  it('should record state changes in evolution history', async () => {
    const initialState = { count: 0 };
    const store = manager.registerStateEvolution('testState', initialState);
    
    // Manually trigger onStateChanged to simulate a state change
    await manager.onStateChanged('testState', {
      current: { count: 1 },
      history: [
        { timestamp: Date.now() - 1000, state: initialState, origin: 'system' },
        { timestamp: Date.now(), state: { count: 1 }, origin: 'user' }
      ]
    });
    
    // Get evolution history
    const history = manager.getEvolutionHistory();
    
    // Check history was recorded
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].action).toBe('state_updated');
    expect(history[0].metadata.stateId).toBe('testState');
  });
  
  it('should notify subscribers about evolution events', async () => {
    // Mock callback
    const callback = jest.fn();
    
    // Subscribe to evolution events
    const unsubscribe = manager.subscribeToEvolution(callback);
    
    // Trigger state change
    await manager.onStateChanged('testState', {
      current: { value: 'test' },
      history: []
    });
    
    // Check callback was called
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'state_update',
        stateId: 'testState'
      })
    );
    
    // Unsubscribe
    unsubscribe();
  });
  
  it('should filter evolution history correctly', async () => {
    // Create some history entries
    await manager.onStateChanged('state1', { current: {}, history: [] });
    await manager.onStateChanged('state2', { current: {}, history: [] });
    
    // Wait a moment
    const now = Date.now();
    
    // Filter by stateId
    const state1History = manager.getEvolutionHistory({ stateIds: ['state1'] });
    expect(state1History.length).toBe(1);
    expect(state1History[0].metadata.stateId).toBe('state1');
    
    // Filter by time
    const recentHistory = manager.getEvolutionHistory({ startTime: now });
    expect(recentHistory.length).toBe(0);
  });
});
