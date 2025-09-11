/**
 * Recursion Monitoring Utilities
 * Tools for monitoring execution time, memory usage, and call stack depth
 */

// Chrome's non-standard Performance Memory API interface
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Extend Performance interface with Chrome-specific memory property
interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Configuration for performance monitoring thresholds
 */
export const MONITOR_THRESHOLDS = {
  EXECUTION_TIME_MS: 5000,     // 5 seconds
  MEMORY_GROWTH_MB: 100,       // 100 MB
  STACK_DEPTH_WARNING: 50,     // Warning at 50 levels
  STACK_DEPTH_CRITICAL: 100,   // Critical at 100 levels
  ITERATION_WARNING: 10000,    // Warning at 10,000 iterations
};

/**
 * Tracks execution time of operations
 */
export class ExecutionTimer {
  private startTime: number;
  private timeoutMs: number;
  private checkInterval: number;
  private lastCheckTime: number;
  
  /**
   * @param timeoutMs Maximum allowed execution time in milliseconds
   * @param checkInterval How frequently to perform time checks (performance optimization)
   */
  constructor(
    timeoutMs: number = MONITOR_THRESHOLDS.EXECUTION_TIME_MS,
    checkInterval: number = 100
  ) {
    this.startTime = performance.now();
    this.lastCheckTime = this.startTime;
    this.timeoutMs = timeoutMs;
    this.checkInterval = checkInterval;
  }
  
  /**
   * Check if the operation has exceeded its time limit
   * @param forceCheck If true, always check regardless of interval
   * @returns Time elapsed in milliseconds
   * @throws Error if timeout exceeded
   */
  public checkTimeout(forceCheck: boolean = false): number {
    const now = performance.now();
    
    // Skip check if not forced and interval hasn't elapsed
    if (!forceCheck && (now - this.lastCheckTime < this.checkInterval)) {
      return now - this.startTime;
    }
    
    this.lastCheckTime = now;
    const elapsed = now - this.startTime;
    
    if (elapsed > this.timeoutMs) {
      throw new Error(`Operation timed out after ${elapsed.toFixed(2)}ms (limit: ${this.timeoutMs}ms)`);
    }
    
    return elapsed;
  }
  
  /**
   * Reset the timer
   */
  public reset(): void {
    this.startTime = performance.now();
    this.lastCheckTime = this.startTime;
  }
  
  /**
   * Get elapsed time without checking timeout
   */
  public getElapsedTime(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * Monitors memory usage
 * Note: This relies on Chrome's non-standard performance.memory API
 * In environments where it's not available, it will fall back to passive mode
 */
export class MemoryMonitor {
  private initialHeapUsed: number | null = null;
  private maxHeapGrowthBytes: number;
  private available: boolean = false;
  
  constructor(maxHeapGrowthMB: number = MONITOR_THRESHOLDS.MEMORY_GROWTH_MB) {
    this.maxHeapGrowthBytes = maxHeapGrowthMB * 1024 * 1024;
    this.initialize();
  }
  
  private initialize(): void {
    // Check if memory API is available
    // Cast to extended interface with memory property
    const perf = performance as PerformanceWithMemory;
    if (typeof perf !== 'undefined' && 
        perf.memory && 
        typeof perf.memory.usedJSHeapSize === 'number') {
      this.initialHeapUsed = perf.memory.usedJSHeapSize;
      this.available = true;
    } else {
      console.warn('Memory monitoring not available in this environment');
      this.available = false;
    }
  }
  
  /**
   * Check current memory usage against threshold
   * @returns Current memory growth in bytes, or null if monitoring not available
   * @throws Error if memory usage exceeds threshold
   */
  public checkMemory(): number | null {
    if (!this.available || this.initialHeapUsed === null) return null;
    
    const perf = performance as PerformanceWithMemory;
    const currentHeapUsed = perf.memory!.usedJSHeapSize;
    const memoryGrowth = currentHeapUsed - this.initialHeapUsed;
    
    if (memoryGrowth > this.maxHeapGrowthBytes) {
      const growthMB = memoryGrowth / (1024 * 1024);
      const limitMB = this.maxHeapGrowthBytes / (1024 * 1024);
      throw new Error(`Memory usage exceeded: ${growthMB.toFixed(2)}MB (limit: ${limitMB}MB)`);
    }
    
    return memoryGrowth;
  }
  
  /**
   * Reset the initial memory baseline
   */
  public reset(): void {
    const perf = performance as PerformanceWithMemory;
    if (this.available && perf.memory) {
      this.initialHeapUsed = perf.memory.usedJSHeapSize;
    }
  }
  
  /**
   * Get current memory usage in MB
   * @returns Current memory usage in MB, or null if not available
   */
  public getCurrentMemoryUsageMB(): number | null {
    const perf = performance as PerformanceWithMemory;
    if (!this.available || !perf.memory) return null;
    return perf.memory.usedJSHeapSize / (1024 * 1024);
  }
}

/**
 * Tracks stack depth to prevent stack overflow
 */
export class StackDepthTracker {
  private depth: number = 0;
  private maxDepth: number = 0;
  private warningThreshold: number;
  private criticalThreshold: number;
  private onWarning?: (depth: number) => void;
  private onCritical?: (depth: number) => void;
  
  constructor(
    warningThreshold: number = MONITOR_THRESHOLDS.STACK_DEPTH_WARNING,
    criticalThreshold: number = MONITOR_THRESHOLDS.STACK_DEPTH_CRITICAL,
    onWarning?: (depth: number) => void,
    onCritical?: (depth: number) => void
  ) {
    this.warningThreshold = warningThreshold;
    this.criticalThreshold = criticalThreshold;
    this.onWarning = onWarning;
    this.onCritical = onCritical;
  }
  
  /**
   * Increment stack depth counter
   * @returns Current depth after increment
   */
  public enter(): number {
    this.depth += 1;
    
    // Update max depth
    if (this.depth > this.maxDepth) {
      this.maxDepth = this.depth;
    }
    
    // Check thresholds
    this.checkThresholds();
    
    return this.depth;
  }
  
  /**
   * Decrement stack depth counter
   * @returns Current depth after decrement
   */
  public exit(): number {
    if (this.depth > 0) {
      this.depth -= 1;
    }
    return this.depth;
  }
  
  /**
   * Get current depth
   */
  public getDepth(): number {
    return this.depth;
  }
  
  /**
   * Get maximum depth reached
   */
  public getMaxDepth(): number {
    return this.maxDepth;
  }
  
  /**
   * Reset the tracker
   */
  public reset(): void {
    this.depth = 0;
    this.maxDepth = 0;
  }
  
  /**
   * Check if current depth exceeds thresholds
   */
  private checkThresholds(): void {
    if (this.depth >= this.criticalThreshold && this.onCritical) {
      this.onCritical(this.depth);
    } else if (this.depth >= this.warningThreshold && this.onWarning) {
      this.onWarning(this.depth);
    }
  }
}

/**
 * Combines multiple monitoring strategies
 */
export class OperationMonitor {
  private timer: ExecutionTimer;
  private memoryMonitor: MemoryMonitor;
  private stackTracker: StackDepthTracker;
  private iterationCount: number = 0;
  private iterationWarningThreshold: number;
  private checkFrequency: number = 100; // Check every N iterations
  
  constructor(
    timeoutMs: number = MONITOR_THRESHOLDS.EXECUTION_TIME_MS,
    maxMemoryGrowthMB: number = MONITOR_THRESHOLDS.MEMORY_GROWTH_MB,
    stackWarningThreshold: number = MONITOR_THRESHOLDS.STACK_DEPTH_WARNING,
    stackCriticalThreshold: number = MONITOR_THRESHOLDS.STACK_DEPTH_CRITICAL,
    iterationWarningThreshold: number = MONITOR_THRESHOLDS.ITERATION_WARNING
  ) {
    this.timer = new ExecutionTimer(timeoutMs);
    this.memoryMonitor = new MemoryMonitor(maxMemoryGrowthMB);
    this.stackTracker = new StackDepthTracker(
      stackWarningThreshold,
      stackCriticalThreshold,
      (depth) => console.warn(`Stack depth warning: ${depth}`),
      (depth) => console.error(`Stack depth critical: ${depth}`)
    );
    this.iterationWarningThreshold = iterationWarningThreshold;
  }
  
  /**
   * Track a recursive function call
   */
  public enterFunction(): void {
    this.stackTracker.enter();
  }
  
  /**
   * Track a recursive function return
   */
  public exitFunction(): void {
    this.stackTracker.exit();
  }
  
  /**
   * Track an iteration in a loop
   */
  public trackIteration(): void {
    this.iterationCount++;
    
    // Only check on every Nth iteration for performance
    if (this.iterationCount % this.checkFrequency === 0) {
      this.performChecks();
      
      // Check iteration threshold
      if (this.iterationCount > this.iterationWarningThreshold) {
        console.warn(`Iteration count warning: ${this.iterationCount}`);
      }
    }
  }
  
  /**
   * Check all monitoring metrics
   */
  public performChecks(): void {
    this.timer.checkTimeout();
    this.memoryMonitor.checkMemory();
  }
  
  /**
   * Reset all monitors
   */
  public reset(): void {
    this.timer.reset();
    this.memoryMonitor.reset();
    this.stackTracker.reset();
    this.iterationCount = 0;
  }
  
  /**
   * Get monitor stats
   */
  public getStats(): {
    elapsedTimeMs: number,
    stackDepth: number,
    maxStackDepth: number,
    iterationCount: number,
    memoryUsageMB: number | null
  } {
    return {
      elapsedTimeMs: this.timer.getElapsedTime(),
      stackDepth: this.stackTracker.getDepth(),
      maxStackDepth: this.stackTracker.getMaxDepth(),
      iterationCount: this.iterationCount,
      memoryUsageMB: this.memoryMonitor.getCurrentMemoryUsageMB()
    };
  }
  
  /**
   * Create a function wrapper that adds monitoring to an existing function
   */
  public static createMonitoredFunction<T extends (...args: any[]) => any>(
    fn: T,
    monitor: OperationMonitor
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      monitor.enterFunction();
      try {
        monitor.performChecks();
        return fn(...args);
      } finally {
        monitor.exitFunction();
      }
    };
  }
}
