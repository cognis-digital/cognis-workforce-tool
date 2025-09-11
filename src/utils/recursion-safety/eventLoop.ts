/**
 * Event Loop Safety Utilities
 * Tools for preventing runaway event loops and ensuring UI responsiveness
 */

/**
 * Configuration for event loop safety
 */
export const EVENT_LOOP_CONFIG = {
  THROTTLE_INTERVAL_MS: 100,
  DEBOUNCE_DELAY_MS: 250,
  ANIMATION_FRAME_BUDGET_MS: 16,  // ~60fps
  IDLE_CALLBACK_TIMEOUT_MS: 50
};

/**
 * Throttle function calls to prevent event loop congestion
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number = EVENT_LOOP_CONFIG.THROTTLE_INTERVAL_MS
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let result: ReturnType<T> | undefined;
  
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    
    // If enough time has passed since the last call
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      result = fn(...args);
    }
    
    return result;
  };
}

/**
 * Debounce function calls to prevent excessive updates
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = EVENT_LOOP_CONFIG.DEBOUNCE_DELAY_MS
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  return (...args: Parameters<T>): void => {
    // Clear previous timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delayMs);
  };
}

/**
 * Queue class for batch processing tasks
 */
export class TaskQueue<T> {
  private queue: T[] = [];
  private processing: boolean = false;
  private batchSize: number;
  private processFn: (items: T[]) => Promise<void>;
  private autoProcess: boolean;
  private maxQueueSize: number;
  
  constructor(
    processFn: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    autoProcess: boolean = true,
    maxQueueSize: number = 1000
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.autoProcess = autoProcess;
    this.maxQueueSize = maxQueueSize;
  }
  
  /**
   * Add an item to the queue
   */
  public add(item: T): void {
    // Check for queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`TaskQueue: Queue size limit reached (${this.maxQueueSize}). Dropping older items.`);
      // Remove the oldest item
      this.queue.shift();
    }
    
    this.queue.push(item);
    
    if (this.autoProcess && !this.processing) {
      this.process();
    }
  }
  
  /**
   * Add multiple items to the queue
   */
  public addBatch(items: T[]): void {
    // Check for queue size limit
    if (this.queue.length + items.length > this.maxQueueSize) {
      console.warn(`TaskQueue: Queue size limit would be exceeded. Dropping older items.`);
      // Drop enough old items to fit the new ones
      const overage = (this.queue.length + items.length) - this.maxQueueSize;
      if (overage > 0) {
        this.queue.splice(0, overage);
      }
    }
    
    this.queue.push(...items);
    
    if (this.autoProcess && !this.processing) {
      this.process();
    }
  }
  
  /**
   * Start processing the queue
   */
  public async process(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        // Get the next batch
        const batch = this.queue.splice(0, this.batchSize);
        
        // Process the batch
        await this.processFn(batch);
      }
    } catch (error) {
      console.error('TaskQueue processing error:', error);
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Clear the queue
   */
  public clear(): void {
    this.queue = [];
  }
  
  /**
   * Get the queue length
   */
  public size(): number {
    return this.queue.length;
  }
}

/**
 * Split long-running operations across multiple animation frames
 * to keep the UI responsive
 */
export class AnimationFrameScheduler {
  private tasks: Array<() => boolean | void> = [];
  private isRunning: boolean = false;
  private frameId: number | null = null;
  private budgetMs: number;
  
  constructor(budgetMs: number = EVENT_LOOP_CONFIG.ANIMATION_FRAME_BUDGET_MS) {
    this.budgetMs = budgetMs;
  }
  
  /**
   * Add a task to the scheduler
   * @param task Function to execute. Return true to continue, false or void to complete.
   */
  public addTask(task: () => boolean | void): void {
    this.tasks.push(task);
    
    if (!this.isRunning) {
      this.start();
    }
  }
  
  /**
   * Start the scheduler
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frameId = requestAnimationFrame(this.processFrame.bind(this));
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }
  
  /**
   * Process tasks within a single animation frame
   */
  private processFrame(): void {
    const startTime = performance.now();
    let taskIndex = 0;
    
    // Process tasks until we run out of time or tasks
    while (taskIndex < this.tasks.length) {
      // Check if we've exceeded our time budget
      const elapsedMs = performance.now() - startTime;
      if (elapsedMs >= this.budgetMs) {
        break;
      }
      
      // Get and execute the current task
      const task = this.tasks[taskIndex];
      const result = task();
      
      // Remove the task if it's complete (returned false or void)
      if (result !== true) {
        this.tasks.splice(taskIndex, 1);
      } else {
        // Move to the next task
        taskIndex++;
      }
    }
    
    // If we have more tasks, schedule the next frame
    if (this.tasks.length > 0) {
      this.frameId = requestAnimationFrame(this.processFrame.bind(this));
    } else {
      this.isRunning = false;
      this.frameId = null;
    }
  }
}

/**
 * Use requestIdleCallback to run low-priority tasks when the browser is idle
 */
export class IdleTaskScheduler {
  private tasks: Array<(deadline: IdleDeadline) => boolean | void> = [];
  private isRunning: boolean = false;
  private idleId: number | null = null;
  private timeoutMs: number;
  
  constructor(timeoutMs: number = EVENT_LOOP_CONFIG.IDLE_CALLBACK_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }
  
  /**
   * Add a task to the scheduler
   * @param task Function to execute. Return true to continue, false or void to complete.
   */
  public addTask(task: (deadline: IdleDeadline) => boolean | void): void {
    this.tasks.push(task);
    
    if (!this.isRunning) {
      this.start();
    }
  }
  
  /**
   * Start the scheduler
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Use requestIdleCallback if available, otherwise use setTimeout as fallback
    if (typeof requestIdleCallback === 'function') {
      this.idleId = requestIdleCallback(this.processIdleTime.bind(this), { timeout: this.timeoutMs });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      this.idleId = setTimeout(
        () => this.processFallback(10), // 10ms is a reasonable fallback
        this.timeoutMs
      ) as unknown as number;
    }
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.idleId !== null) {
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(this.idleId);
      } else {
        clearTimeout(this.idleId as unknown as ReturnType<typeof setTimeout>);
      }
      this.idleId = null;
    }
    this.isRunning = false;
  }
  
  /**
   * Process tasks during idle time
   */
  private processIdleTime(deadline: IdleDeadline): void {
    let taskIndex = 0;
    
    // Process tasks until we run out of time or tasks
    while (taskIndex < this.tasks.length && deadline.timeRemaining() > 0) {
      // Get and execute the current task
      const task = this.tasks[taskIndex];
      const result = task(deadline);
      
      // Remove the task if it's complete (returned false or void)
      if (result !== true) {
        this.tasks.splice(taskIndex, 1);
      } else {
        // Move to the next task
        taskIndex++;
      }
    }
    
    // If we have more tasks, schedule the next idle callback
    if (this.tasks.length > 0) {
      if (typeof requestIdleCallback === 'function') {
        this.idleId = requestIdleCallback(this.processIdleTime.bind(this), { timeout: this.timeoutMs });
      } else {
        this.idleId = setTimeout(
          () => this.processFallback(10),
          this.timeoutMs
        ) as unknown as number;
      }
    } else {
      this.isRunning = false;
      this.idleId = null;
    }
  }
  
  /**
   * Fallback for browsers without requestIdleCallback
   */
  private processFallback(timeSliceMs: number): void {
    const startTime = performance.now();
    const deadline = {
      didTimeout: false,
      timeRemaining: () => Math.max(0, timeSliceMs - (performance.now() - startTime))
    };
    
    this.processIdleTime(deadline as IdleDeadline);
  }
}

/**
 * Utility for chunking large arrays to prevent event loop blocking
 */
export class ArrayChunker<T> {
  private array: T[];
  private chunkSize: number;
  private currentIndex: number = 0;
  
  constructor(array: T[], chunkSize: number = 100) {
    this.array = array;
    this.chunkSize = chunkSize;
  }
  
  /**
   * Process the array in chunks with animation frame scheduling
   */
  public async processWithAnimationFrames(
    processFn: (items: T[]) => void
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const scheduler = new AnimationFrameScheduler();
      
      scheduler.addTask(() => {
        if (this.currentIndex >= this.array.length) {
          resolve();
          return false; // Complete
        }
        
        const end = Math.min(this.currentIndex + this.chunkSize, this.array.length);
        const chunk = this.array.slice(this.currentIndex, end);
        
        processFn(chunk);
        
        this.currentIndex = end;
        return true; // Continue
      });
    });
  }
  
  /**
   * Process the array in chunks with idle time scheduling
   */
  public async processWithIdleTime(
    processFn: (items: T[]) => void
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const scheduler = new IdleTaskScheduler();
      
      scheduler.addTask((deadline) => {
        if (this.currentIndex >= this.array.length) {
          resolve();
          return false; // Complete
        }
        
        // Calculate how many items we can process
        const remainingTime = deadline.timeRemaining();
        const estimatedTimePerItem = 0.1; // milliseconds, adjust based on processFn complexity
        const itemsToProcess = Math.min(
          this.chunkSize,
          Math.floor(remainingTime / estimatedTimePerItem),
          this.array.length - this.currentIndex
        );
        
        if (itemsToProcess <= 0) {
          return true; // Continue in next idle period
        }
        
        const end = this.currentIndex + itemsToProcess;
        const chunk = this.array.slice(this.currentIndex, end);
        
        processFn(chunk);
        
        this.currentIndex = end;
        return this.currentIndex < this.array.length; // Continue if more items
      });
    });
  }
  
  /**
   * Process the array in chunks asynchronously with timeouts
   */
  public async processWithTimeouts(
    processFn: (items: T[]) => void,
    timeoutMs: number = 0
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const processNextChunk = () => {
        if (this.currentIndex >= this.array.length) {
          resolve();
          return;
        }
        
        const end = Math.min(this.currentIndex + this.chunkSize, this.array.length);
        const chunk = this.array.slice(this.currentIndex, end);
        
        processFn(chunk);
        
        this.currentIndex = end;
        
        // Schedule next chunk
        setTimeout(processNextChunk, timeoutMs);
      };
      
      processNextChunk();
    });
  }
  
  /**
   * Reset the chunker to start from the beginning
   */
  public reset(): void {
    this.currentIndex = 0;
  }
}

/**
 * Generator-based iterator for processing large datasets
 */
export function* chunkGenerator<T>(
  array: T[],
  chunkSize: number = 100
): Generator<T[], void, unknown> {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    yield chunk;
  }
}

/**
 * Process a generator with animation frame scheduling
 */
export async function processGeneratorWithAnimationFrames<T>(
  generator: Generator<T, void, unknown>,
  processFn: (item: T) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    let result = generator.next();
    
    const scheduler = new AnimationFrameScheduler();
    
    scheduler.addTask(() => {
      if (result.done) {
        resolve();
        return false; // Complete
      }
      
      // Safe to use result.value as T since we checked result.done
      processFn(result.value as T);
      result = generator.next();
      
      return !result.done; // Continue if not done
    });
  });
}
