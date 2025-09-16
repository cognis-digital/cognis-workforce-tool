/**
 * Workforce Agent Implementation
 * Specialized agents for content generation, validation, fixing, and operations
 */
import { createAgent } from '../engine';
import { 
  Task, Subtask, Artifact, createSubtask, createArtifact,
  SubtaskType, TaskStatus, SubtaskStatus 
} from './models';
import { storeTask, loadTask, storeArtifact, loadArtifact } from './storage';
import { GitOpsClient } from './gitops';
import { emitEvent } from './events';

// Base class for all workforce agents
abstract class WorkforceAgent {
  protected role: string;
  protected tools: string[];
  protected systemPrompt: string;
  protected model: string;
  protected temperature: number;

  constructor(
    role: string,
    systemPrompt: string,
    tools: string[] = [],
    model: string = 'cognis-zenith-4',
    temperature: number = 0.7
  ) {
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.model = model;
    this.temperature = temperature;
  }

  getAgentConfig() {
    return createAgent(
      this.role,
      this.systemPrompt,
      this.model,
      this.temperature,
      this.tools
    );
  }

  protected addAuditEntry(task: Task, action: string, details: Record<string, any> = {}) {
    const now = new Date().toISOString();
    task.audit_log.push({
      timestamp: now,
      actor: this.role,
      action,
      details
    });
    task.updated_at = now;
    return task;
  }

  protected async updateSubtaskStatus(task: Task, subtaskId: string, status: SubtaskStatus) {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.status = status;
      subtask.updated_at = new Date().toISOString();
      task.updated_at = new Date().toISOString();
      await storeTask(task);
    }
  }

  // To be implemented by concrete agents
  abstract async processTask(taskId: string): Promise<void>;
}

/**
 * Writer Agent - Generates content based on task objectives
 */
export class WriterAgent extends WorkforceAgent {
  constructor() {
    super(
      'writer',
      `You are the Writer Agent in the Cognis Workforce system. 
Your role is to generate high-quality content based on task objectives.
Follow these guidelines:
1. Analyze the objective carefully to understand the required output
2. Use appropriate templates and formatting for different document types
3. Ensure all content is well-structured, professional, and comprehensive
4. Follow any specified constraints in the task
5. Write in a clear, concise, and engaging manner`,
      ['content_generator', 'markdown_format', 'template_engine']
    );
  }

  async processTask(taskId: string): Promise<void> {
    // Load the task
    const task = await loadTask(taskId);
    if (!task) {
      console.error(`Writer Agent: Task ${taskId} not found`);
      return;
    }

    // Update task status
    task.status = 'in_progress';
    this.addAuditEntry(task, 'processing_started');
    await storeTask(task);

    // Process each deliverable
    for (const deliverable of task.deliverables) {
      // Create subtask for this deliverable
      const subtask = createSubtask(`generate ${deliverable}`, 'generate');
      task.subtasks.push(subtask);
      await storeTask(task);
      
      // Set subtask to in progress
      await this.updateSubtaskStatus(task, subtask.id, 'in_progress');
      
      try {
        // Generate content for the deliverable
        const content = await this.generateContent(task.objective, deliverable, task.constraints);
        
        // Store the generated artifact
        const artifact = createArtifact(taskId, deliverable, content);
        await storeArtifact(artifact);
        
        // Update subtask with result
        const updatedTask = await loadTask(taskId);
        const currentSubtask = updatedTask.subtasks.find(s => s.id === subtask.id);
        if (currentSubtask) {
          currentSubtask.result_uri = artifact.artifact_id;
          currentSubtask.status = 'done';
          currentSubtask.updated_at = new Date().toISOString();
          
          // Update the task
          updatedTask.updated_at = new Date().toISOString();
          this.addAuditEntry(updatedTask, 'content_generated', {
            deliverable,
            artifact_id: artifact.artifact_id
          });
          
          await storeTask(updatedTask);
          
          // Emit event for next steps
          emitEvent('subtask_completed', {
            task_id: taskId,
            subtask_id: subtask.id,
            type: 'generate',
            result_uri: artifact.artifact_id
          });
        }
      } catch (error) {
        console.error(`Writer Agent: Error generating ${deliverable}`, error);
        
        // Mark subtask as failed
        await this.updateSubtaskStatus(task, subtask.id, 'failed');
        
        // Add audit entry
        const updatedTask = await loadTask(taskId);
        this.addAuditEntry(updatedTask, 'generation_failed', {
          deliverable,
          error: error.message || String(error)
        });
        await storeTask(updatedTask);
      }
    }
  }

  private async generateContent(objective: string, deliverable: string, constraints: string[]): Promise<string> {
    // In a real implementation, this would use LLMs or templates to generate content
    // For now, we'll return a simple template-based content
    const format = deliverable.split('.').pop()?.toLowerCase();
    
    switch (format) {
      case 'md':
        return this.generateMarkdownContent(objective, deliverable, constraints);
      case 'docx':
      case 'pptx':
      case 'pdf':
        return this.generateMarkdownContent(objective, deliverable, constraints);
      default:
        return this.generateMarkdownContent(objective, deliverable, constraints);
    }
  }

  private generateMarkdownContent(objective: string, deliverable: string, constraints: string[]): string {
    const title = deliverable.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
    const isAuditReady = constraints.includes('audit-ready');
    const isCompliance = constraints.includes('compliance-check');
    
    let content = `# ${title.charAt(0).toUpperCase() + title.slice(1)}\n\n`;
    content += `## Overview\n\n${objective}\n\n`;
    content += `## Objective\n\nThis document outlines the approach to achieve the following objective: ${objective}\n\n`;
    content += `## Deliverables\n\n- ${deliverable}\n\n`;
    
    if (isAuditReady) {
      content += `## Audit Information\n\n- Generated By: Writer Agent\n- Generation Date: ${new Date().toISOString()}\n- Version: 1.0\n\n`;
    }
    
    if (isCompliance) {
      content += `## Compliance Information\n\n- This document adheres to organizational compliance policies.\n- Security measures have been implemented according to standard protocols.\n- Data handling follows privacy regulations and best practices.\n\n`;
    }
    
    content += `## Assumptions\n\n- The team has necessary expertise to implement the proposed solution.\n- Stakeholders will provide timely feedback.\n- Resources are available to complete the project.\n\n`;
    
    content += `## Security Considerations\n\n- Access controls are implemented as per organizational security policies.\n- Data is encrypted both at rest and in transit.\n- Regular security audits will be conducted.\n\n`;
    
    content += `## Implementation Plan\n\n1. Planning and Requirements Gathering\n2. Design and Architecture\n3. Development and Testing\n4. Deployment and Monitoring\n5. Maintenance and Support\n\n`;
    
    return content;
  }
}

/**
 * Validator Agent - Validates generated content against requirements
 */
export class ValidatorAgent extends WorkforceAgent {
  constructor() {
    super(
      'validator',
      `You are the Validator Agent in the Cognis Workforce system.
Your role is to validate content against requirements and quality standards.
Follow these guidelines:
1. Check content for structural completeness
2. Validate against specified constraints
3. Ensure all required sections are present
4. Check for logical consistency and coherence
5. Verify technical accuracy when applicable`,
      ['content_validator', 'markdown_lint', 'structure_check']
    );
  }

  async processTask(taskId: string): Promise<void> {
    const task = await loadTask(taskId);
    if (!task) {
      console.error(`Validator Agent: Task ${taskId} not found`);
      return;
    }

    // Find completed generate subtasks that need validation
    const generateSubtasks = task.subtasks.filter(
      s => s.type === 'generate' && s.status === 'done' && s.result_uri
    );

    for (const subtask of generateSubtasks) {
      // Check if validation already exists for this subtask
      const existingValidation = task.subtasks.find(
        s => s.type === 'validate' && s.description.includes(subtask.result_uri)
      );

      if (!existingValidation) {
        // Create validation subtask
        const validationSubtask = createSubtask(
          `validate ${subtask.result_uri}`,
          'validate'
        );
        task.subtasks.push(validationSubtask);
        await storeTask(task);

        // Set subtask to in progress
        await this.updateSubtaskStatus(task, validationSubtask.id, 'in_progress');

        try {
          // Load artifact
          const artifact = await loadArtifact(subtask.result_uri);
          if (!artifact) {
            throw new Error(`Artifact not found: ${subtask.result_uri}`);
          }

          // Run validations
          const validationResult = await this.validateArtifact(artifact, task.constraints);

          // Update task with validation results
          const updatedTask = await loadTask(taskId);
          const currentSubtask = updatedTask.subtasks.find(s => s.id === validationSubtask.id);
          
          if (currentSubtask) {
            // Store validation result
            currentSubtask.status = validationResult.passed ? 'done' : 'failed';
            currentSubtask.updated_at = new Date().toISOString();

            this.addAuditEntry(updatedTask, 'content_validated', {
              artifact_id: artifact.artifact_id,
              passed: validationResult.passed,
              score: validationResult.score,
              failures: validationResult.failures
            });

            await storeTask(updatedTask);

            // Emit appropriate event based on validation result
            if (validationResult.passed) {
              emitEvent('validation_passed', {
                task_id: taskId,
                artifact_id: artifact.artifact_id,
                score: validationResult.score
              });
            } else {
              emitEvent('validation_failed', {
                task_id: taskId,
                artifact_id: artifact.artifact_id,
                failures: validationResult.failures
              });
            }
          }
        } catch (error) {
          console.error(`Validator Agent: Error validating ${subtask.result_uri}`, error);
          
          // Mark validation subtask as failed
          await this.updateSubtaskStatus(task, validationSubtask.id, 'failed');
          
          const updatedTask = await loadTask(taskId);
          this.addAuditEntry(updatedTask, 'validation_error', {
            artifact_uri: subtask.result_uri,
            error: error.message || String(error)
          });
          await storeTask(updatedTask);
        }
      }
    }
  }

  private async validateArtifact(artifact: Artifact, constraints: string[]): Promise<{
    passed: boolean;
    score: number;
    failures: Array<{ rule: string; message: string }>;
  }> {
    const failures: Array<{ rule: string; message: string }> = [];
    let score = 1.0; // Start with perfect score

    // Check content based on format
    const format = artifact.format.toLowerCase();

    // 1. Check if content is not empty
    if (!artifact.content || artifact.content.trim() === '') {
      failures.push({
        rule: 'content_presence',
        message: 'Content is empty'
      });
      score -= 0.5;
    }

    // 2. For Markdown, check required sections
    if (format === 'md') {
      const requiredSections = ['Overview', 'Objective', 'Deliverables'];
      
      // Add sections based on constraints
      if (constraints.includes('audit-ready')) {
        requiredSections.push('Audit Information');
      }
      if (constraints.includes('compliance-check')) {
        requiredSections.push('Compliance Information');
      }

      // Always require Assumptions and Security sections
      requiredSections.push('Assumptions', 'Security');

      // Check each required section
      for (const section of requiredSections) {
        const sectionRegex = new RegExp(`##\\s*${section}\\b`, 'i');
        if (!sectionRegex.test(artifact.content)) {
          failures.push({
            rule: 'required_section',
            message: `Missing required section: ${section}`
          });
          score -= 0.1;
        }
      }
    }

    // 3. Check basic structure (e.g., has title/header)
    if (format === 'md' && !artifact.content.startsWith('# ')) {
      failures.push({
        rule: 'document_structure',
        message: 'Document must start with a level 1 heading (title)'
      });
      score -= 0.1;
    }

    // 4. Ensure minimum content length
    if (artifact.content.length < 500) {
      failures.push({
        rule: 'content_length',
        message: 'Content is too short (minimum 500 characters)'
      });
      score -= 0.2;
    }

    // Normalize score to be between 0 and 1
    score = Math.max(0, Math.min(1, score));
    
    // Pass if score is at least 0.8 (80%)
    const passed = score >= 0.8 && failures.length <= 2;
    
    return {
      passed,
      score,
      failures
    };
  }
}

/**
 * Fixer Agent - Fixes content issues identified by validator
 */
export class FixerAgent extends WorkforceAgent {
  constructor() {
    super(
      'fixer',
      `You are the Fixer Agent in the Cognis Workforce system.
Your role is to fix content issues identified during validation.
Follow these guidelines:
1. Address all validation failures systematically
2. Maintain the original content's intent and structure
3. Add missing sections or information as required
4. Ensure fixes adhere to all specified constraints
5. Preserve formatting and style consistency`,
      ['content_fixer', 'markdown_editor', 'template_injector']
    );
  }

  async processTask(taskId: string): Promise<void> {
    const task = await loadTask(taskId);
    if (!task) {
      console.error(`Fixer Agent: Task ${taskId} not found`);
      return;
    }

    // Check if task has reached max attempts
    if (task.attempts >= 3) {
      console.warn(`Fixer Agent: Task ${taskId} has reached maximum attempts`);
      
      // Update task status to blocked
      task.status = 'blocked';
      this.addAuditEntry(task, 'max_attempts_reached', {
        attempts: task.attempts
      });
      await storeTask(task);
      return;
    }

    // Find failed validations
    const failedValidations = task.subtasks.filter(
      s => s.type === 'validate' && s.status === 'failed'
    );

    for (const validation of failedValidations) {
      // Extract artifact ID from validation description
      const artifactIdMatch = validation.description.match(/validate\s+(.+)/);
      if (!artifactIdMatch) continue;

      const artifactId = artifactIdMatch[1];

      // Create fix subtask
      const fixSubtask = createSubtask(`fix ${artifactId}`, 'fix');
      task.subtasks.push(fixSubtask);
      await storeTask(task);

      // Set subtask to in progress
      await this.updateSubtaskStatus(task, fixSubtask.id, 'in_progress');

      try {
        // Load artifact
        const artifact = await loadArtifact(artifactId);
        if (!artifact) {
          throw new Error(`Artifact not found: ${artifactId}`);
        }

        // Increment task attempts
        task.attempts += 1;
        await storeTask(task);

        // Find validation failures from audit log
        const validationEntry = task.audit_log.find(
          entry => entry.action === 'content_validated' && 
                   entry.details?.artifact_id === artifactId && 
                   !entry.details?.passed
        );

        const failures = validationEntry?.details?.failures || [];

        // Fix content based on failures
        const fixedContent = await this.fixContent(artifact.content, failures, task.constraints);

        // Create new artifact version
        const newArtifact = createArtifact(
          task.task_id, 
          artifact.file_path, 
          fixedContent, 
          artifact.version + 1
        );
        await storeArtifact(newArtifact);

        // Update fix subtask
        const updatedTask = await loadTask(taskId);
        const currentSubtask = updatedTask.subtasks.find(s => s.id === fixSubtask.id);
        
        if (currentSubtask) {
          currentSubtask.result_uri = newArtifact.artifact_id;
          currentSubtask.status = 'done';
          currentSubtask.updated_at = new Date().toISOString();

          this.addAuditEntry(updatedTask, 'content_fixed', {
            original_artifact_id: artifactId,
            new_artifact_id: newArtifact.artifact_id,
            fixes_applied: failures.map(f => f.rule)
          });

          await storeTask(updatedTask);

          // Emit event for next steps
          emitEvent('artifact_fixed', {
            task_id: taskId,
            artifact_id: newArtifact.artifact_id,
            original_artifact_id: artifactId
          });
        }
      } catch (error) {
        console.error(`Fixer Agent: Error fixing artifact`, error);
        
        // Mark fix subtask as failed
        await this.updateSubtaskStatus(task, fixSubtask.id, 'failed');
        
        const updatedTask = await loadTask(taskId);
        this.addAuditEntry(updatedTask, 'fix_failed', {
          artifact_id: artifactId,
          error: error.message || String(error)
        });
        await storeTask(updatedTask);
      }
    }
  }

  private async fixContent(
    content: string,
    failures: Array<{ rule: string; message: string }>,
    constraints: string[]
  ): Promise<string> {
    let fixedContent = content;

    // Apply fixes based on failure rules
    for (const failure of failures) {
      switch (failure.rule) {
        case 'required_section':
          // Extract section name from message
          const sectionMatch = failure.message.match(/Missing required section: (.+)/);
          if (sectionMatch) {
            const section = sectionMatch[1];
            fixedContent = this.addMissingSection(fixedContent, section, constraints);
          }
          break;
          
        case 'document_structure':
          if (!fixedContent.startsWith('# ')) {
            // Extract filename from content or use "Document" as fallback
            const titleMatch = fixedContent.match(/^(#{1,6})\s+(.+)/m);
            const title = titleMatch ? titleMatch[2] : "Document";
            fixedContent = `# ${title}\n\n${fixedContent.replace(/^#{1,6}\s+.+\n/, '')}`;
          }
          break;
          
        case 'content_length':
          fixedContent = this.expandContent(fixedContent);
          break;
      }
    }

    return fixedContent;
  }

  private addMissingSection(content: string, section: string, constraints: string[]): string {
    // Add section at the appropriate position
    let sectionContent = '';
    
    switch (section) {
      case 'Overview':
        sectionContent = `## Overview\n\nThis document provides an overview of the project and its objectives.\n\n`;
        break;
        
      case 'Objective':
        sectionContent = `## Objective\n\nThe main objective of this project is to deliver a comprehensive solution that meets all requirements.\n\n`;
        break;
        
      case 'Deliverables':
        sectionContent = `## Deliverables\n\n- Documentation\n- Source code\n- Implementation plan\n\n`;
        break;
        
      case 'Audit Information':
        sectionContent = `## Audit Information\n\n- Generated By: Cognis Workforce System\n- Generation Date: ${new Date().toISOString()}\n- Version: 1.0\n- Last Modified: ${new Date().toISOString()}\n\n`;
        break;
        
      case 'Compliance Information':
        sectionContent = `## Compliance Information\n\n- This document adheres to organizational compliance policies.\n- Security measures have been implemented according to standard protocols.\n- Data handling follows privacy regulations and best practices.\n\n`;
        break;
        
      case 'Assumptions':
        sectionContent = `## Assumptions\n\n- The team has necessary expertise to implement the proposed solution.\n- Stakeholders will provide timely feedback.\n- Resources are available to complete the project.\n\n`;
        break;
        
      case 'Security':
      case 'Security Considerations':
        sectionContent = `## Security Considerations\n\n- Access controls are implemented as per organizational security policies.\n- Data is encrypted both at rest and in transit.\n- Regular security audits will be conducted.\n\n`;
        break;
        
      default:
        sectionContent = `## ${section}\n\nThis section provides information about ${section.toLowerCase()}.\n\n`;
    }
    
    // Find appropriate position to insert the section
    // Typically after the last ## heading or at the end if none found
    const headings = [...content.matchAll(/^(#{2})\s+(.+)$/gm)];
    
    if (headings.length > 0) {
      const lastHeading = headings[headings.length - 1];
      const lastHeadingPos = lastHeading.index;
      
      // Find the start of the next section or the end of content
      let nextSectionPos = content.length;
      for (let i = lastHeadingPos + 1; i < content.length; i++) {
        if (content.substring(i).match(/^#{2}\s+/m)) {
          nextSectionPos = i;
          break;
        }
      }
      
      // Insert the new section after the last section
      return content.substring(0, nextSectionPos) + sectionContent + content.substring(nextSectionPos);
    } else {
      // No headings found, add to the end
      return content + '\n\n' + sectionContent;
    }
  }

  private expandContent(content: string): string {
    // For demo purposes, just add some generic content
    // In a real implementation, this would use LLM to expand content intelligently
    return content + '\n\n## Additional Information\n\nThis section provides additional context and details to enhance the document\'s comprehensiveness. The information contained herein serves to elaborate on the core concepts introduced earlier and provide a more complete understanding of the subject matter.\n\nAdditional considerations include:\n\n- Long-term maintenance plans\n- Scaling strategies\n- Future enhancements\n- Team resource allocation\n- Timeline projections\n\n';
  }
}

/**
 * Ops Agent - Handles GitHub operations (commits, PRs, etc.)
 */
export class OpsAgent extends WorkforceAgent {
  private gitClient: GitOpsClient;

  constructor() {
    super(
      'ops',
      `You are the Ops Agent in the Cognis Workforce system.
Your role is to manage operational aspects such as Git operations and deployments.
Follow these guidelines:
1. Create and manage Git branches
2. Commit content to repositories
3. Create and handle pull requests
4. Monitor CI/CD pipeline status
5. Ensure successful deployment`,
      ['git_operations', 'ci_monitor']
    );
    
    this.gitClient = new GitOpsClient();
  }

  async processTask(taskId: string): Promise<void> {
    const task = await loadTask(taskId);
    if (!task) {
      console.error(`Ops Agent: Task ${taskId} not found`);
      return;
    }

    // Check for validated content or fixed content that passed validation
    const validatedArtifacts = await this.findValidatedArtifacts(task);
    
    if (validatedArtifacts.length === 0) {
      console.log(`Ops Agent: No validated artifacts found for task ${taskId}`);
      return;
    }

    // Create push subtask
    const pushSubtask = createSubtask(`push to ${task.repo_target}`, 'push');
    task.subtasks.push(pushSubtask);
    await storeTask(task);

    // Set subtask to in progress
    await this.updateSubtaskStatus(task, pushSubtask.id, 'in_progress');

    try {
      // Create branch name
      const branchName = `feature/task-${task.task_id.substring(0, 8)}`;
      
      // Initialize repository operations
      await this.gitClient.checkout(task.repo_target, 'main');
      await this.gitClient.createBranch(branchName);
      
      // Write files for each validated artifact
      for (const artifactId of validatedArtifacts) {
        const artifact = await loadArtifact(artifactId);
        if (!artifact) continue;
        
        // Determine file path in repo
        const filePath = `${task.repo_path}/${artifact.file_path}`;
        
        // Write file to repo
        await this.gitClient.writeFile(branchName, filePath, artifact.content);
      }
      
      // Commit changes
      const commitMessage = `Add deliverables for task ${task.task_id}`;
      const commitHash = await this.gitClient.commit(branchName, commitMessage);
      
      // Push branch
      await this.gitClient.push(branchName);
      
      // Create PR
      const prTitle = `Deliverables: ${task.objective.substring(0, 50)}...`;
      const prBody = `This PR contains deliverables for task ${task.task_id}\n\n${task.objective}`;
      const prUrl = await this.gitClient.createPR(task.repo_target, branchName, 'main', prTitle, prBody);
      
      // Update task
      const updatedTask = await loadTask(taskId);
      const currentSubtask = updatedTask.subtasks.find(s => s.id === pushSubtask.id);
      
      if (currentSubtask) {
        currentSubtask.result_uri = prUrl;
        currentSubtask.status = 'done';
        currentSubtask.updated_at = new Date().toISOString();
        
        // Update task status
        updatedTask.status = 'review';
        
        this.addAuditEntry(updatedTask, 'pr_created', {
          branch: branchName,
          commit_hash: commitHash,
          pr_url: prUrl,
          artifacts: validatedArtifacts
        });
        
        await storeTask(updatedTask);
        
        // Emit event for next steps
        emitEvent('pr_created', {
          task_id: taskId,
          pr_url: prUrl,
          branch: branchName
        });
      }
    } catch (error) {
      console.error(`Ops Agent: Error in GitHub operations`, error);
      
      // Mark push subtask as failed
      await this.updateSubtaskStatus(task, pushSubtask.id, 'failed');
      
      const updatedTask = await loadTask(taskId);
      this.addAuditEntry(updatedTask, 'push_failed', {
        error: error.message || String(error)
      });
      await storeTask(updatedTask);
    }
  }

  private async findValidatedArtifacts(task: Task): Promise<string[]> {
    const validatedArtifactIds = new Set<string>();
    
    // Find all validation subtasks that succeeded
    const successfulValidations = task.subtasks.filter(
      s => s.type === 'validate' && s.status === 'done'
    );
    
    // Extract artifact IDs from validation descriptions
    for (const validation of successfulValidations) {
      const artifactIdMatch = validation.description.match(/validate\s+(.+)/);
      if (artifactIdMatch) {
        validatedArtifactIds.add(artifactIdMatch[1]);
      }
    }
    
    // Also include fixed artifacts that have passed validation
    const fixedArtifacts = task.subtasks.filter(
      s => s.type === 'fix' && s.status === 'done' && s.result_uri
    );
    
    for (const fix of fixedArtifacts) {
      // Check if there's a successful validation for this fixed artifact
      const hasValidation = task.subtasks.some(
        s => s.type === 'validate' && s.status === 'done' && 
             s.description.includes(fix.result_uri)
      );
      
      if (hasValidation && fix.result_uri) {
        validatedArtifactIds.add(fix.result_uri);
      }
    }
    
    return Array.from(validatedArtifactIds);
  }
}
