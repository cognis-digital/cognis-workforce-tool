/**
 * Workforce Models
 * Implements the data models for the Cognis Workforce Tool blueprint
 */
import { v4 as uuidv4 } from 'uuid';

// Task status types
export type TaskStatus = 'pending' | 'queued' | 'in_progress' | 'blocked' | 'review' | 'done' | 'failed';

// Subtask status types
export type SubtaskStatus = 'pending' | 'in_progress' | 'done' | 'failed';

// Subtask types
export type SubtaskType = 'generate' | 'validate' | 'fix' | 'package' | 'push' | 'review';

// Task priority types
export type TaskPriority = 'high' | 'medium' | 'low';

/**
 * Audit entry to track changes to tasks
 */
export interface AuditEntry {
  timestamp: string; // ISO timestamp
  actor: string;     // agent name or user id
  action: string;    // action performed
  details: Record<string, any>; // additional details
}

/**
 * Subtask model
 */
export interface Subtask {
  id: string;
  description: string;
  type: SubtaskType;
  status: SubtaskStatus;
  result_uri: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Task model
 */
export interface Task {
  task_id: string;
  role: string; // CEO, CTO, PM, etc.
  objective: string; // Natural language description
  deliverables: string[]; // e.g. ["SOW.md", "SOW.docx"]
  constraints: string[]; // e.g. ["audit-ready", "self-correcting"]
  repo_target: string; // git repo path
  repo_path: string; // path inside repo
  deadline: string | null; // ISO date
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: Subtask[];
  attempts: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  audit_log: AuditEntry[];
}

/**
 * Artifact model for storing generated content
 */
export interface Artifact {
  artifact_id: string;
  task_id: string;
  file_path: string;
  content_hash: string;
  format: string; // md, docx, pdf, zip
  content: string; // The actual content of the artifact
  version: number;
  created_at: string; // ISO timestamp
}

/**
 * Factory function to create a new Task
 */
export function createTask(
  objective: string,
  role: string = 'CEO',
  meta: Record<string, any> = {}
): Task {
  const now = new Date().toISOString();
  
  return {
    task_id: uuidv4(),
    role,
    objective,
    deliverables: meta.deliverables || extractDeliverables(objective),
    constraints: meta.constraints || extractConstraints(objective),
    repo_target: meta.repo_target || 'cognis-digital/cognis-workforce-tool',
    repo_path: meta.repo_path || generateRepoPath(objective),
    deadline: meta.deadline || null,
    priority: inferPriority(objective),
    status: 'pending',
    subtasks: [],
    attempts: 0,
    created_at: now,
    updated_at: now,
    audit_log: [
      {
        timestamp: now,
        actor: role,
        action: 'created',
        details: { text: objective }
      }
    ]
  };
}

/**
 * Factory function to create a new Subtask
 */
export function createSubtask(
  description: string,
  type: SubtaskType
): Subtask {
  const now = new Date().toISOString();
  
  return {
    id: uuidv4(),
    description,
    type,
    status: 'pending',
    result_uri: null,
    created_at: now,
    updated_at: now
  };
}

/**
 * Factory function to create a new Artifact
 */
export function createArtifact(
  task_id: string,
  file_path: string,
  content: string,
  version: number = 1
): Artifact {
  return {
    artifact_id: uuidv4(),
    task_id,
    file_path,
    content,
    content_hash: generateContentHash(content),
    format: getFileFormat(file_path),
    version,
    created_at: new Date().toISOString()
  };
}

/**
 * Helper function to extract deliverables from text
 */
function extractDeliverables(text: string): string[] {
  const outputs: string[] = [];
  
  if (/SOW|statement of work/i.test(text)) outputs.push('SOW.md');
  if (/deck|slides|pitch/i.test(text)) outputs.push('deck.pptx');
  if (/report/i.test(text)) outputs.push('report.pdf');
  if (outputs.length === 0) outputs.push('document.md');
  
  return outputs;
}

/**
 * Helper function to extract constraints from text
 */
function extractConstraints(text: string): string[] {
  const constraints: string[] = [];
  
  if (/audit/i.test(text)) constraints.push('audit-ready');
  if (/validate|self-correct/i.test(text)) constraints.push('self-correcting');
  if (/gov|compliance/i.test(text)) constraints.push('compliance-check');
  
  return constraints;
}

/**
 * Helper function to infer priority from text
 */
function inferPriority(text: string): TaskPriority {
  if (/urgent|ASAP|immediately|critical/i.test(text)) return 'high';
  if (/soon|important/i.test(text)) return 'medium';
  return 'low';
}

/**
 * Helper function to generate repo path from objective
 */
function generateRepoPath(objective: string): string {
  // Create a sanitized slug from the first 5 words of the objective
  const slug = objective
    .split(/\s+/)
    .slice(0, 5)
    .join('-')
    .toLowerCase()
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');
    
  // Generate ISO date string for today (YYYYMMDD)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  return `docs/${date}-${slug}`;
}

/**
 * Helper function to generate content hash
 */
function generateContentHash(content: string): string {
  // Simple hash function for demo purposes
  // In production, use a proper cryptographic hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Helper function to get file format from path
 */
function getFileFormat(path: string): string {
  return path.split('.').pop() || 'txt';
}
