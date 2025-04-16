const express = require("express");
const eventController = require("./event.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const eventValidator = require("../../utils/validators/event.validator");

const router = express.Router();

/**
 * @route   GET /api/v1/events
 * @desc    Get events for the current user
 * @access  Private
 */
router.get(
  "/",
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
  "/:eventId",
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
  "/",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(eventValidator.createEvent),
  eventController.createEvent
);

/**
 * @route   POST /api/v1/events/notify/:userId
 * @desc    Send notification to user
 * @access  Private (Admin/Manager)
 */
router.post(
  "/notify/:userId",
  authMiddleware,
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(eventValidator.notifyUser),
  eventController.notifyUser
);

/**
 * @route   POST /api/v1/events/notify/system
 * @desc    Send system notification
 * @access  Private (Admin)
 */
router.post(
  "/notify/system",
  authMiddleware,
  rbacMiddleware(["admin"]),
  validationMiddleware(eventValidator.systemNotification),
  eventController.sendSystemNotification
);

/**
 * @route   GET /api/v1/events/tasks
 * @desc    Get scheduled tasks information
 * @access  Private (Admin)
 */
router.get(
  "/tasks",
  validationMiddleware(eventValidator.getTasksInfo),
  authMiddleware,
  rbacMiddleware(["admin"]),
  eventController.getScheduledTasks
);

module.exports = router;
