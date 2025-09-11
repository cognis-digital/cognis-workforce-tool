/**
 * Recovery Strategies
 * Tools for graceful failure handling and recovery from recursion problems
 */

/**
 * Circuit breaker pattern implementation
 * Prevents repeated calls to failing functions
 */
export class CircuitBreaker {
  // Circuit states
  private static readonly CLOSED = 'CLOSED';      // Normal operation
  private static readonly OPEN = 'OPEN';          // Failing, rejecting calls
  private static readonly HALF_OPEN = 'HALF_OPEN'; // Testing if system recovered
  
  private state: string = CircuitBreaker.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private halfOpenSuccessThreshold: number;
  private halfOpenSuccessCount: number = 0;
  
  private errorHandler?: (error: Error) => void;
  
  constructor(
    failureThreshold: number = 5,
    resetTimeoutMs: number = 5000,
    halfOpenSuccessThreshold: number = 2,
    errorHandler?: (error: Error) => void
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.halfOpenSuccessThreshold = halfOpenSuccessThreshold;
    this.errorHandler = errorHandler;
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  public async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreaker.OPEN) {
      const now = Date.now();
      // Check if timeout elapsed to transition to half-open
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.transitionToHalfOpen();
      } else {
        // Circuit still open, reject or use fallback
        const error = new Error('Circuit breaker open, rejecting call');
        if (fallback) {
          return fallback();
        }
        throw error;
      }
    }
    
    try {
      // Execute the function
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      
      // Try fallback if available
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }
  
  /**
   * Execute a synchronous function with circuit breaker protection
   */
  public executeSync<T>(fn: () => T, fallback?: () => T): T {
    // Check if circuit is open
    if (this.state === CircuitBreaker.OPEN) {
      const now = Date.now();
      // Check if timeout elapsed to transition to half-open
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.transitionToHalfOpen();
      } else {
        // Circuit still open, reject or use fallback
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker open, rejecting call');
      }
    }
    
    try {
      // Execute the function
      const result = fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      
      // Try fallback if available
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }
  
  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitBreaker.HALF_OPEN) {
      this.halfOpenSuccessCount++;
      
      // Check if we've hit the threshold to close the circuit
      if (this.halfOpenSuccessCount >= this.halfOpenSuccessThreshold) {
        this.state = CircuitBreaker.CLOSED;
        this.failureCount = 0;
        this.halfOpenSuccessCount = 0;
      }
    }
  }
  
  /**
   * Record a failed operation
   */
  private recordFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Notify error handler if provided
    if (this.errorHandler) {
      this.errorHandler(error);
    }
    
    // If in half-open state, any failure trips the circuit again
    if (this.state === CircuitBreaker.HALF_OPEN) {
      this.state = CircuitBreaker.OPEN;
      this.halfOpenSuccessCount = 0;
      return;
    }
    
    // In closed state, check if we've hit the threshold
    if (this.state === CircuitBreaker.CLOSED && this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreaker.OPEN;
    }
  }
  
  /**
   * Transition from open to half-open state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreaker.HALF_OPEN;
    this.halfOpenSuccessCount = 0;
  }
  
  /**
   * Reset the circuit breaker
   */
  public reset(): void {
    this.state = CircuitBreaker.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.halfOpenSuccessCount = 0;
  }
  
  /**
   * Get current circuit state
   */
  public getState(): string {
    return this.state;
  }
}

/**
 * Retry policy with exponential backoff
 */
export class RetryPolicy {
  private maxAttempts: number;
  private baseDelayMs: number;
  private maxDelayMs: number;
  private jitterFactor: number;
  
  constructor(
    maxAttempts: number = 3,
    baseDelayMs: number = 100,
    maxDelayMs: number = 5000,
    jitterFactor: number = 0.2
  ) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.jitterFactor = jitterFactor;
  }
  
  /**
   * Execute a function with retry logic
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    shouldRetry: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (!shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Skip delay on the last attempt
        if (attempt < this.maxAttempts) {
          // Calculate delay with exponential backoff and jitter
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Execute a synchronous function with retry logic
   */
  public executeWithRetrySync<T>(
    fn: () => T,
    shouldRetry: (error: Error) => boolean = () => true
  ): T {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return fn();
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (!shouldRetry(lastError)) {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    const jitter = this.jitterFactor * cappedDelay * (Math.random() * 2 - 1);
    
    return Math.max(0, cappedDelay + jitter);
  }
  
  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Fallback strategies for when primary operations fail
 */
export class FallbackStrategies {
  /**
   * Create a fallback function for spatial operations
   * @param mainFn The main function that might fail
   * @param fallbackFn The fallback function to use if main fails
   */
  public static withFallback<T, Args extends any[]>(
    mainFn: (...args: Args) => T,
    fallbackFn: (...args: Args) => T
  ): (...args: Args) => T {
    return (...args: Args): T => {
      try {
        return mainFn(...args);
      } catch (error) {
        console.warn(`Main function failed, using fallback: ${(error as Error).message}`);
        return fallbackFn(...args);
      }
    };
  }
  
  /**
   * Get cached results if live computation fails
   * @param cacheFn Function to get cached results
   */
  public static withCache<T, Args extends any[]>(
    mainFn: (...args: Args) => T,
    cacheFn: (...args: Args) => T | null
  ): (...args: Args) => T {
    return (...args: Args): T => {
      try {
        return mainFn(...args);
      } catch (error) {
        const cachedResult = cacheFn(...args);
        if (cachedResult === null) {
          throw error; // No cached result available
        }
        return cachedResult;
      }
    };
  }
  
  /**
   * Return default value if operation fails
   */
  public static withDefault<T, Args extends any[]>(
    fn: (...args: Args) => T,
    defaultValue: T
  ): (...args: Args) => T {
    return (...args: Args): T => {
      try {
        return fn(...args);
      } catch (error) {
        console.warn(`Function failed, using default value: ${(error as Error).message}`);
        return defaultValue;
      }
    };
  }
}

/**
 * Graceful degradation for recursive operations
 */
export class GracefulDegradation {
  /**
   * Execute a function with graceful degradation
   * Attempts multiple strategies with decreasing complexity until one succeeds
   * @param strategies Array of functions to try in order
   */
  public static async execute<T>(strategies: Array<() => Promise<T>>): Promise<T> {
    let lastError: Error | undefined;
    
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Strategy failed: ${lastError.message}, trying next strategy...`);
      }
    }
    
    throw new Error(`All strategies failed. Last error: ${lastError?.message}`);
  }
  
  /**
   * Execute a synchronous function with graceful degradation
   * @param strategies Array of functions to try in order
   */
  public static executeSync<T>(strategies: Array<() => T>): T {
    let lastError: Error | undefined;
    
    for (const strategy of strategies) {
      try {
        return strategy();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Strategy failed: ${lastError.message}, trying next strategy...`);
      }
    }
    
    throw new Error(`All strategies failed. Last error: ${lastError?.message}`);
  }
}

/**
 * Bulkhead pattern implementation to isolate failures
 */
export class Bulkhead {
  private maxConcurrent: number;
  private activeCount: number = 0;
  private queue: Array<{ resolve: () => void, reject: (error: Error) => void }> = [];
  private timeout: number;
  
  constructor(maxConcurrent: number = 10, timeoutMs: number = 30000) {
    this.maxConcurrent = maxConcurrent;
    this.timeout = timeoutMs;
  }
  
  /**
   * Execute a function within the bulkhead
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for a slot to become available
    await this.acquireSlot();
    
    try {
      return await fn();
    } finally {
      this.releaseSlot();
    }
  }
  
  /**
   * Acquire a slot in the bulkhead
   */
  private async acquireSlot(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      // Slot available immediately
      this.activeCount++;
      return;
    }
    
    // Need to wait for a slot
    return new Promise<void>((resolve, reject) => {
      // Set timeout to prevent indefinite waiting
      const timer = setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error(`Bulkhead timeout after ${this.timeout}ms`));
      }, this.timeout);
      
      this.queue.push({
        resolve: () => {
          clearTimeout(timer);
          this.activeCount++;
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
    });
  }
  
  /**
   * Release a slot in the bulkhead
   */
  private releaseSlot(): void {
    this.activeCount--;
    
    // Check if anyone is waiting
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        next.resolve();
      }
    }
  }
}
