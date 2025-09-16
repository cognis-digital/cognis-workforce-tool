/**
 * Metrics and Observability for Cognis Workforce Tool
 * Tracks operational metrics and provides monitoring capabilities
 */

// Initialize metrics storage
export const metrics: Record<string, number> = {
  // Task metrics
  task_created: 0,
  task_completed: 0,
  task_failed: 0,
  task_blocked: 0,
  task_error: 0,
  
  // Subtask metrics
  subtask_created: 0,
  subtask_completed: 0,
  subtask_failed: 0,
  
  // Content generation metrics
  content_generated: 0,
  content_validated: 0,
  content_fixed: 0,
  
  // Validation metrics
  validation_passed: 0,
  validation_failed: 0,
  
  // GitHub metrics
  pr_created: 0,
  pr_approved: 0,
  pr_rejected: 0,
  pr_merged: 0,
  ci_success: 0,
  ci_failure: 0,
  
  // Review metrics
  human_review_requested: 0,
  task_approved: 0,
  task_rejected: 0,
  changes_requested: 0,
  
  // Performance metrics
  avg_completion_time_ms: 0,
  avg_validation_time_ms: 0,
  avg_fix_time_ms: 0
};

// Store timing data for performance metrics
const timings: Record<string, Record<string, number>> = {};

/**
 * Record a metric occurrence
 */
export function recordMetric(metricName: string, value: number = 1): void {
  if (metrics[metricName] !== undefined) {
    metrics[metricName] += value;
  } else {
    metrics[metricName] = value;
  }
}

/**
 * Start timing an operation
 */
export function startTiming(category: string, id: string): void {
  if (!timings[category]) {
    timings[category] = {};
  }
  
  timings[category][id] = Date.now();
}

/**
 * End timing an operation and record the duration
 */
export function endTiming(category: string, id: string): number {
  if (!timings[category] || !timings[category][id]) {
    return 0;
  }
  
  const startTime = timings[category][id];
  const duration = Date.now() - startTime;
  
  // Clean up timing data
  delete timings[category][id];
  
  // Update average metrics
  switch (category) {
    case 'task_completion':
      updateAverageMetric('avg_completion_time_ms', duration);
      break;
    case 'validation':
      updateAverageMetric('avg_validation_time_ms', duration);
      break;
    case 'fix':
      updateAverageMetric('avg_fix_time_ms', duration);
      break;
  }
  
  return duration;
}

/**
 * Update an average metric
 */
function updateAverageMetric(metricName: string, newValue: number): void {
  const currentCount = metrics[`${metricName}_count`] || 0;
  const currentAvg = metrics[metricName] || 0;
  
  // Calculate new average
  const newCount = currentCount + 1;
  const newAvg = (currentAvg * currentCount + newValue) / newCount;
  
  // Update metrics
  metrics[metricName] = newAvg;
  metrics[`${metricName}_count`] = newCount;
}

/**
 * Get all current metrics
 */
export function getAllMetrics(): Record<string, number> {
  return { ...metrics };
}

/**
 * Reset metrics (for testing purposes)
 */
export function resetMetrics(): void {
  Object.keys(metrics).forEach(key => {
    metrics[key] = 0;
  });
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  avgCompletionTime: number;
  avgValidationTime: number;
  avgFixTime: number;
  taskSuccessRate: number;
  validationSuccessRate: number;
} {
  const taskSuccessRate = metrics.task_completed === 0 ? 
    0 : metrics.task_completed / (metrics.task_completed + metrics.task_failed);
    
  const validationSuccessRate = metrics.validation_passed === 0 ?
    0 : metrics.validation_passed / (metrics.validation_passed + metrics.validation_failed);
    
  return {
    avgCompletionTime: metrics.avg_completion_time_ms,
    avgValidationTime: metrics.avg_validation_time_ms,
    avgFixTime: metrics.avg_fix_time_ms,
    taskSuccessRate,
    validationSuccessRate
  };
}

/**
 * Register metrics event handlers
 * @param eventBus - Event emitter instance to listen to
 */
export function registerMetricsEventHandlers(eventBus: any): void {
  // Task events
  eventBus.on('task_created', () => recordMetric('task_created'));
  eventBus.on('task_completed', () => recordMetric('task_completed'));
  eventBus.on('task_failed', () => recordMetric('task_failed'));
  eventBus.on('task_blocked', () => recordMetric('task_blocked'));
  
  // Content events
  eventBus.on('subtask_completed', (event: any) => {
    recordMetric('subtask_completed');
    if (event.payload.type === 'generate') {
      recordMetric('content_generated');
    }
  });
  
  // Validation events
  eventBus.on('validation_passed', () => {
    recordMetric('validation_passed');
    recordMetric('content_validated');
  });
  
  eventBus.on('validation_failed', () => {
    recordMetric('validation_failed');
    recordMetric('content_validated');
  });
  
  // Fix events
  eventBus.on('artifact_fixed', () => recordMetric('content_fixed'));
  
  // PR events
  eventBus.on('pr_created', () => recordMetric('pr_created'));
  eventBus.on('pr_merged', () => recordMetric('pr_merged'));
  
  // Error events
  eventBus.on('error', () => recordMetric('task_error'));
}
