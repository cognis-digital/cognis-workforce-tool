/**
 * Storage System for Cognis Workforce Tool
 * Handles persistence of tasks and artifacts
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { Task, Artifact } from './models';

// Storage directory paths
const STORAGE_DIR = path.join(process.cwd(), 'data');
const TASKS_DIR = path.join(STORAGE_DIR, 'tasks');
const ARTIFACTS_DIR = path.join(STORAGE_DIR, 'artifacts');

// Initialize storage
export async function initializeStorage(): Promise<void> {
  try {
    // Ensure storage directories exist
    await fs.mkdir(TASKS_DIR, { recursive: true });
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    console.log('✅ Storage system initialized');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

/**
 * Store a task to persistent storage
 */
export async function storeTask(task: Task): Promise<void> {
  const taskFilePath = path.join(TASKS_DIR, `${task.task_id}.json`);
  
  try {
    await fs.writeFile(
      taskFilePath,
      JSON.stringify(task, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error(`Failed to store task ${task.task_id}:`, error);
    throw error;
  }
}

/**
 * Load a task from persistent storage
 */
export async function loadTask(taskId: string): Promise<Task | null> {
  const taskFilePath = path.join(TASKS_DIR, `${taskId}.json`);
  
  try {
    const taskJson = await fs.readFile(taskFilePath, 'utf-8');
    return JSON.parse(taskJson) as Task;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist
      console.warn(`Task ${taskId} not found`);
      return null;
    }
    
    console.error(`Failed to load task ${taskId}:`, error);
    throw error;
  }
}

/**
 * List all tasks in storage
 */
export async function listTasks(): Promise<{ id: string; objective: string; status: string }[]> {
  try {
    const taskFiles = await fs.readdir(TASKS_DIR);
    
    const taskList = await Promise.all(
      taskFiles
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const taskId = file.replace('.json', '');
          const task = await loadTask(taskId);
          
          return {
            id: taskId,
            objective: task?.objective || 'Unknown',
            status: task?.status || 'unknown'
          };
        })
    );
    
    return taskList;
  } catch (error) {
    console.error('Failed to list tasks:', error);
    return [];
  }
}

/**
 * Store an artifact to persistent storage
 */
export async function storeArtifact(artifact: Artifact): Promise<void> {
  const artifactFilePath = path.join(ARTIFACTS_DIR, `${artifact.artifact_id}.json`);
  
  try {
    await fs.writeFile(
      artifactFilePath,
      JSON.stringify(artifact, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error(`Failed to store artifact ${artifact.artifact_id}:`, error);
    throw error;
  }
}

/**
 * Load an artifact from persistent storage
 */
export async function loadArtifact(artifactId: string): Promise<Artifact | null> {
  const artifactFilePath = path.join(ARTIFACTS_DIR, `${artifactId}.json`);
  
  try {
    const artifactJson = await fs.readFile(artifactFilePath, 'utf-8');
    return JSON.parse(artifactJson) as Artifact;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist
      console.warn(`Artifact ${artifactId} not found`);
      return null;
    }
    
    console.error(`Failed to load artifact ${artifactId}:`, error);
    throw error;
  }
}

/**
 * List artifacts for a specific task
 */
export async function listTaskArtifacts(taskId: string): Promise<Artifact[]> {
  try {
    const artifactFiles = await fs.readdir(ARTIFACTS_DIR);
    const artifacts: Artifact[] = [];
    
    await Promise.all(
      artifactFiles
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const artifactId = file.replace('.json', '');
          const artifact = await loadArtifact(artifactId);
          
          if (artifact && artifact.task_id === taskId) {
            artifacts.push(artifact);
          }
        })
    );
    
    // Sort artifacts by version and creation date
    artifacts.sort((a, b) => {
      if (a.file_path === b.file_path) {
        return b.version - a.version; // Latest version first
      }
      return a.file_path.localeCompare(b.file_path);
    });
    
    return artifacts;
  } catch (error) {
    console.error(`Failed to list artifacts for task ${taskId}:`, error);
    return [];
  }
}

/**
 * Delete a task and its artifacts
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    // Delete task file
    const taskFilePath = path.join(TASKS_DIR, `${taskId}.json`);
    await fs.unlink(taskFilePath);
    
    // Get task artifacts
    const artifacts = await listTaskArtifacts(taskId);
    
    // Delete each artifact file
    await Promise.all(
      artifacts.map(artifact => 
        fs.unlink(path.join(ARTIFACTS_DIR, `${artifact.artifact_id}.json`))
      )
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to delete task ${taskId}:`, error);
    return false;
  }
}

/**
 * Export task data (task and artifacts) as a single JSON object
 * Useful for debugging or data transfer
 */
export async function exportTaskData(taskId: string): Promise<any> {
  try {
    const task = await loadTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const artifacts = await listTaskArtifacts(taskId);
    
    return {
      task,
      artifacts
    };
  } catch (error) {
    console.error(`Failed to export task ${taskId}:`, error);
    throw error;
  }
}
