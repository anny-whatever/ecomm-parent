const cron = require("node-cron");
const logger = require("../config/logger");
const eventService = require("./event.service");
const cartService = require("./cart.service");
const inventoryService = require("./inventory.service");
const currencyService = require("./currency.service");
const subscriptionService = require("./subscription.service");

// Map of scheduled tasks
const scheduledTasks = new Map();

/**
 * Initialize scheduled tasks
 */
const initScheduledTasks = () => {
  // Schedule SSE cleanup task - run every 5 minutes
  scheduleTask("sse-cleanup", "*/5 * * * *", async () => {
    try {
      logger.info("Running scheduled SSE connection cleanup");
      const cleanedCount = eventService.cleanupSSEConnections();
      logger.info(`Cleaned up ${cleanedCount} disconnected SSE clients`);
    } catch (error) {
      logger.error("Error during scheduled SSE cleanup:", error);
    }
  });

  // Schedule abandoned cart processing - run every 6 hours
  scheduleTask("abandoned-cart-process", "0 */6 * * *", async () => {
    try {
      logger.info("Running scheduled abandoned cart processing");

      // Process stage 1 reminders - for carts abandoned between 3 and 24 hours ago
      const stage1Stats = await cartService.processAbandonedCarts({
        minAge: 180, // 3 hours in minutes
        maxAge: 24 * 60, // 24 hours in minutes
        minValue: 10, // Minimum cart value to consider
        reminderStage: 1, // Process first reminder
      });

      // Process stage 2 reminders - for carts with stage 1 reminder sent 24+ hours ago
      const stage2Stats = await cartService.processAbandonedCarts({
        minAge: 24 * 60, // 24 hours in minutes
        maxAge: 48 * 60, // 48 hours in minutes
        minValue: 10, // Minimum cart value to consider
        reminderStage: 2, // Process second reminder
      });

      // Process stage 3 reminders - for carts with stage 2 reminder sent 48+ hours ago
      const stage3Stats = await cartService.processAbandonedCarts({
        minAge: 48 * 60, // 48 hours in minutes
        maxAge: 72 * 60, // 72 hours in minutes
        minValue: 10, // Minimum cart value to consider
        reminderStage: 3, // Process final reminder
      });

      // Combined stats
      const totalProcessed =
        stage1Stats.processed + stage2Stats.processed + stage3Stats.processed;
      const totalSkipped =
        stage1Stats.skipped + stage2Stats.skipped + stage3Stats.skipped;
      const totalErrors =
        stage1Stats.errors + stage2Stats.errors + stage3Stats.errors;

      logger.info(
        `Abandoned cart processing complete:\n` +
          `- Stage 1: ${stage1Stats.processed} processed, ${stage1Stats.skipped} skipped\n` +
          `- Stage 2: ${stage2Stats.processed} processed, ${stage2Stats.skipped} skipped\n` +
          `- Stage 3: ${stage3Stats.processed} processed, ${stage3Stats.skipped} skipped\n` +
          `- Total: ${totalProcessed} processed, ${totalSkipped} skipped, ${totalErrors} errors`
      );

      // Fire event for analytics
      await eventService.fireEvent("cart.recovery.process.completed", {
        stats: {
          stage1: stage1Stats,
          stage2: stage2Stats,
          stage3: stage3Stats,
          total: {
            processed: totalProcessed,
            skipped: totalSkipped,
            errors: totalErrors,
          },
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Error during scheduled abandoned cart processing:", error);
    }
  });

  // Schedule expired inventory reservation cleanup - run every hour
  scheduleTask("clear-expired-reservations", "0 * * * *", async () => {
    try {
      logger.info(
        "Running scheduled cleanup of expired inventory reservations"
      );
      const result = await inventoryService.clearExpiredReservations();
      logger.info(`Cleared ${result.cleared} expired inventory reservations`);
    } catch (error) {
      logger.error("Error during expired reservation cleanup:", error);
    }
  });

  // Schedule subscription renewals - run at midnight every day
  scheduleTask("subscription-renewals", "0 0 * * *", async () => {
    try {
      logger.info("Running scheduled subscription renewals");
      const results = await subscriptionService.processAllDueRenewals();
      logger.info(
        `Subscription renewals complete: ${results.successful} successful, ${results.failed} failed out of ${results.total} total`
      );

      // Fire event for analytics
      await eventService.fireEvent("subscription.renewals.processed", {
        results,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Error during scheduled subscription renewals:", error);
    }
  });

  // Schedule currency exchange rate updates - run once a day at 1 AM
  scheduleTask("update-exchange-rates", "0 1 * * *", async () => {
    try {
      logger.info("Running scheduled exchange rate update");

      // Get API key from environment
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;

      if (!apiKey) {
        logger.warn("No exchange rate API key found in environment variables");
        return;
      }

      const result = await currencyService.updateExchangeRates(apiKey);
      logger.info(`Exchange rate update complete: ${result.message}`);

      // Fire event for rate update
      await eventService.fireEvent("currency.rates.updated", {
        updatedCount: result.updatedCount,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Error during exchange rate update:", error);
    }
  });

  logger.info("Scheduled tasks initialized");
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
    logger.warn(
      `Task with ID ${taskId} already exists, stopping previous task`
    );
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
      timezone: process.env.TIMEZONE || "UTC",
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
