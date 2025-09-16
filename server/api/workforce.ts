/**
 * Workforce API Router
 * Exposes REST API endpoints for the Cognis Workforce Tool
 */
import express from 'express';
import {
  handleCeoInstruction,
  getTaskStatus,
  listAllTasks,
  handleTaskReview,
  getSystemHealth,
  exportTaskData,
  initializeSystem
} from '../agents/workforce';

const router = express.Router();

// Initialize workforce system on startup
let systemInitialized = false;
const initializeWorkforce = async () => {
  if (!systemInitialized) {
    systemInitialized = await initializeSystem();
    console.log('Workforce system initialized:', systemInitialized ? 'success' : 'failed');
  }
};
initializeWorkforce();

/**
 * @route   POST /api/workforce/tasks
 * @desc    Create a new task from CEO instruction
 * @access  Private
 */
router.post('/tasks', async (req, res) => {
  try {
    const { instruction, meta = {} } = req.body;
    
    if (!instruction) {
      return res.status(400).json({ error: 'Instruction is required' });
    }
    
    // Process the instruction
    const taskId = await handleCeoInstruction(instruction, meta);
    
    res.status(201).json({ taskId, message: 'Task created successfully' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * @route   GET /api/workforce/tasks
 * @desc    Get all tasks
 * @access  Private
 */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await listAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * @route   GET /api/workforce/tasks/:id
 * @desc    Get task status
 * @access  Private
 */
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskStatus = await getTaskStatus(id);
    
    if (!taskStatus.task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(taskStatus);
  } catch (error) {
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * @route   POST /api/workforce/tasks/:id/review
 * @desc    Review a task (approve/reject/request changes)
 * @access  Private
 */
router.post('/tasks/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId, action, comments } = req.body;
    
    if (!reviewerId || !action) {
      return res.status(400).json({ error: 'Reviewer ID and action are required' });
    }
    
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const result = await handleTaskReview(id, reviewerId, action, comments || '');
    
    if (!result) {
      return res.status(404).json({ error: 'Task not found or review failed' });
    }
    
    res.json({ success: true, message: `Task ${action}d successfully` });
  } catch (error) {
    console.error(`Error reviewing task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to review task' });
  }
});

/**
 * @route   GET /api/workforce/tasks/:id/export
 * @desc    Export task data (task + artifacts)
 * @access  Private
 */
router.get('/tasks/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = await exportTaskData(id);
    
    res.json(taskData);
  } catch (error) {
    console.error(`Error exporting task ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to export task data' });
  }
});

/**
 * @route   GET /api/workforce/health
 * @desc    Get system health status
 * @access  Private
 */
router.get('/health', async (req, res) => {
  try {
    const health = getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

export default router;
