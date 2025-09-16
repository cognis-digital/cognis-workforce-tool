/**
 * Cognis Workforce Tool - Main Entry Point
 * Exports all modules for the workforce system
 */

// Export models
export * from './models';

// Export events system
export * from './events';

// Export storage system
export * from './storage';

// Export agent implementations
export {
  WriterAgent,
  ValidatorAgent,
  FixerAgent,
  OpsAgent
} from './agents';

// Export orchestration system
export * from './orchestrator';

// Export metrics system
export * from './metrics';

// Export GitOps client
export { GitOpsClient } from './gitops';

// Main initialization function
import { initializeWorkforceSystem } from './orchestrator';
export { initializeWorkforceSystem }

/**
 * Initialize the complete Cognis Workforce system
 * This is the main entry point for the system
 */
export async function initializeSystem() {
  try {
    await initializeWorkforceSystem();
    return true;
  } catch (error) {
    console.error('Failed to initialize Cognis Workforce system:', error);
    return false;
  }
}
