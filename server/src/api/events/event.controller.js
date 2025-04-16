const eventService = require("../../services/event.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");
const schedulerService = require("../../services/scheduler.service");

/**
 * Create new event
 * @route POST /api/v1/events
 * @access Private (Admin/Manager)
 */
const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body);

    return res.status(201).json(
      responseFormatter(true, "Event created successfully", {
        event,
      })
    );
  } catch (error) {
    logger.error("Error creating event:", error);
    next(error);
  }
};

/**
 * Get events for current user
 * @route GET /api/v1/events
 * @access Private
 */
const getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, types } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const parsedTypes = types ? types.split(",") : [];

    const options = {
      skip,
      limit: parseInt(limit, 10),
      types: parsedTypes,
    };

    const events = await eventService.getEventsForUser(req.user._id, options);

    // Get total count for pagination
    const total = await (async () => {
      try {
        const Event = require("../../models/event.model");
        return await Event.countDocuments({
          recipients: req.user._id,
          ...(parsedTypes.length > 0 ? { type: { $in: parsedTypes } } : {}),
        });
      } catch (err) {
        logger.error("Error counting events:", err);
        return 0;
      }
    })();

    return res.status(200).json(
      responseFormatter(true, "Events retrieved successfully", {
        events,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      })
    );
  } catch (error) {
    logger.error("Error getting events:", error);
    next(error);
  }
};

/**
 * Get event by ID
 * @route GET /api/v1/events/:eventId
 * @access Private
 */
const getEventById = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Get the Event model directly
    const Event = require("../../models/event.model");
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json(responseFormatter(false, "Event not found"));
    }

    // Check if user has access to this event
    const isRecipient =
      event.recipients &&
      event.recipients.some(
        (recipient) => recipient.toString() === req.user._id.toString()
      );

    const hasRole = event.roles && event.roles.includes(req.user.role);

    if (
      !event.isPublic &&
      !isRecipient &&
      !hasRole &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json(responseFormatter(false, "You do not have access to this event"));
    }

    return res.status(200).json(
      responseFormatter(true, "Event retrieved successfully", {
        event,
      })
    );
  } catch (error) {
    logger.error(`Error getting event ${req.params.eventId}:`, error);
    next(error);
  }
};

/**
 * Send notification to user
 * @route POST /api/v1/events/notify/:userId
 * @access Private (Admin/Manager)
 */
const notifyUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { message, data } = req.body;

    const event = await eventService.createUserNotification(
      userId,
      message,
      data
    );

    return res.status(200).json(
      responseFormatter(true, "Notification sent successfully", {
        event,
      })
    );
  } catch (error) {
    logger.error(
      `Error sending notification to user ${req.params.userId}:`,
      error
    );
    next(error);
  }
};

/**
 * Send system notification
 * @route POST /api/v1/events/notify/system
 * @access Private (Admin)
 */
const sendSystemNotification = async (req, res, next) => {
  try {
    const { message, data, roles } = req.body;

    const event = await eventService.createSystemNotification(
      message,
      data,
      roles
    );

    return res.status(200).json(
      responseFormatter(true, "System notification sent successfully", {
        event,
      })
    );
  } catch (error) {
    logger.error("Error sending system notification:", error);
    next(error);
  }
};

/**
 * Get information about scheduled tasks
 * @route GET /api/v1/events/tasks
 * @access Private (Admin)
 */
const getScheduledTasks = async (req, res, next) => {
  try {
    const tasks = schedulerService.getScheduledTasks();

    return res.status(200).json(
      responseFormatter(true, "Scheduled tasks retrieved successfully", {
        tasks,
      })
    );
  } catch (error) {
    logger.error("Error getting scheduled tasks:", error);
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  notifyUser,
  sendSystemNotification,
  getScheduledTasks,
};
