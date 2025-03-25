const express = require('express');
const eventController = require('./event.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');
const rbacMiddleware = require('../../middleware/rbac.middleware');
const validationMiddleware = require('../../middleware/validation.middleware');
const eventValidator = require('../../utils/validators/event.validator');

const router = express.Router();

// Optional auth middleware for SSE connections from non-logged in users
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
};

/**
 * @route   GET /api/v1/events/subscribe
 * @desc    Subscribe to server-sent events
 * @access  Public (with optional auth)
 */
router.get(
  '/subscribe',
  optionalAuth,
  validationMiddleware(eventValidator.subscribeToEvents),
  eventController.subscribeToEvents
);

/**
 * @route   GET /api/v1/events
 * @desc    Get events for the current user
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  validationMiddleware(eventValidator.getEvents),
  eventController.getEvents
);

/**
 * @route   GET /api/v1/events/:eventId
 * @desc    Get event by ID
 * @access  Private
 */
router.get(
  '/:eventId',
  authMiddleware,
  validationMiddleware(eventValidator.getById),
  eventController.getEventById
);

/**
 * @route   POST /api/v1/events
 * @desc    Create new event
 * @access  Private (Admin/Manager)
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  validationMiddleware(eventValidator.createEvent),
  eventController.createEvent
);

/**
 * @route   POST /api/v1/events/notify/:userId
 * @desc    Send notification to user
 * @access  Private (Admin/Manager)
 */
router.post(
  '/notify/:userId',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  validationMiddleware(eventValidator.notifyUser),
  eventController.notifyUser
);

/**
 * @route   POST /api/v1/events/notify/system
 * @desc    Send system notification
 * @access  Private (Admin)
 */
router.post(
  '/notify/system',
  authMiddleware,
  rbacMiddleware(['admin']),
  validationMiddleware(eventValidator.systemNotification),
  eventController.sendSystemNotification
);

/**
 * @route   GET /api/v1/events/stats
 * @desc    Get SSE connection statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authMiddleware,
  rbacMiddleware(['admin']),
  eventController.getConnectionStats
);

/**
 * @route   POST /api/v1/events/cleanup
 * @desc    Clean up disconnected SSE clients
 * @access  Private (Admin)
 */
router.post(
  '/cleanup',
  authMiddleware,
  rbacMiddleware(['admin']),
  eventController.cleanupConnections
);

/**
 * @route   GET /api/v1/events/tasks
 * @desc    Get scheduled tasks information
 * @access  Private (Admin)
 */
router.get(
  '/tasks',
  validationMiddleware(eventValidator.getTasksInfo),
  authMiddleware,
  rbacMiddleware(['admin']),
  eventController.getScheduledTasks
);

/**
 * @route   POST /api/v1/events/cleanup/manual
 * @desc    Manually cleanup old connections
 * @access  Private (Admin)
 */
router.post(
  '/cleanup/manual',
  authMiddleware,
  rbacMiddleware(['admin']),
  eventController.manualCleanup
);

module.exports = router; 