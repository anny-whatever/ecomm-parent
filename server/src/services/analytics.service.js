const mongoose = require("mongoose");
const { Dashboard, Report, ExportHistory } = require("../models/analytics.model");
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
      const fulfillmentMetrics = await this.getOrderFulfillmentMetrics(dateFilter);

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
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

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
      const prevRevenue = prevRevenueResult.length > 0 ? prevRevenueResult[0].total : 0;

      // Calculate growth rates
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

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
      const activeCustomers = await Order.distinct("customer", dateFilter).length;

      // Returning customers (made more than one order)
      const returningCustomersResult = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$customer", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: "total" },
      ]);
      const returningCustomers = returningCustomersResult.length > 0 ? returningCustomersResult[0].total : 0;

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
      const avgProcessingTime = processingTimeResult.length > 0 ? processingTimeResult[0].avgTime : 0;

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
  async getSalesTrends({ timeRange = "month", startDate, endDate, groupBy = "day" }) {
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
            _id: { $dateToString: { format: groupingFormat, date: "$createdAt" } },
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
  async getTopSellingProducts({ timeRange = "month", startDate, endDate, limit = 10 }) {
    try {
      let dateFilter = this.getDateRangeFilter(timeRange, startDate, endDate);

      const topProducts = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
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
  async getGeographicSalesDistribution({ timeRange = "month", startDate, endDate }) {
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
}

module.exports = new AnalyticsService(); 