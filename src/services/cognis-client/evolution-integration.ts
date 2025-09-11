import { CognisApiClient } from './client';
import { ApiClientState } from './types';

/**
 * Interface for time-series state manager from Evolution Architecture
 */
interface TimeSeriesStateManager<T> {
  current: T;
  history: T[];
  createSnapshot: (name: string) => void;
  loadSnapshot: (name: string) => boolean;
  addTimepoint: (state: T) => void;
  getHistory: (options?: { startTime?: number; endTime?: number }) => T[];
}

/**
 * Evolution Architecture integration for Cognis API client
 */
export class EvolutionCognisClient extends CognisApiClient {
  private stateManager: TimeSeriesStateManager<ApiClientState>;
  private snapshotInterval: number = 60000; // 1 minute
  private lastSnapshotTime: number = 0;
  private intervalId: number | null = null;
  
  /**
   * Create a new Evolution-integrated Cognis API client
   * @param stateManager Time-series state manager
   * @param config Client configuration
   */
  constructor(
    stateManager: TimeSeriesStateManager<ApiClientState>,
    config?: Parameters<typeof CognisApiClient.prototype.constructor>[0]
  ) {
    super(config);
    this.stateManager = stateManager;
    
    // Initialize state manager with current state
    this.stateManager.addTimepoint(this.getState());
    
    // Start periodic snapshot creation
    this.startPeriodicSnapshots();
  }
  
  /**
   * Start periodic state snapshots
   */
  private startPeriodicSnapshots(): void {
    if (this.intervalId !== null) {
      return;
    }
    
    this.intervalId = window.setInterval(() => {
      const currentState = this.getState();
      
      // Record state in time-series
      this.stateManager.addTimepoint(currentState);
      
      // Create named snapshot every hour
      const now = Date.now();
      if (now - this.lastSnapshotTime >= 3600000) { // 1 hour
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.stateManager.createSnapshot(`cognis-api-${timestamp}`);
        this.lastSnapshotTime = now;
      }
    }, this.snapshotInterval);
  }
  
  /**
   * Stop periodic snapshots
   */
  stopPeriodicSnapshots(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Get client usage analytics from state history
   */
  getAnalytics(timeRange?: { startTime?: number; endTime?: number }): {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    tokenUsage: number;
    requestTrend: Array<{ timestamp: number; count: number }>;
  } {
    const history = this.stateManager.getHistory(timeRange);
    
    if (history.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageLatency: 0,
        tokenUsage: 0,
        requestTrend: []
      };
    }
    
    // Calculate aggregated metrics
    const latencies = history.flatMap(state => state.latencies);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
      : 0;
    
    const totalRequests = history[history.length - 1].requestCount - history[0].requestCount;
    const successCount = history[history.length - 1].successCount - history[0].successCount;
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
    const tokenUsage = history[history.length - 1].totalTokensUsed - history[0].totalTokensUsed;
    
    // Generate trend data (hourly buckets)
    const requestTrend: Array<{ timestamp: number; count: number }> = [];
    if (history.length >= 2) {
      const hourlyBuckets = new Map<number, number>();
      
      for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1];
        const curr = history[i];
        
        if (prev.lastRequestTime && curr.lastRequestTime) {
          // Create hourly bucket timestamp (floor to hour)
          const hourTimestamp = Math.floor(curr.lastRequestTime / 3600000) * 3600000;
          
          // Count requests in this period
          const requestsInPeriod = curr.requestCount - prev.requestCount;
          
          // Add to bucket
          const existingCount = hourlyBuckets.get(hourTimestamp) || 0;
          hourlyBuckets.set(hourTimestamp, existingCount + requestsInPeriod);
        }
      }
      
      // Convert map to sorted array
      requestTrend.push(...Array.from(hourlyBuckets.entries())
        .map(([timestamp, count]) => ({ timestamp, count }))
        .sort((a, b) => a.timestamp - b.timestamp));
    }
    
    return {
      totalRequests,
      successRate,
      averageLatency,
      tokenUsage,
      requestTrend
    };
  }
  
  /**
   * Create a named snapshot of the current state
   * @param name Snapshot name
   */
  createStateSnapshot(name: string): void {
    // Update state in time-series first
    this.stateManager.addTimepoint(this.getState());
    // Then create the named snapshot
    this.stateManager.createSnapshot(name);
  }
  
  /**
   * Load a named snapshot
   * @param name Snapshot name
   * @returns True if snapshot was loaded successfully
   */
  loadStateSnapshot(name: string): boolean {
    return this.stateManager.loadSnapshot(name);
  }
  
  /**
   * Clean up resources when client is no longer needed
   */
  dispose(): void {
    this.stopPeriodicSnapshots();
  }
}
