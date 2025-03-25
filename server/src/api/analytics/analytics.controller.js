const analyticsService = require("../../services/analytics.service");
const { responseFormatter } = require("../../utils/responseFormatter");
const logger = require("../../config/logger");

/**
 * Get dashboard KPI metrics
 * @route GET /api/v1/analytics/dashboard
 * @access Private (Admin/Manager)
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate } = req.query;

    const metrics = await analyticsService.getDashboardMetrics({
      timeRange,
      startDate,
      endDate,
    });

    return res.status(200).json(
      responseFormatter(true, "Dashboard metrics retrieved successfully", {
        metrics,
      })
    );
  } catch (error) {
    logger.error("Error retrieving dashboard metrics:", error);
    next(error);
  }
};

/**
 * Get sales trends data
 * @route GET /api/v1/analytics/sales/trends
 * @access Private (Admin/Manager)
 */
const getSalesTrends = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate, groupBy } = req.query;

    const trends = await analyticsService.getSalesTrends({
      timeRange,
      startDate,
      endDate,
      groupBy,
    });

    return res.status(200).json(
      responseFormatter(true, "Sales trends retrieved successfully", {
        trends,
      })
    );
  } catch (error) {
    logger.error("Error retrieving sales trends:", error);
    next(error);
  }
};

/**
 * Get top selling products
 * @route GET /api/v1/analytics/products/top
 * @access Private (Admin/Manager)
 */
const getTopSellingProducts = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate, limit, category } = req.query;

    const products = await analyticsService.getTopSellingProducts({
      timeRange,
      startDate,
      endDate,
      limit: parseInt(limit, 10) || 10,
      category,
    });

    return res.status(200).json(
      responseFormatter(true, "Top selling products retrieved successfully", {
        products,
      })
    );
  } catch (error) {
    logger.error("Error retrieving top selling products:", error);
    next(error);
  }
};

/**
 * Get geographic sales distribution
 * @route GET /api/v1/analytics/sales/geographic
 * @access Private (Admin/Manager)
 */
const getGeographicSalesDistribution = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate } = req.query;

    const geoData = await analyticsService.getGeographicSalesDistribution({
      timeRange,
      startDate,
      endDate,
    });

    return res.status(200).json(
      responseFormatter(true, "Geographic sales data retrieved successfully", {
        geoData,
      })
    );
  } catch (error) {
    logger.error("Error retrieving geographic sales data:", error);
    next(error);
  }
};

/**
 * Create a new report
 * @route POST /api/v1/analytics/reports
 * @access Private (Admin/Manager)
 */
const createReport = async (req, res, next) => {
  try {
    const report = await analyticsService.createReport(req.body, req.user._id);

    return res.status(201).json(
      responseFormatter(true, "Report created successfully", {
        report,
      })
    );
  } catch (error) {
    logger.error("Error creating report:", error);
    next(error);
  }
};

/**
 * Get all saved reports
 * @route GET /api/v1/analytics/reports
 * @access Private (Admin/Manager)
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reports = await analyticsService.Report.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const totalReports = await analyticsService.Report.countDocuments({
      creator: req.user._id,
    });

    return res.status(200).json(
      responseFormatter(true, "Reports retrieved successfully", {
        reports,
        pagination: {
          total: totalReports,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(totalReports / parseInt(limit, 10)),
        },
      })
    );
  } catch (error) {
    logger.error("Error retrieving reports:", error);
    next(error);
  }
};

/**
 * Get report by ID
 * @route GET /api/v1/analytics/reports/:reportId
 * @access Private (Admin/Manager)
 */
const getReportById = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await analyticsService.Report.findById(reportId);

    if (!report) {
      return res.status(404).json(responseFormatter(false, "Report not found"));
    }

    return res.status(200).json(
      responseFormatter(true, "Report retrieved successfully", {
        report,
      })
    );
  } catch (error) {
    logger.error(`Error retrieving report ${req.params.reportId}:`, error);
    next(error);
  }
};

/**
 * Generate report data
 * @route GET /api/v1/analytics/reports/:reportId/generate
 * @access Private (Admin/Manager)
 */
const generateReportData = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { format } = req.query;

    const reportData = await analyticsService.generateReportData(reportId);

    // For non-JSON formats, we would handle file generation here
    if (format && format !== "json") {
      // Handle file export formats
      const exportRecord = await analyticsService.saveExportRecord({
        report: reportId,
        user: req.user._id,
        format,
        status: "completed",
        // fileUrl would be set after file generation
      });

      return res.status(200).json(
        responseFormatter(true, "Report export initiated", {
          exportId: exportRecord._id,
        })
      );
    }

    return res.status(200).json(
      responseFormatter(true, "Report data generated successfully", {
        report: reportData.report,
        data: reportData.data,
      })
    );
  } catch (error) {
    logger.error(`Error generating report data for ${req.params.reportId}:`, error);
    next(error);
  }
};

/**
 * Export report to a specific format
 * @route POST /api/v1/analytics/reports/:reportId/export
 * @access Private (Admin/Manager)
 */
const exportReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { format } = req.body;

    // Create an export record
    const exportRecord = await analyticsService.saveExportRecord({
      report: reportId,
      user: req.user._id,
      format,
      status: "pending",
    });

    // In a real implementation, we might queue a background job to handle the export
    // For this example, we'll just update the status
    setTimeout(async () => {
      try {
        await analyticsService.ExportHistory.findByIdAndUpdate(exportRecord._id, {
          status: "completed",
          fileUrl: `/exports/${reportId}_${Date.now()}.${format}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      } catch (error) {
        logger.error(`Error updating export record ${exportRecord._id}:`, error);
      }
    }, 5000);

    return res.status(202).json(
      responseFormatter(true, "Report export initiated", {
        exportId: exportRecord._id,
      })
    );
  } catch (error) {
    logger.error(`Error exporting report ${req.params.reportId}:`, error);
    next(error);
  }
};

/**
 * Get export status
 * @route GET /api/v1/analytics/exports/:exportId
 * @access Private (Admin/Manager)
 */
const getExportStatus = async (req, res, next) => {
  try {
    const { exportId } = req.params;

    const exportRecord = await analyticsService.ExportHistory.findById(exportId);

    if (!exportRecord) {
      return res.status(404).json(responseFormatter(false, "Export record not found"));
    }

    return res.status(200).json(
      responseFormatter(true, "Export status retrieved successfully", {
        export: exportRecord,
      })
    );
  } catch (error) {
    logger.error(`Error retrieving export status for ${req.params.exportId}:`, error);
    next(error);
  }
};

/**
 * Create a new dashboard
 * @route POST /api/v1/analytics/dashboards
 * @access Private (Admin/Manager)
 */
const createDashboard = async (req, res, next) => {
  try {
    const dashboard = await analyticsService.createDashboard(req.body, req.user._id);

    return res.status(201).json(
      responseFormatter(true, "Dashboard created successfully", {
        dashboard,
      })
    );
  } catch (error) {
    logger.error("Error creating dashboard:", error);
    next(error);
  }
};

/**
 * Get all dashboards
 * @route GET /api/v1/analytics/dashboards
 * @access Private (Admin/Manager)
 */
const getDashboards = async (req, res, next) => {
  try {
    const dashboards = await analyticsService.Dashboard.find({
      $or: [
        { owner: req.user._id },
        { visibility: "public" },
        { visibility: "team", owner: { $ne: req.user._id } },
      ],
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json(
      responseFormatter(true, "Dashboards retrieved successfully", {
        dashboards,
      })
    );
  } catch (error) {
    logger.error("Error retrieving dashboards:", error);
    next(error);
  }
};

/**
 * Get dashboard by ID
 * @route GET /api/v1/analytics/dashboards/:dashboardId
 * @access Private (Admin/Manager)
 */
const getDashboardById = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await analyticsService.Dashboard.findById(dashboardId);

    if (!dashboard) {
      return res.status(404).json(responseFormatter(false, "Dashboard not found"));
    }

    // Check if user has access to this dashboard
    if (
      dashboard.visibility === "private" &&
      dashboard.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json(responseFormatter(false, "Access denied"));
    }

    return res.status(200).json(
      responseFormatter(true, "Dashboard retrieved successfully", {
        dashboard,
      })
    );
  } catch (error) {
    logger.error(`Error retrieving dashboard ${req.params.dashboardId}:`, error);
    next(error);
  }
};

/**
 * Update dashboard
 * @route PUT /api/v1/analytics/dashboards/:dashboardId
 * @access Private (Admin/Manager)
 */
const updateDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await analyticsService.Dashboard.findById(dashboardId);

    if (!dashboard) {
      return res.status(404).json(responseFormatter(false, "Dashboard not found"));
    }

    if (dashboard.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json(responseFormatter(false, "Not authorized to update this dashboard"));
    }

    const updatedDashboard = await analyticsService.Dashboard.findByIdAndUpdate(
      dashboardId,
      req.body,
      { new: true }
    );

    return res.status(200).json(
      responseFormatter(true, "Dashboard updated successfully", {
        dashboard: updatedDashboard,
      })
    );
  } catch (error) {
    logger.error(`Error updating dashboard ${req.params.dashboardId}:`, error);
    next(error);
  }
};

/**
 * Delete dashboard
 * @route DELETE /api/v1/analytics/dashboards/:dashboardId
 * @access Private (Admin/Manager)
 */
const deleteDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;

    const dashboard = await analyticsService.Dashboard.findById(dashboardId);

    if (!dashboard) {
      return res.status(404).json(responseFormatter(false, "Dashboard not found"));
    }

    if (dashboard.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json(responseFormatter(false, "Not authorized to delete this dashboard"));
    }

    await analyticsService.Dashboard.findByIdAndDelete(dashboardId);

    return res.status(200).json(
      responseFormatter(true, "Dashboard deleted successfully")
    );
  } catch (error) {
    logger.error(`Error deleting dashboard ${req.params.dashboardId}:`, error);
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getSalesTrends,
  getTopSellingProducts,
  getGeographicSalesDistribution,
  createReport,
  getReports,
  getReportById,
  generateReportData,
  exportReport,
  getExportStatus,
  createDashboard,
  getDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard,
}; 