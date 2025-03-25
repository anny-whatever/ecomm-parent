const mongoose = require("mongoose");

/**
 * Dashboard Widget Schema
 * Defines individual widgets displayed on analytics dashboards
 */
const widgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["chart", "metric", "table", "map"],
    },
    dataSource: {
      type: String,
      required: true,
      enum: ["sales", "inventory", "customers", "products", "orders", "shipping"],
    },
    metric: {
      type: String,
      required: true,
    },
    timeRange: {
      type: String,
      enum: ["day", "week", "month", "quarter", "year", "custom"],
      default: "week",
    },
    chartType: {
      type: String,
      enum: ["bar", "line", "pie", "area", "scatter", "radar"],
    },
    filters: {
      type: Object,
      default: {},
    },
    dimensions: [String],
    position: {
      row: Number,
      col: Number,
      width: Number,
      height: Number,
    },
  },
  { timestamps: true }
);

/**
 * Dashboard Schema
 * Defines analytics dashboards
 */
const dashboardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    widgets: [widgetSchema],
    visibility: {
      type: String,
      enum: ["private", "team", "public"],
      default: "private",
    },
  },
  { timestamps: true }
);

/**
 * Saved Report Schema
 * Defines user-saved reports
 */
const reportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataSource: {
      type: String,
      required: true,
      enum: ["sales", "inventory", "customers", "products", "orders", "shipping"],
    },
    metrics: [String],
    dimensions: [String],
    filters: {
      type: Object,
      default: {},
    },
    sortBy: {
      field: String,
      order: {
        type: String,
        enum: ["asc", "desc"],
        default: "desc",
      },
    },
    timeRange: {
      start: Date,
      end: Date,
      dynamicRange: {
        type: String,
        enum: ["last_7_days", "last_30_days", "last_90_days", "current_month", "previous_month", "current_quarter", "current_year"],
      },
    },
    format: {
      type: String,
      enum: ["table", "chart", "pivot"],
      default: "table",
    },
    chartType: {
      type: String,
      enum: ["bar", "line", "pie", "area", "scatter", "radar"],
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    schedule: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
      time: String,
      recipients: [String],
    },
    lastGeneratedAt: Date,
  },
  { timestamps: true }
);

/**
 * Export History Schema
 * Keeps track of report exports
 */
const exportHistorySchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    format: {
      type: String,
      enum: ["pdf", "csv", "excel", "json"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    fileUrl: String,
    expiresAt: Date,
    error: String,
  },
  { timestamps: true }
);

// Create models
const Dashboard = mongoose.model("Dashboard", dashboardSchema);
const Report = mongoose.model("Report", reportSchema);
const ExportHistory = mongoose.model("ExportHistory", exportHistorySchema);

module.exports = {
  Dashboard,
  Report,
  ExportHistory,
}; 