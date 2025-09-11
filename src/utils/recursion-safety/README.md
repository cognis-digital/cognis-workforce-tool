# Recursion Safety Module

A comprehensive utility library for preventing infinite recursion and runaway event loops in the Cognis Workforce Tool's geospatial operations.

## Overview

This module provides four key strategies to ensure safe recursive operations:

1. **Prevention** - Techniques to stop infinite recursion before it happens
2. **Monitoring** - Tools to track execution time and resource usage
3. **Recovery** - Patterns for gracefully handling failures
4. **Event Loop Safety** - Design patterns for maintaining UI responsiveness

## Usage

### Basic Usage

```typescript
import { createSafeGeospatialOperations } from './utils/recursion-safety';

// Create a safe operations handler
const safeOps = createSafeGeospatialOperations();

// Use safe versions of geospatial operations
const results = await safeOps.findAllConnectedRegimesSafe('regime-123', fetchRegime);

// Apply throttling to UI updates
safeOps.throttledUpdateRegime(updatedRegime);

// Use debounced search to prevent excessive API calls
safeOps.debouncedSearch('forest');
```

### Individual Utilities

You can also use the individual utilities directly:

#### Prevention

```typescript
import { SafeRegimeTraversal, CycleDetector, validateSpatialQuerySafety } from './utils/recursion-safety';

// Create a traversal helper with depth limiting and cycle detection
const traversal = new SafeRegimeTraversal();
traversal.traverseRegime(startRegime, 0, (regime, depth) => {
  console.log(`Processing regime ${regime.id} at depth ${depth}`);
});

// Use cycle detection independently
const detector = new CycleDetector<string>();
if (!detector.checkAndMark('nodeId')) {
  // Process the node
  detector.unmark('nodeId'); // When done with this branch
}

// Validate query parameters before execution
if (validateSpatialQuerySafety(spatialQuery)) {
  // Execute the query
}
```

#### Monitoring

```typescript
import { ExecutionTimer, OperationMonitor } from './utils/recursion-safety';

// Create a timer to prevent long-running operations
const timer = new ExecutionTimer(5000); // 5 second timeout

function processData() {
  // Check timeout periodically
  timer.checkTimeout();
  
  // Do work...
}

// Use comprehensive monitoring
const monitor = new OperationMonitor();

// Create a monitored version of a function
const safeFunction = OperationMonitor.createMonitoredFunction(myFunction, monitor);
```

#### Recovery

```typescript
import { CircuitBreaker, RetryPolicy, FallbackStrategies } from './utils/recursion-safety';

// Circuit breaker prevents cascading failures
const breaker = new CircuitBreaker();
const result = await breaker.execute(
  async () => await fetchData(),
  async () => cachedData // Fallback function
);

// Retry with exponential backoff
const retry = new RetryPolicy();
const result = await retry.executeWithRetry(
  async () => await fetchData(),
  (error) => error instanceof NetworkError // Only retry network errors
);

// Add fallbacks to any function
const safeFn = FallbackStrategies.withFallback(
  mainImplementation,
  fallbackImplementation
);
```

#### Event Loop Safety

```typescript
import { throttle, debounce, ArrayChunker } from './utils/recursion-safety';

// Throttle frequent updates
const throttledUpdate = throttle(() => updateUI(), 100);

// Debounce user input
const debouncedSearch = debounce(
  (term) => searchAPI(term),
  300
);

// Process large arrays without blocking the UI
const chunker = new ArrayChunker(largeArray, 100);
await chunker.processWithAnimationFrames((chunk) => {
  // Process each chunk during animation frames
});
```

## Key Classes & Functions

### Prevention
- `SafeRegimeTraversal` - Safe traversal with depth limiting and cycle detection
- `CycleDetector` - Detect cycles in graph traversals
- `validateSpatialQuerySafety` - Validate query parameters for safety

### Monitoring
- `ExecutionTimer` - Track execution time with configurable limits
- `MemoryMonitor` - Track memory usage
- `StackDepthTracker` - Monitor recursion depth
- `OperationMonitor` - Comprehensive monitoring solution

### Recovery
- `CircuitBreaker` - Prevent cascading failures
- `RetryPolicy` - Automatic retry with exponential backoff
- `FallbackStrategies` - Graceful degradation patterns
- `GracefulDegradation` - Try multiple strategies in order
- `Bulkhead` - Isolate failures to prevent system-wide impact

### Event Loop
- `throttle` - Limit function call frequency
- `debounce` - Delay execution until input stabilizes
- `TaskQueue` - Queue for batch processing
- `AnimationFrameScheduler` - Distribute work across animation frames
- `IdleTaskScheduler` - Use browser idle time for low-priority tasks
- `ArrayChunker` - Process large arrays in chunks

## Configuration

Default thresholds and limits are defined in configuration objects:

- `RECURSION_LIMITS` - Default depth limits
- `MONITOR_THRESHOLDS` - Execution time and memory thresholds
- `EVENT_LOOP_CONFIG` - Throttle and debounce intervals

You can adjust these values according to your application's needs.

## Integration

For a complete integration example, see `SafeGeospatialOperations` class in the index.ts file.
