/**
 * Workforce Orchestrator
 * Main entry point for the Cognis Workforce Tool system
 */
import { createTask, Task } from './models';
import { storeTask, initializeStorage, loadTask, listTasks, exportTaskData } from './storage';
import { initializeEventSystem, processTask } from './events';
import { ENV } from '../../util/env';
import { metrics, recordMetric } from './metrics';

/**
 * Initialize the workforce system
 */
export async function initializeWorkforceSystem(): Promise<void> {
  try {
    console.log('🚀 Initializing Cognis Workforce System...');
    
    // Initialize storage
    await initializeStorage();
    
    // Initialize event system and register agents
    initializeEventSystem();
    
    console.log('✅ Workforce system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize workforce system:', error);
    throw error;
  }
}

/**
 * Parse instruction text into a task
 */
export async function parseInstructionToTask(
  instructionText: string,
  meta: Record<string, any> = {}
): Promise<Task> {
  // Record metric for task creation
  recordMetric('task_created');
  
  // Parse instruction to create task
  const task = createTask(instructionText, meta.role || 'CEO', meta);
  
  // Store task in persistent storage
  await storeTask(task);
  
  console.log(`📋 Created new task: ${task.task_id}`);
  console.log(`📝 Objective: ${task.objective}`);
  console.log(`🎯 Deliverables: ${task.deliverables.join(', ')}`);
  
  return task;
}

/**
 * Handle CEO instruction and initiate task processing
 */
export async function handleCeoInstruction(
  instructionText: string,
  meta: Record<string, any> = {}
): Promise<string> {
  try {
    // Parse instruction to task
    const task = await parseInstructionToTask(instructionText, meta);
    
    // Start task processing
    await processTask(task.task_id);
    
    return task.task_id;
  } catch (error) {
    console.error('❌ Failed to handle CEO instruction:', error);
    throw error;
  }
}

/**
 * Get task status
 */
export async function getTaskStatus(taskId: string): Promise<{
  task: Task | null;
  status: string;
  progress: number;
  latestAudit?: { action: string; timestamp: string };
}> {
  try {
    const task = await loadTask(taskId);
    
    if (!task) {
      return {
        task: null,
        status: 'not_found',
        progress: 0
      };
    }
    
    // Calculate progress based on subtasks
    const totalSubtasks = task.subtasks.length || 1; // Avoid division by zero
    const completedSubtasks = task.subtasks.filter(s => 
      s.status === 'done' || s.status === 'failed'
    ).length;
    
    const progress = Math.floor((completedSubtasks / totalSubtasks) * 100);
    
    // Get latest audit entry
    const latestAudit = task.audit_log.length > 0
      ? {
          action: task.audit_log[task.audit_log.length - 1].action,
          timestamp: task.audit_log[task.audit_log.length - 1].timestamp
        }
      : undefined;
    
    return {
      task,
      status: task.status,
      progress,
      latestAudit
    };
  } catch (error) {
    console.error(`❌ Failed to get task status for ${taskId}:`, error);
    throw error;
  }
}

/**
 * List all tasks with basic information
 */
export async function listAllTasks(): Promise<Array<{
  id: string;
  objective: string;
  status: string;
  deliverables: string[];
  created_at: string;
}>> {
  try {
    const tasks = await listTasks();
    
    // Enhance task list with more details
    const enhancedTasks = await Promise.all(
      tasks.map(async ({ id }) => {
        const task = await loadTask(id);
        return {
          id,
          objective: task?.objective || 'Unknown',
          status: task?.status || 'unknown',
          deliverables: task?.deliverables || [],
          created_at: task?.created_at || ''
        };
      })
    );
    
    return enhancedTasks;
  } catch (error) {
    console.error('❌ Failed to list tasks:', error);
    return [];
  }
}

/**
 * Handle task approval or rejection by human reviewer
 */
export async function handleTaskReview(
  taskId: string,
  reviewerId: string,
  action: 'approve' | 'reject' | 'request_changes',
  comments: string
): Promise<boolean> {
  try {
    const task = await loadTask(taskId);
    
    if (!task) {
      console.error(`Task ${taskId} not found for review`);
      return false;
    }
    
    // Record the review in audit log
    task.audit_log.push({
      timestamp: new Date().toISOString(),
      actor: reviewerId,
      action: `review_${action}`,
      details: { comments }
    });
    
    // Update task status based on review action
    if (action === 'approve') {
      task.status = 'done';
      recordMetric('task_approved');
    } else if (action === 'reject') {
      task.status = 'failed';
      recordMetric('task_rejected');
    } else if (action === 'request_changes') {
      // Return to in_progress state for additional work
      task.status = 'in_progress';
      recordMetric('changes_requested');
    }
    
    // Save updated task
    await storeTask(task);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to process review for task ${taskId}:`, error);
    return false;
  }
}

/**
 * Get system health status
 */
export function getSystemHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, number>;
  lastError?: string;
} {
  // Check for any errors in the last minute
  const recentErrors = metrics.task_error || 0;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (recentErrors > 5) {
    status = 'unhealthy';
  } else if (recentErrors > 0) {
    status = 'degraded';
  }
  
  return {
    status,
    metrics: { ...metrics },
    lastError: ENV.LAST_ERROR
  };
}
