const Joi = require("joi");

// Get events schema
const getEvents = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().optional(),
    read: Joi.boolean().optional(),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().optional(),
  }),
});

// Get event by ID schema
const getById = Joi.object({
  params: Joi.object({
    eventId: Joi.string().required(),
  }),
});

// Create event schema
const createEvent = Joi.object({
  body: Joi.object({
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    targetUser: Joi.string().optional(),
    targetUserGroup: Joi.string().optional(),
    metadata: Joi.object().optional(),
    priority: Joi.string().valid("low", "normal", "high").default("normal"),
  }),
});

// Notify user schema
const notifyUser = Joi.object({
  params: Joi.object({
    userId: Joi.string().required(),
  }),
  body: Joi.object({
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    metadata: Joi.object().optional(),
    priority: Joi.string().valid("low", "normal", "high").default("normal"),
  }),
});

// System notification schema
const systemNotification = Joi.object({
  body: Joi.object({
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    userGroup: Joi.string().optional(),
    metadata: Joi.object().optional(),
    priority: Joi.string().valid("low", "normal", "high").default("normal"),
  }),
});

// Get tasks info schema
const getTasksInfo = Joi.object({
  query: Joi.object({
    format: Joi.string().valid("simple", "detailed").default("simple"),
  }),
});

module.exports = {
  getEvents,
  getById,
  createEvent,
  notifyUser,
  systemNotification,
  getTasksInfo,
};
