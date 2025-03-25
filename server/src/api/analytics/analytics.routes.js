// src/api/analytics/analytics.routes.js
const express = require("express");
const analyticsController = require("./analytics.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");
const rbacMiddleware = require("../../middleware/rbac.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");
const analyticsValidator = require("../../utils/validators/analytics.validator");

const router = express.Router();

// All analytics routes require authentication
router.use(authMiddleware);

/*
 * Dashboard routes
 */

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard KPI metrics
 * @access  Private (Admin/Manager)
 */
router.get(
  "/dashboard",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getDashboardMetrics),
  analyticsController.getDashboardMetrics
);

/*
 * Sales analytics routes
 */

/**
 * @route   GET /api/v1/analytics/sales/trends
 * @desc    Get sales trends over time
 * @access  Private (Admin/Manager)
 */
router.get(
  "/sales/trends",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getSalesTrends),
  analyticsController.getSalesTrends
);

/**
 * @route   GET /api/v1/analytics/sales/geographic
 * @desc    Get geographic sales distribution
 * @access  Private (Admin/Manager)
 */
router.get(
  "/sales/geographic",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getGeographicSales),
  analyticsController.getGeographicSalesDistribution
);

/*
 * Product analytics routes
 */

/**
 * @route   GET /api/v1/analytics/products/top
 * @desc    Get top selling products
 * @access  Private (Admin/Manager)
 */
router.get(
  "/products/top",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getTopProducts),
  analyticsController.getTopSellingProducts
);

/*
 * Report management routes
 */

/**
 * @route   POST /api/v1/analytics/reports
 * @desc    Create a new report
 * @access  Private (Admin/Manager)
 */
router.post(
  "/reports",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.createReport),
  analyticsController.createReport
);

/**
 * @route   GET /api/v1/analytics/reports
 * @desc    Get all saved reports
 * @access  Private (Admin/Manager)
 */
router.get(
  "/reports",
  rbacMiddleware(["admin", "manager"]),
  analyticsController.getReports
);

/**
 * @route   GET /api/v1/analytics/reports/:reportId
 * @desc    Get report by ID
 * @access  Private (Admin/Manager)
 */
router.get(
  "/reports/:reportId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getById),
  analyticsController.getReportById
);

/**
 * @route   GET /api/v1/analytics/reports/:reportId/generate
 * @desc    Generate report data
 * @access  Private (Admin/Manager)
 */
router.get(
  "/reports/:reportId/generate",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.generateReport),
  analyticsController.generateReportData
);

/**
 * @route   POST /api/v1/analytics/reports/:reportId/export
 * @desc    Export report to a specific format
 * @access  Private (Admin/Manager)
 */
router.post(
  "/reports/:reportId/export",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.exportReport),
  analyticsController.exportReport
);

/**
 * @route   GET /api/v1/analytics/exports/:exportId
 * @desc    Get export status
 * @access  Private (Admin/Manager)
 */
router.get(
  "/exports/:exportId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getById),
  analyticsController.getExportStatus
);

/*
 * Dashboard management routes
 */

/**
 * @route   POST /api/v1/analytics/dashboards
 * @desc    Create a new dashboard
 * @access  Private (Admin/Manager)
 */
router.post(
  "/dashboards",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.createDashboard),
  analyticsController.createDashboard
);

/**
 * @route   GET /api/v1/analytics/dashboards
 * @desc    Get all dashboards
 * @access  Private (Admin/Manager)
 */
router.get(
  "/dashboards",
  rbacMiddleware(["admin", "manager"]),
  analyticsController.getDashboards
);

/**
 * @route   GET /api/v1/analytics/dashboards/:dashboardId
 * @desc    Get dashboard by ID
 * @access  Private (Admin/Manager)
 */
router.get(
  "/dashboards/:dashboardId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getById),
  analyticsController.getDashboardById
);

/**
 * @route   PUT /api/v1/analytics/dashboards/:dashboardId
 * @desc    Update dashboard
 * @access  Private (Admin/Manager)
 */
router.put(
  "/dashboards/:dashboardId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.createDashboard),
  analyticsController.updateDashboard
);

/**
 * @route   DELETE /api/v1/analytics/dashboards/:dashboardId
 * @desc    Delete dashboard
 * @access  Private (Admin/Manager)
 */
router.delete(
  "/dashboards/:dashboardId",
  rbacMiddleware(["admin", "manager"]),
  validationMiddleware(analyticsValidator.getById),
  analyticsController.deleteDashboard
);

module.exports = router; 