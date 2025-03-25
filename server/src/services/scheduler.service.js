const cron = require('node-cron');
const logger = require('../config/logger');
const eventService = require('./event.service');

// Map of scheduled tasks
const scheduledTasks = new Map();

/**
 * Initialize scheduled tasks
 */
const initScheduledTasks = () => {
  // Schedule SSE cleanup task - run every 5 minutes
  scheduleTask('sse-cleanup', '*/5 * * * *', async () => {
    try {
      logger.info('Running scheduled SSE connection cleanup');
      const cleanedCount = eventService.cleanupSSEConnections();
      logger.info(`Cleaned up ${cleanedCount} disconnected SSE clients`);
    } catch (error) {
      logger.error('Error during scheduled SSE cleanup:', error);
    }
  });

  logger.info('Scheduled tasks initialized');
};

/**
 * Schedule a task to run on a cron schedule
 * @param {String} taskId - Unique identifier for the task
 * @param {String} cronExpression - Cron expression for when to run the task
 * @param {Function} taskFn - Function to execute
 * @returns {Boolean} Whether the task was scheduled successfully
 */
const scheduleTask = (taskId, cronExpression, taskFn) => {
  if (scheduledTasks.has(taskId)) {
    logger.warn(`Task with ID ${taskId} already exists, stopping previous task`);
    stopTask(taskId);
  }

  try {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression: ${cronExpression}`);
      return false;
    }

    // Schedule the task
    const task = cron.schedule(cronExpression, taskFn, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'UTC',
    });

    // Save the task reference
    scheduledTasks.set(taskId, {
      id: taskId,
      expression: cronExpression,
      task,
      startedAt: new Date(),
    });

    logger.info(`Task ${taskId} scheduled with expression ${cronExpression}`);
    return true;
  } catch (error) {
    logger.error(`Error scheduling task ${taskId}:`, error);
    return false;
  }
};

/**
 * Stop a scheduled task
 * @param {String} taskId - ID of the task to stop
 * @returns {Boolean} Whether the task was stopped successfully
 */
const stopTask = (taskId) => {
  const taskInfo = scheduledTasks.get(taskId);
  if (!taskInfo) {
    logger.warn(`No task found with ID ${taskId}`);
    return false;
  }

  try {
    // Stop the task
    taskInfo.task.stop();
    scheduledTasks.delete(taskId);
    logger.info(`Task ${taskId} stopped successfully`);
    return true;
  } catch (error) {
    logger.error(`Error stopping task ${taskId}:`, error);
    return false;
  }
};

/**
 * Get information about all scheduled tasks
 * @returns {Array} Array of task information objects
 */
const getScheduledTasks = () => {
  const tasks = [];
  for (const [taskId, taskInfo] of scheduledTasks.entries()) {
    tasks.push({
      id: taskId,
      expression: taskInfo.expression,
      startedAt: taskInfo.startedAt,
    });
  }
  return tasks;
};

module.exports = {
  initScheduledTasks,
  scheduleTask,
  stopTask,
  getScheduledTasks,
}; 