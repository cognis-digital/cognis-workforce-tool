/**
 * Recursion Safety Module
 * Comprehensive utilities for preventing infinite recursion and runaway event loops
 */

// Re-export all utilities
export * from './prevention';
export * from './monitoring';
export * from './recovery';
export * from './eventLoop';

// Example integration for geospatial operations
import { SafeRegimeTraversal, CycleDetector, validateSpatialQuerySafety } from './prevention';
import { ExecutionTimer, OperationMonitor } from './monitoring';
import { CircuitBreaker, RetryPolicy, FallbackStrategies } from './recovery';
import { throttle, debounce, ArrayChunker, AnimationFrameScheduler } from './eventLoop';
import { HorizontalLandRegime, SpatialQuery } from '../geoSpatial/types';

/**
 * Safe Geospatial Operations
 * Integration example showcasing how to use recursion safety tools with geospatial operations
 */
export class SafeGeospatialOperations {
  private regimeTraversal: SafeRegimeTraversal;
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;
  private monitor: OperationMonitor;
  
  constructor() {
    this.regimeTraversal = new SafeRegimeTraversal();
    this.circuitBreaker = new CircuitBreaker();
    this.retryPolicy = new RetryPolicy();
    this.monitor = new OperationMonitor();
  }
  
  /**
   * Safely find all connected regimes
   */
  public async findAllConnectedRegimesSafe(
    startRegimeId: string,
    getRegimeFn: (id: string) => Promise<HorizontalLandRegime | null>
  ): Promise<HorizontalLandRegime[]> {
    // Monitor execution
    const timer = new ExecutionTimer();
    
    // Validate parameters
    if (!startRegimeId) {
      throw new Error('Start regime ID is required');
    }
    
    // Use circuit breaker to prevent repeated failures
    return this.circuitBreaker.execute(
      // Retry policy handles transient failures
      async () => this.retryPolicy.executeWithRetry(async () => {
        const result: HorizontalLandRegime[] = [];
        const visited = new Set<string>();
        
        // Use iterative approach instead of recursion
        const stack: string[] = [startRegimeId];
        let iterations = 0;
        const MAX_ITERATIONS = 10000;
        
        while (stack.length > 0 && iterations < MAX_ITERATIONS) {
          // Monitor execution time periodically
          if (iterations % 100 === 0) {
            timer.checkTimeout();
          }
          
          iterations++;
          const regimeId = stack.pop()!;
          
          // Skip already visited
          if (visited.has(regimeId)) continue;
          visited.add(regimeId);
          
          // Get the regime
          try {
            const regime = await getRegimeFn(regimeId);
            if (regime) {
              result.push(regime);
              
              // Get connected regimes (implementation-dependent)
              const connectedIds = this.getConnectedRegimeIds(regime);
              
              // Add connected regimes to stack
              for (const connectedId of connectedIds) {
                if (!visited.has(connectedId)) {
                  stack.push(connectedId);
                }
              }
            }
          } catch (error) {
            console.warn(`Error fetching regime ${regimeId}:`, error);
            // Continue with other regimes
          }
        }
        
        if (iterations >= MAX_ITERATIONS) {
          console.warn('Maximum iteration count reached, possible infinite loop prevented');
        }
        
        return result;
      }),
      // Fallback to empty result if all else fails
      async () => []
    );
  }
  
  /**
   * Apply spatial query with safety checks
   */
  public async applySpatialQuery(
    query: SpatialQuery,
    executeQueryFn: (query: SpatialQuery) => Promise<HorizontalLandRegime[]>
  ): Promise<HorizontalLandRegime[]> {
    // Validate the query
    if (!validateSpatialQuerySafety(query)) {
      console.warn('Unsafe spatial query parameters detected, using defaults');
      
      // Apply safe defaults
      if (query.maxResults && query.maxResults > 1000) {
        query.maxResults = 1000;
      }
    }
    
    // Use circuit breaker pattern
    return this.circuitBreaker.execute(
      async () => {
        const timer = new ExecutionTimer();
        const results = await executeQueryFn(query);
        
        // Process results in chunks if large
        if (results.length > 100) {
          console.log(`Processing ${results.length} results in chunks`);
          const chunker = new ArrayChunker(results);
          
          // Apply any post-processing in chunks
          await chunker.processWithAnimationFrames((chunk) => {
            // Do something with each chunk
            console.log(`Processing chunk of ${chunk.length} results`);
          });
        }
        
        return results;
      },
      // Fallback function if circuit breaker is open
      async () => {
        console.warn('Circuit breaker open, returning cached or empty results');
        // Here you would implement cache retrieval
        return [];
      }
    );
  }
  
  /**
   * Throttled version of regime update to prevent UI freezing
   */
  public throttledUpdateRegime = throttle(
    (regime: HorizontalLandRegime): void => {
      console.log(`Updating regime: ${regime.id}`);
      // Actual update logic would go here
    },
    100 // 100ms throttle
  );
  
  /**
   * Debounced search to prevent excessive API calls
   */
  public debouncedSearch = debounce(
    async (searchTerm: string): Promise<HorizontalLandRegime[]> => {
      console.log(`Searching for: ${searchTerm}`);
      // Actual search implementation would go here
      return [];
    },
    300 // 300ms debounce
  );
  
  /**
   * Helper method to get connected regime IDs
   * This is implementation-dependent and would need to be customized
   */
  private getConnectedRegimeIds(regime: HorizontalLandRegime): string[] {
    // Simple example just returns child IDs
    return regime.childIds || [];
  }
}

/**
 * Create a safe geospatial operation handler
 */
export function createSafeGeospatialOperations(): SafeGeospatialOperations {
  return new SafeGeospatialOperations();
}
