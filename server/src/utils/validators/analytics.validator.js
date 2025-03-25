const Joi = require("joi");

// Base time range schema for reuse
const timeRangeSchema = Joi.object({
  timeRange: Joi.string().valid(
    "day", 
    "week", 
    "month", 
    "quarter", 
    "year", 
    "last_7_days", 
    "last_30_days", 
    "last_90_days", 
    "current_month",
    "previous_month",
    "current_quarter",
    "current_year",
    "custom"
  ),
  startDate: Joi.date().iso().when("timeRange", {
    is: "custom",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).when("timeRange", {
    is: "custom",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// Dashboard metrics validation schema
const getDashboardMetrics = Joi.object({
  query: timeRangeSchema.keys({
    timeRange: Joi.string().valid(
      "day", 
      "week", 
      "month", 
      "quarter", 
      "year",
      "last_7_days", 
      "last_30_days",
      "custom"
    ).default("week"),
  }),
});

// Sales trends validation schema
const getSalesTrends = Joi.object({
  query: timeRangeSchema.keys({
    timeRange: Joi.string().valid(
      "week", 
      "month", 
      "quarter", 
      "year", 
      "last_30_days",
      "last_90_days",
      "custom"
    ).default("month"),
    groupBy: Joi.string().valid("day", "week", "month").default("day"),
  }),
});

// Top products validation schema
const getTopProducts = Joi.object({
  query: timeRangeSchema.keys({
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  }),
});

// Geographic sales validation schema
const getGeographicSales = Joi.object({
  query: timeRangeSchema,
});

// Create report validation schema
const createReport = Joi.object({
  body: Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Report name is required",
    }),
    description: Joi.string().max(500),
    dataSource: Joi.string()
      .valid("sales", "inventory", "customers", "products", "orders", "shipping")
      .required()
      .messages({
        "any.required": "Data source is required",
      }),
    metrics: Joi.array().items(Joi.string()).min(1).required().messages({
      "array.min": "At least one metric is required",
      "any.required": "Metrics are required",
    }),
    dimensions: Joi.array().items(Joi.string()),
    filters: Joi.object(),
    sortBy: Joi.object({
      field: Joi.string(),
      order: Joi.string().valid("asc", "desc").default("desc"),
    }),
    timeRange: Joi.object({
      start: Joi.date().iso(),
      end: Joi.date().iso().min(Joi.ref("start")),
      dynamicRange: Joi.string().valid(
        "last_7_days", 
        "last_30_days", 
        "last_90_days", 
        "current_month", 
        "previous_month", 
        "current_quarter", 
        "current_year"
      ),
    }).required().messages({
      "any.required": "Time range is required",
    }),
    format: Joi.string().valid("table", "chart", "pivot").default("table"),
    chartType: Joi.string().valid(
      "bar", 
      "line", 
      "pie", 
      "area", 
      "scatter", 
      "radar"
    ).when("format", {
      is: "chart",
      then: Joi.required(),
    }),
    isScheduled: Joi.boolean().default(false),
    schedule: Joi.object({
      frequency: Joi.string().valid("daily", "weekly", "monthly").required(),
      dayOfWeek: Joi.number().min(0).max(6).when("frequency", {
        is: "weekly",
        then: Joi.required(),
      }),
      dayOfMonth: Joi.number().min(1).max(31).when("frequency", {
        is: "monthly",
        then: Joi.required(),
      }),
      time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    }).when("isScheduled", {
      is: true,
      then: Joi.required(),
    }),
  }),
});

// Generate report validation schema
const generateReport = Joi.object({
  params: Joi.object({
    reportId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid report ID format",
        "any.required": "Report ID is required",
      }),
  }),
  query: Joi.object({
    format: Joi.string().valid("json", "csv", "excel", "pdf"),
  }),
});

// Export report validation schema
const exportReport = Joi.object({
  params: Joi.object({
    reportId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid report ID format",
        "any.required": "Report ID is required",
      }),
  }),
  body: Joi.object({
    format: Joi.string()
      .valid("pdf", "csv", "excel", "json")
      .required()
      .messages({
        "any.required": "Export format is required",
      }),
  }),
});

// Create dashboard validation schema
const createDashboard = Joi.object({
  body: Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Dashboard name is required",
    }),
    description: Joi.string().max(500),
    isDefault: Joi.boolean().default(false),
    widgets: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().valid("chart", "metric", "table", "map").required(),
          dataSource: Joi.string()
            .valid("sales", "inventory", "customers", "products", "orders", "shipping")
            .required(),
          metric: Joi.string().required(),
          timeRange: Joi.string().valid(
            "day", 
            "week", 
            "month", 
            "quarter", 
            "year", 
            "custom"
          ).default("week"),
          chartType: Joi.string().valid(
            "bar", 
            "line", 
            "pie", 
            "area", 
            "scatter", 
            "radar"
          ).when("type", {
            is: "chart",
            then: Joi.required(),
          }),
          filters: Joi.object(),
          dimensions: Joi.array().items(Joi.string()),
          position: Joi.object({
            row: Joi.number().required(),
            col: Joi.number().required(),
            width: Joi.number().required(),
            height: Joi.number().required(),
          }).required(),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one widget is required",
        "any.required": "Widgets are required",
      }),
    visibility: Joi.string().valid("private", "team", "public").default("private"),
  }),
});

// Get by ID validation schema (used for various resources)
const getById = Joi.object({
  params: Joi.object({
    reportId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    dashboardId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    exportId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  })
    .min(1)
    .messages({
      "object.min": "At least one ID parameter is required",
    }),
});

module.exports = {
  getDashboardMetrics,
  getSalesTrends,
  getTopProducts,
  getGeographicSales,
  createReport,
  generateReport,
  exportReport,
  createDashboard,
  getById,
}; 