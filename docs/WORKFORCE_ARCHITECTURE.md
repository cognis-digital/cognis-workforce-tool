# Cognis Workforce Architecture

This document outlines the architecture and implementation details of the Cognis Workforce Tool - a comprehensive AI agent-based system for automated content generation, validation, and deployment.

## 🏗️ Architecture Overview

The Cognis Workforce Tool implements an event-driven, agent-based architecture for automating document generation and delivery. The system consists of:

- **CEO Agent**: Parses natural language instructions into structured tasks
- **Writer Agent**: Generates content based on task specifications
- **Validator Agent**: Validates content against requirements
- **Fixer Agent**: Automatically fixes issues identified in validation
- **Ops Agent**: Handles GitHub operations (commits, PRs, CI integration)

![Workforce Architecture](../src/assets/workforce-architecture.png)

## 🧩 Key Components

### 1. Task Management

Tasks are the core operational unit representing work to be done:

```typescript
interface Task {
  task_id: string;
  role: string;             // CEO, CTO, PM, etc.
  objective: string;        // Natural language description
  deliverables: string[];   // e.g. ["SOW.md", "SOW.docx"]
  constraints: string[];    // e.g. ["audit-ready", "self-correcting"]
  repo_target: string;      // git repo path
  repo_path: string;        // path inside repo
  status: TaskStatus;
  subtasks: Subtask[];
  audit_log: AuditEntry[];
  // ...other fields
}
```

### 2. Event-Driven Coordination

Agents communicate and coordinate through events:

- `task_created`: Triggers the Writer Agent
- `subtask_completed`: Triggers validation for generated content
- `validation_failed`: Triggers the Fixer Agent
- `validation_passed`: Triggers the Ops Agent for GitHub operations
- `pr_created`: Notifies reviewers
- `pr_merged`: Marks task as completed

### 3. Self-Correction Loop

The system implements a self-correction loop:

1. Writer generates content
2. Validator checks against requirements
3. If validation fails, Fixer resolves issues
4. Repeat until validation passes or max attempts reached

### 4. GitHub Integration

The Ops Agent handles all GitHub operations:

- Creates feature branches for tasks
- Commits generated content
- Opens pull requests
- Monitors CI/CD pipeline status

## 🛠️ Implementation Components

### Data Models

- `Task`: Represents the main work unit
- `Subtask`: Individual steps within a task
- `Artifact`: Generated content (documents, code)
- `AuditEntry`: Records system actions for traceability

### Agent Implementation

Each agent extends the `WorkforceAgent` base class:

```typescript
abstract class WorkforceAgent {
  protected role: string;
  protected tools: string[];
  protected systemPrompt: string;
  // ...other fields

  abstract async processTask(taskId: string): Promise<void>;
}
```

### Storage System

Persistent storage for tasks and artifacts:

- File-based storage with JSON serialization
- Immutable audit trail of all system actions
- Version control for artifacts

### Metrics & Monitoring

Comprehensive metrics tracking:

- Task completion rates
- Validation success rates
- Average completion times
- Content generation metrics

## 🔄 Workflow Example

1. CEO instructs: "Create a Statement of Work for Project X, make it audit-ready"
2. Instruction parsed into `Task` with deliverables and constraints
3. Writer Agent generates SOW.md document
4. Validator checks document structure and audit requirements
5. If validation fails, Fixer adds missing sections
6. Ops Agent commits to GitHub and creates PR
7. CI validates the document
8. Human reviewer approves
9. Task marked as completed

## 🚀 Getting Started

To use the Cognis Workforce Tool:

```typescript
// Initialize the system
import { initializeSystem, handleCeoInstruction } from './server/agents/workforce';

// Start the system
await initializeSystem();

// Process a CEO instruction
const taskId = await handleCeoInstruction(
  "Create a SOW for Project X, make it audit-ready",
  { priority: "high" }
);

// Check task status
const status = await getTaskStatus(taskId);
```

## 🔧 Configuration

The system can be configured through environment variables:

- `GITHUB_TOKEN`: GitHub personal access token
- `MAX_ATTEMPTS`: Maximum self-correction attempts (default: 3)
- `MODEL_ID`: AI model to use (default: 'cognis-zenith-4')

## 📊 Metrics Dashboard

The system provides real-time metrics through the `/api/metrics` endpoint:

- Task completion rates
- Content generation statistics
- Validation success rates
- Performance metrics (average times)

## 🔒 Security Considerations

- GitHub tokens stored securely in environment variables
- Audit trail for all system actions
- Content validation for sensitive information

## 🧪 Testing

The system includes comprehensive tests:

- Unit tests for each agent
- Integration tests for the full workflow
- Mock GitHub operations for testing

## 🚧 Future Enhancements

- Advanced validation rules for industry-specific requirements
- Support for more content formats (code, presentations)
- Integration with project management tools
- AI-powered content quality scoring

## 📝 License

This project is licensed under the MIT License.
