// src/services/category.service.js
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const { NotFoundError, BadRequestError } = require("../utils/errorTypes");
const logger = require("../config/logger");

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category
 */
const createCategory = async (categoryData) => {
  try {
    // Check for parent category if provided
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        throw new NotFoundError("Parent category not found");
      }

      // Check for circular reference (to prevent a category from being its own ancestor)
      if (
        parentCategory.ancestors.some(
          (a) => a._id.toString() === categoryData.parent
        )
      ) {
        throw new BadRequestError(
          "Circular reference detected. A category cannot be its own ancestor."
        );
      }
    }

    const category = new Category(categoryData);
    await category.save();

    return category;
  } catch (error) {
    logger.error("Error creating category:", error);
    throw error;
  }
};

/**
 * Update a category
 * @param {String} categoryId - Category ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (categoryId, updateData) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check if trying to set itself as parent
    if (updateData.parent && updateData.parent === categoryId) {
      throw new BadRequestError("A category cannot be its own parent");
    }

    // Check if trying to set one of its descendants as parent (circular reference)
    if (updateData.parent) {
      const childCategories = await Category.find({
        "ancestors._id": categoryId,
      });

      if (
        childCategories.some(
          (child) => child._id.toString() === updateData.parent
        )
      ) {
        throw new BadRequestError(
          "Cannot set a descendant as parent (circular reference)"
        );
      }
    }

    // Update category
    Object.assign(category, updateData);
    await category.save();

    return category;
  } catch (error) {
    logger.error(`Error updating category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Get a category by ID
 * @param {String} categoryId - Category ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Category object
 */
const getCategoryById = async (categoryId, options = {}) => {
  try {
    const query = Category.findById(categoryId);

    // Populate subcategories if requested
    if (options.populateSubcategories) {
      query.populate("subcategories");
    }

    // Populate products if requested
    if (options.populateProducts) {
      query.populate({
        path: "products",
        match: { status: "active" },
        select: "name slug price images status",
        options: { limit: options.productLimit || 10 },
      });
    }

    const category = await query;

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return category;
  } catch (error) {
    logger.error(`Error getting category by ID ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Get a category by slug
 * @param {String} slug - Category slug
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Category object
 */
const getCategoryBySlug = async (slug, options = {}) => {
  try {
    const query = Category.findOne({ slug });

    // Populate subcategories if requested
    if (options.populateSubcategories) {
      query.populate("subcategories");
    }

    // Populate products if requested
    if (options.populateProducts) {
      query.populate({
        path: "products",
        match: { status: "active" },
        select: "name slug price images status",
        options: { limit: options.productLimit || 10 },
      });
    }

    const category = await query;

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return category;
  } catch (error) {
    logger.error(`Error getting category by slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Get all categories
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of categories
 */
const getAllCategories = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Filter by parent
    if (filters.parent === "root") {
      // Root categories (no parent)
      query.parent = null;
    } else if (filters.parent) {
      query.parent = filters.parent;
    }

    // Filter by active status
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Create query
    const categoriesQuery = Category.find(query);

    // Apply sort
    const sortBy = options.sortBy || "order";
    categoriesQuery.sort(sortBy);

    // Apply limit
    if (options.limit) {
      categoriesQuery.limit(parseInt(options.limit, 10));
    }

    // Populate subcategories if requested
    if (options.populateSubcategories) {
      categoriesQuery.populate("subcategories");
    }

    const categories = await categoriesQuery;
    return categories;
  } catch (error) {
    logger.error("Error getting all categories:", error);
    throw error;
  }
};

/**
 * Get category tree
 * @returns {Promise<Array>} Category tree
 */
const getCategoryTree = async () => {
  try {
    return await Category.getTree();
  } catch (error) {
    logger.error("Error getting category tree:", error);
    throw error;
  }
};

/**
 * Delete a category
 * @param {String} categoryId - Category ID
 * @returns {Promise<Boolean>} Success status
 */
const deleteCategory = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({
      categories: categoryId,
    });

    if (productsCount > 0) {
      throw new BadRequestError(
        `Cannot delete category with ${productsCount} products. Please reassign products first.`
      );
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({
      parent: categoryId,
    });

    if (subcategoriesCount > 0) {
      throw new BadRequestError(
        `Cannot delete category with ${subcategoriesCount} subcategories. Please delete or reassign subcategories first.`
      );
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    return true;
  } catch (error) {
    logger.error(`Error deleting category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Upload category image
 * @param {String} categoryId - Category ID
 * @param {Object} file - Processed image file
 * @returns {Promise<Object>} Updated category
 */
const uploadCategoryImage = async (categoryId, file) => {
  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Update category with new image
    category.image = `/${file.optimizedPath}`;
    await category.save();

    return category;
  } catch (error) {
    logger.error(`Error uploading image for category ${categoryId}:`, error);
    throw error;
  }
};

module.exports = {
  createCategory,
  updateCategory,
  getCategoryById,
  getCategoryBySlug,
  getAllCategories,
  getCategoryTree,
  deleteCategory,
  uploadCategoryImage,
};
