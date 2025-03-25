// src/api/categories/category.controller.js
const categoryService = require("../../services/category.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");

/**
 * Create a new category
 * @route POST /api/v1/categories
 * @access Private (Admin)
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);

    return res
      .status(201)
      .json(
        responseFormatter(true, "Category created successfully", { category })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories with filtering and pagination
 * @route GET /api/v1/categories
 * @access Public
 */
const getCategories = async (req, res, next) => {
  try {
    const filters = {
      parent: req.query.parent,
      isActive: req.query.isActive === "true" ? true : undefined,
    };

    const options = {
      limit: req.query.limit,
      sortBy: req.query.sortBy || "order",
      populateSubcategories: req.query.populateSubcategories === "true",
    };

    const categories = await categoryService.getAllCategories(filters, options);

    return res.status(200).json(
      responseFormatter(true, "Categories retrieved successfully", {
        categories,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get category tree (hierarchical structure)
 * @route GET /api/v1/categories/tree
 * @access Public
 */
const getCategoryTree = async (req, res, next) => {
  try {
    const tree = await categoryService.getCategoryTree();

    return res.status(200).json(
      responseFormatter(true, "Category tree retrieved successfully", {
        tree,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a category by ID
 * @route GET /api/v1/categories/:id
 * @access Public
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const options = {
      populateSubcategories: req.query.populateSubcategories === "true",
      populateProducts: req.query.populateProducts === "true",
      productLimit: req.query.productLimit
        ? parseInt(req.query.productLimit, 10)
        : 10,
    };

    const category = await categoryService.getCategoryById(id, options);

    return res.status(200).json(
      responseFormatter(true, "Category retrieved successfully", {
        category,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a category by slug
 * @route GET /api/v1/categories/slug/:slug
 * @access Public
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const options = {
      populateSubcategories: req.query.populateSubcategories === "true",
      populateProducts: req.query.populateProducts === "true",
      productLimit: req.query.productLimit
        ? parseInt(req.query.productLimit, 10)
        : 10,
    };

    const category = await categoryService.getCategoryBySlug(slug, options);

    return res.status(200).json(
      responseFormatter(true, "Category retrieved successfully", {
        category,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * @route PUT /api/v1/categories/:id
 * @access Private (Admin)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedCategory = await categoryService.updateCategory(id, req.body);

    return res.status(200).json(
      responseFormatter(true, "Category updated successfully", {
        category: updatedCategory,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * @route DELETE /api/v1/categories/:id
 * @access Private (Admin)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);

    return res
      .status(200)
      .json(responseFormatter(true, "Category deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload category image
 * @route POST /api/v1/categories/:id/image
 * @access Private (Admin)
 */
const uploadCategoryImage = async (req, res, next) => {
  try {
    // Make sure file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json(responseFormatter(false, "No image file uploaded"));
    }

    const { id } = req.params;
    const category = await categoryService.uploadCategoryImage(id, req.file);

    return res.status(200).json(
      responseFormatter(true, "Category image uploaded successfully", {
        category,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
};
