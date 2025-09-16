/**
 * Event-driven architecture for the Cognis Workforce Tool
 * Implements event emission and subscription for agent coordination
 */
import { EventEmitter } from 'events';
import { WriterAgent, ValidatorAgent, FixerAgent, OpsAgent } from './agents';

// Event types for strongly-typed event handling
export type WorkforceEvent = 
  | { type: 'task_created'; payload: { task_id: string } }
  | { type: 'subtask_completed'; payload: { task_id: string; subtask_id: string; type: string; result_uri: string } }
  | { type: 'validation_passed'; payload: { task_id: string; artifact_id: string; score: number } }
  | { type: 'validation_failed'; payload: { task_id: string; artifact_id: string; failures: any[] } }
  | { type: 'artifact_fixed'; payload: { task_id: string; artifact_id: string; original_artifact_id: string } }
  | { type: 'pr_created'; payload: { task_id: string; pr_url: string; branch: string } }
  | { type: 'pr_merged'; payload: { task_id: string; pr_url: string } }
  | { type: 'task_completed'; payload: { task_id: string } };

// Global event bus
const eventBus = new EventEmitter();

// Agent instances for workforce coordination
let writerAgent: WriterAgent | null = null;
let validatorAgent: ValidatorAgent | null = null;
let fixerAgent: FixerAgent | null = null;
let opsAgent: OpsAgent | null = null;

/**
 * Initialize the event-driven architecture with agent instances
 */
export function initializeEventSystem() {
  // Initialize agent instances
  writerAgent = new WriterAgent();
  validatorAgent = new ValidatorAgent();
  fixerAgent = new FixerAgent();
  opsAgent = new OpsAgent();
  
  // Subscribe agents to relevant events
  
  // Writer listens for task creation
  eventBus.on('task_created', async (event: WorkforceEvent) => {
    if (event.type === 'task_created' && writerAgent) {
      console.log(`🚀 Writer Agent triggered for task ${event.payload.task_id}`);
      await writerAgent.processTask(event.payload.task_id);
    }
  });
  
  // Validator listens for subtask completion from Writer
  eventBus.on('subtask_completed', async (event: WorkforceEvent) => {
    if (event.type === 'subtask_completed' && event.payload.type === 'generate' && validatorAgent) {
      console.log(`🧐 Validator Agent triggered for task ${event.payload.task_id}`);
      await validatorAgent.processTask(event.payload.task_id);
    }
  });
  
  // Fixer listens for validation failures
  eventBus.on('validation_failed', async (event: WorkforceEvent) => {
    if (event.type === 'validation_failed' && fixerAgent) {
      console.log(`🔧 Fixer Agent triggered for task ${event.payload.task_id}`);
      await fixerAgent.processTask(event.payload.task_id);
    }
  });
  
  // Validator also listens for fixed artifacts
  eventBus.on('artifact_fixed', async (event: WorkforceEvent) => {
    if (event.type === 'artifact_fixed' && validatorAgent) {
      console.log(`🧐 Validator Agent triggered for fixed artifact ${event.payload.artifact_id}`);
      await validatorAgent.processTask(event.payload.task_id);
    }
  });
  
  // Ops agent listens for validation passes
  eventBus.on('validation_passed', async (event: WorkforceEvent) => {
    if (event.type === 'validation_passed' && opsAgent) {
      console.log(`🚢 Ops Agent triggered for task ${event.payload.task_id}`);
      await opsAgent.processTask(event.payload.task_id);
    }
  });
  
  console.log('✅ Event system initialized');
}

/**
 * Emit an event to the event bus
 */
export function emitEvent(eventType: string, payload: any) {
  const event = { type: eventType, payload } as WorkforceEvent;
  console.log(`📣 Emitting event: ${eventType}`, JSON.stringify(payload));
  eventBus.emit(eventType, event);
}

/**
 * Process a new task through the workforce system
 */
export async function processTask(taskId: string) {
  emitEvent('task_created', { task_id: taskId });
}

/**
 * Register webhooks for GitHub events
 */
export function registerGitHubWebhooks(app: any) {
  app.post('/webhooks/github', (req: any, res: any) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    // Handle pull request events
    if (event === 'pull_request') {
      handlePullRequestWebhook(payload);
    }
    
    // Handle check run events for CI status
    if (event === 'check_run') {
      handleCheckRunWebhook(payload);
    }
    
    res.status(200).send('Webhook received');
  });
}

/**
 * Handle GitHub Pull Request webhook events
 */
function handlePullRequestWebhook(payload: any) {
  const action = payload.action;
  const prNumber = payload.pull_request.number;
  const repoName = payload.repository.full_name;
  const prUrl = payload.pull_request.html_url;
  
  // Extract task ID from branch name or PR title
  const branchName = payload.pull_request.head.ref;
  const taskIdMatch = branchName.match(/task-([a-z0-9]+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1] : null;
  
  if (!taskId) {
    console.log(`⚠️ No task ID found in branch name: ${branchName}`);
    return;
  }
  
  // Handle PR merged event
  if (action === 'closed' && payload.pull_request.merged) {
    emitEvent('pr_merged', {
      task_id: taskId,
      pr_url: prUrl
    });
    
    // Mark task as completed
    emitEvent('task_completed', {
      task_id: taskId
    });
  }
}

/**
 * Handle GitHub Check Run webhook events (CI status)
 */
function handleCheckRunWebhook(payload: any) {
  const action = payload.action;
  const status = payload.check_run.status;
  const conclusion = payload.check_run.conclusion;
  const repoName = payload.repository.full_name;
  const branchName = payload.check_run.check_suite.head_branch;
  
  // Extract task ID from branch name
  const taskIdMatch = branchName.match(/task-([a-z0-9]+)/i);
  const taskId = taskIdMatch ? taskIdMatch[1] : null;
  
  if (!taskId) {
    console.log(`⚠️ No task ID found in branch name: ${branchName}`);
    return;
  }
  
  // Handle CI failure
  if (status === 'completed' && conclusion === 'failure') {
    console.log(`❌ CI failed for task ${taskId} on branch ${branchName}`);
    
    // Re-trigger fixer agent for CI failures
    emitEvent('validation_failed', {
      task_id: taskId,
      artifact_id: 'ci_build',
      failures: [
        {
          rule: 'ci_build',
          message: `CI build failed for ${branchName}`
        }
      ]
    });
  }
}
