const mongoose = require("mongoose");
const {
  Dashboard,
  Report,
  ExportHistory,
} = require("../models/analytics.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const logger = require("../config/logger");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");

/**
 * Analytics Service
 * Provides methods for generating analytics and reports across all modules
 */
class AnalyticsService {
  /**
   * Get dashboard KPI metrics
   * @param {Object} params - Parameters for metrics retrieval
   * @param {String} params.timeRange - Time range for data (day, week, month, etc.)
   * @param {Date} params.startDate - Custom start date if timeRange is custom
   * @param {Date} params.endDate - Custom end date if timeRange is custom
   * @returns {Promise<Object>} Dashboard KPIs
   */
  async getDashboardMetrics({ timeRange = "week", startDate, endDate }) {
    try {
      let dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);

      // Get basic sales metrics
      const salesMetrics = await this.getSalesMetrics(dateFilter);

      // Get basic customer metrics
      const customerMetrics = await this.getCustomerMetrics(dateFilter);

      // Get inventory metrics
      const inventoryMetrics = await this.getInventoryMetrics();

      // Get order fulfillment metrics
      const fulfillmentMetrics = await this.getOrderFulfillmentMetrics(
        dateFilter
      );

      return {
        sales: salesMetrics,
        customers: customerMetrics,
        inventory: inventoryMetrics,
        fulfillment: fulfillmentMetrics,
        timeRange,
      };
    } catch (error) {
      logger.error("Error getting dashboard metrics:", error);
      throw error;
    }
  }

  /**
   * Get sales metrics
   * @param {Object} dateFilter - MongoDB date filter
   * @returns {Promise<Object>} Sales metrics
   */
  async getSalesMetrics(dateFilter) {
    try {
      // Total revenue
      const revenueResult = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      const totalRevenue =
        revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Order count
      const orderCount = await Order.countDocuments({
        ...dateFilter,
        status: { $ne: "cancelled" },
      });

      // Average order value
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      // Get previous period metrics for comparison
      const prevDateFilter = this.getPreviousPeriodFilter(dateFilter);
      const prevRevenueResult = await Order.aggregate([
        { $match: { ...prevDateFilter, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      const prevRevenue =
        prevRevenueResult.length > 0 ? prevRevenueResult[0].total : 0;

      // Calculate growth rates
      const revenueGrowth =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;

      return {
        totalRevenue,
        orderCount,
        averageOrderValue,
        revenueGrowth,
      };
    } catch (error) {
      logger.error("Error getting sales metrics:", error);
      throw error;
    }
  }

  /**
   * Get customer metrics
   * @param {Object} dateFilter - MongoDB date filter
   * @returns {Promise<Object>} Customer metrics
   */
  async getCustomerMetrics(dateFilter) {
    try {
      // New customers in period
      const newCustomers = await User.countDocuments({
        ...dateFilter,
        role: "customer",
      });

      // Total active customers (made an order in the period)
      const activeCustomers = await Order.distinct("customer", dateFilter)
        .length;

      // Returning customers (made more than one order)
      const returningCustomersResult = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$customer", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: "total" },
      ]);
      const returningCustomers =
        returningCustomersResult.length > 0
          ? returningCustomersResult[0].total
          : 0;

      return {
        newCustomers,
        activeCustomers,
        returningCustomers,
      };
    } catch (error) {
      logger.error("Error getting customer metrics:", error);
      throw error;
    }
  }

  /**
   * Get inventory metrics
   * @returns {Promise<Object>} Inventory metrics
   */
  async getInventoryMetrics() {
    try {
      // Total products
      const totalProducts = await Product.countDocuments({ isActive: true });

      // Out of stock products
      const outOfStock = await Product.countDocuments({
        isActive: true,
        "inventory.quantity": { $lte: 0 },
      });

      // Low stock products
      const lowStock = await Product.countDocuments({
        isActive: true,
        "inventory.quantity": { $gt: 0, $lte: 10 },
      });

      // Oversupplied products (over 90 days of inventory)
      const oversupplied = await Product.countDocuments({
        isActive: true,
        "inventory.quantity": { $gt: 100 },
      });

      return {
        totalProducts,
        outOfStock,
        lowStock,
        oversupplied,
      };
    } catch (error) {
      logger.error("Error getting inventory metrics:", error);
      throw error;
    }
  }

  /**
   * Get order fulfillment metrics
   * @param {Object} dateFilter - MongoDB date filter
   * @returns {Promise<Object>} Fulfillment metrics
   */
  async getOrderFulfillmentMetrics(dateFilter) {
    try {
      // Orders by status
      const ordersByStatus = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Processing time (time between order and shipment)
      const processingTimeResult = await Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $project: {
            processingTime: {
              $divide: [
                { $subtract: ["$shippedAt", "$createdAt"] },
                1000 * 60 * 60, // Convert ms to hours
              ],
            },
          },
        },
        { $group: { _id: null, avgTime: { $avg: "$processingTime" } } },
      ]);
      const avgProcessingTime =
        processingTimeResult.length > 0 ? processingTimeResult[0].avgTime : 0;

      return {
        ordersByStatus: Object.fromEntries(
          ordersByStatus.map((item) => [item._id, item.count])
        ),
        avgProcessingTime,
      };
    } catch (error) {
      logger.error("Error getting fulfillment metrics:", error);
      throw error;
    }
  }

  /**
   * Get sales trends over time
   * @param {Object} params - Parameters for trends retrieval
   * @param {String} params.timeRange - Time range for data
   * @param {Date} params.startDate - Custom start date if timeRange is custom
   * @param {Date} params.endDate - Custom end date if timeRange is custom
   * @param {String} params.groupBy - How to group the data (day, week, month)
   * @returns {Promise<Array>} Sales trend data
   */
  async getSalesTrends({
    timeRange = "month",
    startDate,
    endDate,
    groupBy = "day",
  }) {
    try {
      let dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);
      let groupingFormat;

      // Set date grouping format based on groupBy parameter
      switch (groupBy) {
        case "day":
          groupingFormat = "%Y-%m-%d";
          break;
        case "week":
          groupingFormat = "%G-W%V";
          break;
        case "month":
          groupingFormat = "%Y-%m";
          break;
        default:
          groupingFormat = "%Y-%m-%d";
      }

      // Get revenue by time period
      const salesTrends = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: {
              $dateToString: { format: groupingFormat, date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
            avgOrderValue: { $avg: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return salesTrends.map((item) => ({
        period: item._id,
        revenue: item.revenue,
        orders: item.orders,
        avgOrderValue: item.avgOrderValue,
      }));
    } catch (error) {
      logger.error("Error getting sales trends:", error);
      throw error;
    }
  }

  /**
   * Get top selling products
   * @param {Object} params - Parameters for top products retrieval
   * @param {String} params.timeRange - Time range for data
   * @param {Date} params.startDate - Custom start date if timeRange is custom
   * @param {Date} params.endDate - Custom end date if timeRange is custom
   * @param {Number} params.limit - Number of products to return
   * @returns {Promise<Array>} Top selling products
   */
  async getTopSellingProducts({
    timeRange = "month",
    startDate,
    endDate,
    limit = 10,
  }) {
    try {
      let dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);

      const topProducts = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            orders: { $addToSet: "$_id" },
          },
        },
        {
          $project: {
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: { $size: "$orders" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            _id: 1,
            productName: { $arrayElemAt: ["$productInfo.name", 0] },
            sku: { $arrayElemAt: ["$productInfo.sku", 0] },
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: 1,
          },
        },
      ]);

      return topProducts;
    } catch (error) {
      logger.error("Error getting top selling products:", error);
      throw error;
    }
  }

  /**
   * Get geographic sales distribution
   * @param {Object} params - Parameters for geographic data retrieval
   * @param {String} params.timeRange - Time range for data
   * @param {Date} params.startDate - Custom start date if timeRange is custom
   * @param {Date} params.endDate - Custom end date if timeRange is custom
   * @returns {Promise<Array>} Geographic sales data
   */
  async getGeographicSalesDistribution({
    timeRange = "month",
    startDate,
    endDate,
  }) {
    try {
      let dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);

      const geographicData = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: {
              country: "$shippingAddress.country",
              state: "$shippingAddress.state",
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
          },
        },
        {
          $project: {
            _id: 0,
            country: "$_id.country",
            state: "$_id.state",
            totalOrders: 1,
            totalRevenue: 1,
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]);

      return geographicData;
    } catch (error) {
      logger.error("Error getting geographic sales distribution:", error);
      throw error;
    }
  }

  /**
   * Create a new saved report
   * @param {Object} reportData - Report data
   * @param {String} userId - ID of the user creating the report
   * @returns {Promise<Object>} Created report
   */
  async createReport(reportData, userId) {
    try {
      const report = new Report({
        ...reportData,
        creator: userId,
      });

      await report.save();
      return report;
    } catch (error) {
      logger.error("Error creating report:", error);
      throw error;
    }
  }

  /**
   * Generate report data based on saved report configuration
   * @param {String} reportId - ID of the saved report
   * @returns {Promise<Object>} Generated report data
   */
  async generateReportData(reportId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new NotFoundError("Report not found");
      }

      let dateFilter = this.getDateRangeFilter(
        report.timeRange?.dynamicRange,
        report.timeRange?.start,
        report.timeRange?.end
      );

      // Different query logic based on the data source
      let reportData;
      switch (report.dataSource) {
        case "sales":
          reportData = await this.generateSalesReport(report, dateFilter);
          break;
        case "inventory":
          reportData = await this.generateInventoryReport(report);
          break;
        case "customers":
          reportData = await this.generateCustomerReport(report, dateFilter);
          break;
        case "products":
          reportData = await this.generateProductReport(report, dateFilter);
          break;
        case "orders":
          reportData = await this.generateOrderReport(report, dateFilter);
          break;
        case "shipping":
          reportData = await this.generateShippingReport(report, dateFilter);
          break;
        default:
          throw new BadRequestError("Invalid data source");
      }

      // Update last generated timestamp
      await Report.findByIdAndUpdate(reportId, {
        lastGeneratedAt: new Date(),
      });

      return {
        report,
        data: reportData,
      };
    } catch (error) {
      logger.error(`Error generating report data for ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Save a report export record
   * @param {Object} exportData - Export information
   * @returns {Promise<Object>} Created export record
   */
  async saveExportRecord(exportData) {
    try {
      const exportRecord = new ExportHistory(exportData);
      await exportRecord.save();
      return exportRecord;
    } catch (error) {
      logger.error("Error saving export record:", error);
      throw error;
    }
  }

  /**
   * Create a new dashboard
   * @param {Object} dashboardData - Dashboard configuration
   * @param {String} userId - ID of the user creating the dashboard
   * @returns {Promise<Object>} Created dashboard
   */
  async createDashboard(dashboardData, userId) {
    try {
      const dashboard = new Dashboard({
        ...dashboardData,
        owner: userId,
      });

      await dashboard.save();
      return dashboard;
    } catch (error) {
      logger.error("Error creating dashboard:", error);
      throw error;
    }
  }

  /**
   * Create date range filter for MongoDB queries
   * @param {String} timeRange - Predefined time range
   * @param {Date} startDate - Custom start date
   * @param {Date} endDate - Custom end date
   * @returns {Object} MongoDB date filter
   */
  getDateRangeFilter(timeRange, startDate, endDate) {
    const now = new Date();
    let filter = {};

    if (startDate && endDate) {
      filter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
      return filter;
    }

    switch (timeRange) {
      case "last_7_days":
        filter = {
          createdAt: {
            $gte: new Date(now.setDate(now.getDate() - 7)),
            $lte: new Date(),
          },
        };
        break;
      case "last_30_days":
        filter = {
          createdAt: {
            $gte: new Date(now.setDate(now.getDate() - 30)),
            $lte: new Date(),
          },
        };
        break;
      case "current_month":
        filter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lte: new Date(),
          },
        };
        break;
      case "previous_month":
        filter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
          },
        };
        break;
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        filter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), quarter * 3, 1),
            $lte: new Date(),
          },
        };
        break;
      case "current_year":
        filter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: new Date(),
          },
        };
        break;
      default:
        // Default to last 7 days
        filter = {
          createdAt: {
            $gte: new Date(now.setDate(now.getDate() - 7)),
            $lte: new Date(),
          },
        };
    }

    return filter;
  }

  /**
   * Get previous period filter for comparison metrics
   * @param {Object} currentFilter - Current period filter
   * @returns {Object} Previous period filter
   */
  getPreviousPeriodFilter(currentFilter) {
    if (!currentFilter.createdAt) {
      return {};
    }

    const currentStart = currentFilter.createdAt.$gte;
    const currentEnd = currentFilter.createdAt.$lte;
    const duration = currentEnd - currentStart;

    return {
      createdAt: {
        $gte: new Date(currentStart - duration),
        $lte: new Date(currentStart),
      },
    };
  }

  // This service would have additional methods for specific report types
  // These method stubs would be implemented with the actual data generation logic
  async generateSalesReport(report, dateFilter) {
    // Implementation specific to sales reports
    return [];
  }

  async generateInventoryReport(report) {
    // Implementation specific to inventory reports
    return [];
  }

  async generateCustomerReport(report, dateFilter) {
    // Implementation specific to customer reports
    return [];
  }

  async generateProductReport(report, dateFilter) {
    // Implementation specific to product reports
    return [];
  }

  async generateOrderReport(report, dateFilter) {
    // Implementation specific to order reports
    return [];
  }

  async generateShippingReport(report, dateFilter) {
    // Implementation specific to shipping reports
    return [];
  }

  /**
   * Generate different visualization formats for reports
   * @param {Object} data - Data to visualize
   * @param {String} visualizationType - Type of visualization
   * @returns {Object} Visualization data
   */
  async generateVisualization(data, visualizationType = "table") {
    try {
      switch (visualizationType) {
        case "table":
          return this.generateTableVisualization(data);
        case "bar":
          return this.generateBarChartVisualization(data);
        case "line":
          return this.generateLineChartVisualization(data);
        case "pie":
          return this.generatePieChartVisualization(data);
        case "map":
          return this.generateMapVisualization(data);
        case "pivot":
          return this.generatePivotTableVisualization(data);
        default:
          return this.generateTableVisualization(data);
      }
    } catch (error) {
      logger.error(
        `Error generating ${visualizationType} visualization:`,
        error
      );
      throw error;
    }
  }

  /**
   * Generate table visualization
   * @param {Object} data - Data to visualize
   * @returns {Object} Table visualization data
   */
  generateTableVisualization(data) {
    const { headers = [], rows = [] } = data;

    return {
      type: "table",
      headers,
      rows,
      metadata: {
        totalRows: rows.length,
      },
    };
  }

  /**
   * Generate bar chart visualization
   * @param {Object} data - Data to visualize
   * @returns {Object} Bar chart visualization data
   */
  generateBarChartVisualization(data) {
    const { labels = [], datasets = [] } = data;

    return {
      type: "bar",
      labels,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * Generate line chart visualization
   * @param {Object} data - Data to visualize
   * @returns {Object} Line chart visualization data
   */
  generateLineChartVisualization(data) {
    const { labels = [], datasets = [] } = data;

    return {
      type: "line",
      labels,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tension: 0.4,
      },
    };
  }

  /**
   * Generate pie chart visualization
   * @param {Object} data - Data to visualize
   * @returns {Object} Pie chart visualization data
   */
  generatePieChartVisualization(data) {
    const { labels = [], values = [] } = data;

    return {
      type: "pie",
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: this.generateColorPalette(values.length),
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  }

  /**
   * Generate map visualization for geographic data
   * @param {Object} data - Geographic data
   * @returns {Object} Map visualization data
   */
  generateMapVisualization(data) {
    const { regions = [] } = data;

    return {
      type: "map",
      regions,
      options: {
        colorScale: ["#E5F5FF", "#004D99"],
        defaultColor: "#F0F0F0",
      },
    };
  }

  /**
   * Generate pivot table visualization
   * @param {Object} data - Data for pivot table
   * @returns {Object} Pivot table visualization data
   */
  generatePivotTableVisualization(data) {
    const { rows = [], columns = [], values = [], data: pivotData = [] } = data;

    return {
      type: "pivot",
      rows,
      columns,
      values,
      data: pivotData,
      options: {
        colTotals: true,
        rowTotals: true,
      },
    };
  }

  /**
   * Generate color palette for charts
   * @param {Number} count - Number of colors needed
   * @returns {Array} Array of color codes
   */
  generateColorPalette(count) {
    const baseColors = [
      "#4285F4",
      "#EA4335",
      "#FBBC05",
      "#34A853", // Google colors
      "#007BFF",
      "#FF7600",
      "#6F42C1",
      "#28A745", // More colors
      "#DC3545",
      "#FFC107",
      "#17A2B8",
      "#6C757D", // Even more colors
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // If we need more colors, generate them
    const colors = [...baseColors];

    for (let i = baseColors.length; i < count; i++) {
      // Generate additional colors with HSL
      const hue = (i * 137.508) % 360; // Use golden ratio
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }

    return colors;
  }

  /**
   * Schedule a report to be generated and sent periodically
   * @param {String} reportId - ID of the report to schedule
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {Promise<Object>} Updated report with schedule
   */
  async scheduleReport(reportId, scheduleConfig) {
    try {
      // Validate report exists
      const report = await Report.findById(reportId);
      if (!report) {
        throw new NotFoundError("Report not found");
      }

      // Validate schedule configuration
      if (!scheduleConfig.frequency) {
        throw new BadRequestError("Schedule frequency is required");
      }

      // Configure schedule
      const schedule = {
        enabled: true,
        frequency: scheduleConfig.frequency, // daily, weekly, monthly
        dayOfWeek: scheduleConfig.dayOfWeek, // 0-6 (Sunday to Saturday) for weekly
        dayOfMonth: scheduleConfig.dayOfMonth, // 1-31 for monthly
        hour: scheduleConfig.hour || 0,
        minute: scheduleConfig.minute || 0,
        recipients: scheduleConfig.recipients || [],
        fileFormat: scheduleConfig.fileFormat || "PDF",
        nextRunAt: null,
      };

      // Calculate next run date
      schedule.nextRunAt = calculateNextRunDate(schedule);

      // Update report with schedule
      const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        {
          $set: { schedule },
        },
        { new: true }
      );

      // Register with the scheduler service
      const schedulerService = require("./scheduler.service");
      await schedulerService.scheduleTask("report", reportId, {
        taskId: `report-${reportId}`,
        schedule: getCronExpressionForSchedule(schedule),
        data: { reportId },
      });

      return updatedReport;
    } catch (error) {
      logger.error(`Error scheduling report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Generate report data based on configuration and generate file in requested format
   * @param {String} reportId - ID of the report to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated report data and file path
   */
  async generateAndExportReport(reportId, options = {}) {
    try {
      const {
        format = "PDF",
        includeVisualization = true,
        notifyUser = false,
        userId = null,
      } = options;

      // Generate report data
      const reportData = await this.generateReportData(reportId);

      // Generate visualizations if needed
      if (includeVisualization && reportData.visualization) {
        reportData.visualizationData = await this.generateVisualization(
          reportData.data,
          reportData.visualization.type
        );
      }

      // Format report for export
      const formattedReport = await formatReportOutput(reportData, format);

      // Save export record
      const exportRecord = await this.saveExportRecord({
        reportId,
        format,
        generatedBy: userId,
        filePath: formattedReport.filePath,
        fileSize: formattedReport.fileSize,
      });

      // Send notification if requested
      if (notifyUser && userId) {
        const eventService = require("./event.service");
        await eventService.createUserNotification(
          userId,
          `Your report "${reportData.name}" is ready for download`,
          {
            type: "report_ready",
            reportId,
            exportId: exportRecord._id,
          }
        );
      }

      return {
        reportData,
        exportRecord,
        filePath: formattedReport.filePath,
      };
    } catch (error) {
      logger.error(`Error generating and exporting report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Process scheduled reports
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processScheduledReports(options = {}) {
    try {
      const now = new Date();

      // Find reports due for execution
      const dueReports = await Report.find({
        "schedule.enabled": true,
        "schedule.nextRunAt": { $lte: now },
      });

      logger.info(`Found ${dueReports.length} scheduled reports to process`);

      const results = {
        total: dueReports.length,
        processed: 0,
        failed: 0,
        details: [],
      };

      // Process each due report
      for (const report of dueReports) {
        try {
          // Generate and export the report
          const exportResult = await this.generateAndExportReport(report._id, {
            format: report.schedule.fileFormat || "PDF",
            includeVisualization: true,
          });

          // Send to recipients if configured
          if (
            report.schedule.recipients &&
            report.schedule.recipients.length > 0
          ) {
            await this.sendReportToRecipients(report, exportResult);
          }

          // Update next run date
          const nextRunAt = calculateNextRunDate(report.schedule);
          await Report.findByIdAndUpdate(report._id, {
            $set: { "schedule.nextRunAt": nextRunAt },
            $push: {
              "schedule.history": {
                executedAt: now,
                status: "success",
                exportId: exportResult.exportRecord._id,
              },
            },
          });

          results.processed++;
          results.details.push({
            reportId: report._id,
            name: report.name,
            status: "success",
            nextRunAt,
          });
        } catch (error) {
          logger.error(
            `Error processing scheduled report ${report._id}:`,
            error
          );

          // Record failure
          await Report.findByIdAndUpdate(report._id, {
            $push: {
              "schedule.history": {
                executedAt: now,
                status: "failed",
                error: error.message,
              },
            },
          });

          results.failed++;
          results.details.push({
            reportId: report._id,
            name: report.name,
            status: "failed",
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Error processing scheduled reports:", error);
      throw error;
    }
  }

  /**
   * Send report to configured recipients
   * @param {Object} report - Report object
   * @param {Object} exportResult - Result from report export
   * @returns {Promise<void>}
   */
  async sendReportToRecipients(report, exportResult) {
    try {
      const emailService = require("./email.service");
      const { filePath } = exportResult;

      // Prepare email data
      const emailData = {
        template: "scheduled-report",
        subject: `Scheduled Report: ${report.name}`,
        data: {
          reportName: report.name,
          reportDescription: report.description,
          generatedAt: new Date().toLocaleString(),
          scheduleFrequency: report.schedule.frequency,
        },
        attachments: [
          {
            filename: `Report_${report.name.replace(/\s+/g, "_")}_${
              new Date().toISOString().split("T")[0]
            }.${report.schedule.fileFormat.toLowerCase()}`,
            path: filePath,
          },
        ],
      };

      // Send to each recipient
      for (const recipient of report.schedule.recipients) {
        await emailService.sendEmail({
          ...emailData,
          to: recipient.email,
        });

        logger.info(
          `Sent scheduled report ${report._id} to ${recipient.email}`
        );
      }
    } catch (error) {
      logger.error(`Error sending report to recipients:`, error);
      throw error;
    }
  }

  /**
   * Get geographic sales distribution with enhanced visualization options
   * @param {Object} params - Parameters for distribution calculation
   * @returns {Promise<Object>} Geographic distribution data
   */
  async getGeographicSalesDistribution({
    timeRange = "month",
    startDate,
    endDate,
    groupBy = "country",
    visualizationType = "map",
  }) {
    try {
      const dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);

      // Define grouping based on parameter
      let groupField = null;

      switch (groupBy) {
        case "country":
          groupField = "shipping.address.country";
          break;
        case "state":
          groupField = "shipping.address.state";
          break;
        case "city":
          groupField = "shipping.address.city";
          break;
        default:
          groupField = "shipping.address.country";
      }

      // Aggregate orders by geographic region
      const distributionResults = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: `$${groupField}`,
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      // Format data for visualization
      let visualizationData = null;

      if (visualizationType === "map") {
        visualizationData = await this.generateVisualization(
          {
            regions: distributionResults.map((item) => ({
              id: item._id,
              value: item.revenue,
              count: item.count,
              averageOrderValue: item.averageOrderValue,
            })),
          },
          "map"
        );
      } else if (visualizationType === "bar") {
        visualizationData = await this.generateVisualization(
          {
            labels: distributionResults.map((item) => item._id),
            datasets: [
              {
                label: "Revenue",
                data: distributionResults.map((item) => item.revenue),
              },
              {
                label: "Order Count",
                data: distributionResults.map((item) => item.count),
              },
            ],
          },
          "bar"
        );
      } else {
        // Default table view
        visualizationData = await this.generateVisualization(
          {
            headers: [
              "Region",
              "Order Count",
              "Revenue",
              "Average Order Value",
            ],
            rows: distributionResults.map((item) => [
              item._id,
              item.count,
              item.revenue.toFixed(2),
              item.averageOrderValue.toFixed(2),
            ]),
          },
          "table"
        );
      }

      return {
        distribution: distributionResults,
        visualizationData,
        timeRange,
        groupBy,
      };
    } catch (error) {
      logger.error("Error getting geographic sales distribution:", error);
      throw error;
    }
  }
}

/**
 * Custom Report Builder implementation
 * Allows creating highly configurable reports with custom metrics
 * @param {Object} reportConfig - Configuration for the custom report
 * @param {String} userId - User creating the report
 * @returns {Promise<Object>} Generated report data
 */
async function buildCustomReport(reportConfig, userId) {
  try {
    // Validate report configuration
    if (!reportConfig.name) {
      throw new BadRequestError("Report name is required");
    }

    if (
      !reportConfig.metrics ||
      !Array.isArray(reportConfig.metrics) ||
      reportConfig.metrics.length === 0
    ) {
      throw new BadRequestError("At least one metric must be defined");
    }

    // Set up date range
    const dateRange = getDateRangeFromConfig(reportConfig.dateRange);

    // Process each metric and collect data
    const reportData = await processReportMetrics(
      reportConfig.metrics,
      dateRange,
      reportConfig.filters
    );

    // Save report if requested
    let savedReport = null;
    if (reportConfig.saveReport) {
      savedReport = await saveCustomReport(reportConfig, userId);
    }

    return {
      name: reportConfig.name,
      description: reportConfig.description || "",
      generatedAt: new Date(),
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate,
        label: reportConfig.dateRange.label || "custom",
      },
      metrics: reportData,
      id: savedReport ? savedReport._id : null,
    };
  } catch (error) {
    logger.error("Error building custom report:", error);
    throw error;
  }
}

/**
 * Get date range from config
 * @param {Object} dateRangeConfig - Date range configuration
 * @returns {Object} Date range with start and end dates
 */
function getDateRangeFromConfig(dateRangeConfig) {
  if (!dateRangeConfig) {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }

  if (dateRangeConfig.preset) {
    // Use preset date range
    switch (dateRangeConfig.preset) {
      case "today":
        return getDateRangeForToday();
      case "yesterday":
        return getDateRangeForYesterday();
      case "last7days":
        return getDateRangeForLast7Days();
      case "last30days":
        return getDateRangeForLast30Days();
      case "thisMonth":
        return getDateRangeForThisMonth();
      case "lastMonth":
        return getDateRangeForLastMonth();
      case "thisYear":
        return getDateRangeForThisYear();
      default:
        throw new BadRequestError(
          `Unknown date range preset: ${dateRangeConfig.preset}`
        );
    }
  } else if (dateRangeConfig.startDate && dateRangeConfig.endDate) {
    // Use custom date range
    return {
      startDate: new Date(dateRangeConfig.startDate),
      endDate: new Date(dateRangeConfig.endDate),
    };
  } else {
    throw new BadRequestError("Invalid date range configuration");
  }
}

/**
 * Process all metrics defined in report config
 * @param {Array} metrics - Array of metric definitions
 * @param {Object} dateRange - Date range for the report
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Processed metrics with data
 */
async function processReportMetrics(metrics, dateRange, filters = {}) {
  const results = [];

  for (const metric of metrics) {
    // Validate metric type
    if (!metric.type) {
      throw new BadRequestError("Metric type is required");
    }

    // Process based on metric type
    let metricResult;
    switch (metric.type) {
      case "salesTotal":
        metricResult = await calculateSalesTotal(dateRange, filters);
        break;
      case "orderCount":
        metricResult = await calculateOrderCount(dateRange, filters);
        break;
      case "averageOrderValue":
        metricResult = await calculateAverageOrderValue(dateRange, filters);
        break;
      case "topProducts":
        metricResult = await calculateTopProducts(
          dateRange,
          filters,
          metric.limit || 10
        );
        break;
      case "salesByCategory":
        metricResult = await calculateSalesByCategory(dateRange, filters);
        break;
      case "salesByPaymentMethod":
        metricResult = await calculateSalesByPaymentMethod(dateRange, filters);
        break;
      case "newCustomers":
        metricResult = await calculateNewCustomers(dateRange, filters);
        break;
      case "customerRetention":
        metricResult = await calculateCustomerRetention(dateRange, filters);
        break;
      case "inventoryValue":
        metricResult = await calculateInventoryValue(filters);
        break;
      case "lowStockItems":
        metricResult = await calculateLowStockItems(filters, metric.threshold);
        break;
      case "salesByTime":
        metricResult = await calculateSalesByTime(
          dateRange,
          filters,
          metric.groupBy || "day"
        );
        break;
      case "salesByRegion":
        metricResult = await calculateSalesByRegion(dateRange, filters);
        break;
      case "ordersByStatus":
        metricResult = await calculateOrdersByStatus(dateRange, filters);
        break;
      case "custom":
        if (!metric.query) {
          throw new BadRequestError("Custom metric requires a query");
        }
        metricResult = await executeCustomMetricQuery(
          metric.query,
          dateRange,
          filters
        );
        break;
      default:
        throw new BadRequestError(`Unknown metric type: ${metric.type}`);
    }

    results.push({
      id: metric.id || `metric_${results.length + 1}`,
      name: metric.name || metric.type,
      type: metric.type,
      data: metricResult,
      visualization: metric.visualization || "table",
    });
  }

  return results;
}

/**
 * Save custom report configuration
 * @param {Object} reportConfig - Report configuration
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Saved report
 */
async function saveCustomReport(reportConfig, userId) {
  try {
    const report = new Report({
      name: reportConfig.name,
      description: reportConfig.description || "",
      type: "custom",
      createdBy: userId,
      config: {
        metrics: reportConfig.metrics,
        dateRange: reportConfig.dateRange,
        filters: reportConfig.filters || {},
        visualizations: reportConfig.visualizations || [],
        scheduledDelivery: reportConfig.scheduledDelivery || null,
      },
      lastGenerated: new Date(),
    });

    await report.save();
    return report;
  } catch (error) {
    logger.error("Error saving custom report:", error);
    throw error;
  }
}

/**
 * Calculate total sales metric
 * @param {Object} dateRange - Date range for calculation
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Sales total data
 */
async function calculateSalesTotal(dateRange, filters = {}) {
  try {
    const query = {
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
      status: { $nin: ["cancelled", "refunded"] },
    };

    // Apply additional filters
    if (filters.paymentStatus) {
      query["payment.status"] = filters.paymentStatus;
    }

    if (filters.paymentMethod) {
      query["payment.method"] = filters.paymentMethod;
    }

    // Get totals
    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get previous period for comparison
    const previousDateRange = getPreviousPeriod(dateRange);
    const previousQuery = {
      ...query,
      createdAt: {
        $gte: previousDateRange.startDate,
        $lte: previousDateRange.endDate,
      },
    };

    const previousResult = await Order.aggregate([
      { $match: previousQuery },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSales = result.length > 0 ? result[0].total : 0;
    const previousTotalSales =
      previousResult.length > 0 ? previousResult[0].total : 0;

    // Calculate growth
    let growth = 0;
    if (previousTotalSales > 0) {
      growth = ((totalSales - previousTotalSales) / previousTotalSales) * 100;
    } else if (totalSales > 0) {
      growth = 100; // If previous was 0 and now we have sales, that's 100% growth
    }

    return {
      value: totalSales,
      previousValue: previousTotalSales,
      growth: growth.toFixed(2),
      currency: "INR", // Could be dynamic based on store settings
      count: result.length > 0 ? result[0].count : 0,
    };
  } catch (error) {
    logger.error("Error calculating sales total:", error);
    throw error;
  }
}

/**
 * Calculate the next run date for a scheduled report
 * @param {Object} schedule - Schedule configuration
 * @returns {Date} Next run date
 */
function calculateNextRunDate(schedule) {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);
  let nextRun = new Date();

  nextRun.setHours(hours, minutes, 0, 0);

  // If time today has already passed, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (schedule.frequency) {
    case "daily":
      // Already set for tomorrow if needed
      break;

    case "weekly":
      const targetDay = schedule.day || 1; // Monday is 1, Sunday is 0 or 7
      const currentDay = nextRun.getDay() || 7; // Make Sunday 7 for easier calculation

      // Calculate days to add to get to target day
      const daysToAdd = (targetDay - currentDay + 7) % 7;
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;

    case "monthly":
      const targetDate = schedule.day || 1;

      // Move to next month if target date has passed this month
      if (nextRun.getDate() > targetDate) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }

      // Set the target date
      nextRun.setDate(targetDate);
      break;

    case "quarterly":
      // First day of next quarter
      const currentMonth = nextRun.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);
      const nextQuarterFirstMonth = ((currentQuarter + 1) * 3) % 12;

      nextRun.setMonth(nextQuarterFirstMonth);
      nextRun.setDate(schedule.day || 1);
      break;
  }

  return nextRun;
}

/**
 * Convert schedule config to cron expression
 * @param {Object} schedule - Schedule configuration
 * @returns {String} Cron expression
 */
function getCronExpressionForSchedule(schedule) {
  const [hours, minutes] = schedule.time.split(":").map(Number);

  switch (schedule.frequency) {
    case "daily":
      return `${minutes} ${hours} * * *`;

    case "weekly":
      const day = schedule.day || 1; // Default to Monday
      return `${minutes} ${hours} * * ${day}`;

    case "monthly":
      const date = schedule.day || 1; // Default to 1st of month
      return `${minutes} ${hours} ${date} * *`;

    case "quarterly":
      // For quarterly, we'll use the scheduler's API to handle this
      // This is a simplification - would need more complex logic for true quarterly
      const monthDay = schedule.day || 1; // Default to 1st of quarter month
      return `${minutes} ${hours} ${monthDay} 1,4,7,10 *`; // 1st of Jan, Apr, Jul, Oct

    default:
      throw new Error(`Unsupported schedule frequency: ${schedule.frequency}`);
  }
}

// Add these new functions to the exports
module.exports = {
  // Existing exports...

  // New custom report builder functions
  buildCustomReport,
  scheduleReport,
  generateAndSendReport,
  saveCustomReport,
};
