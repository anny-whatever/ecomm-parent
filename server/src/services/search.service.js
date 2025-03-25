const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Review = require("../models/review.model");
const mongoose = require("mongoose");

/**
 * Search products with advanced filtering
 * @param {Object} query - Search query parameters
 * @returns {Promise<Object>} Search results with pagination
 */
const searchProducts = async (query) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    rating,
    availability,
    attributes,
    tags,
    sortBy = "relevance",
    page = 1,
    limit = 20,
    featured,
    status,
  } = query;

  // Build search filter
  const filter = {};

  // Text search if keyword provided
  if (keyword) {
    filter.$text = { $search: keyword };
  }

  // Category filter
  if (category) {
    // Support for multiple categories
    const categoryIds = Array.isArray(category) ? category : [category];
    filter.categories = { $in: categoryIds };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter["price.effective"] = {};
    if (minPrice !== undefined) {
      filter["price.effective"].$gte = parseFloat(minPrice);
    }
    if (maxPrice !== undefined) {
      filter["price.effective"].$lte = parseFloat(maxPrice);
    }
  }

  // Rating filter
  if (rating) {
    filter["reviews.average"] = { $gte: parseFloat(rating) };
  }

  // Availability filter
  if (availability === "in_stock") {
    filter.$expr = { $gt: ["$inventory.quantity", "$inventory.reserved"] };
  } else if (availability === "out_of_stock") {
    filter.$expr = { $lte: ["$inventory.quantity", "$inventory.reserved"] };
  } else if (availability === "low_stock") {
    filter.$and = [
      { $expr: { $gt: ["$inventory.quantity", "$inventory.reserved"] } },
      {
        $expr: {
          $lte: [
            { $subtract: ["$inventory.quantity", "$inventory.reserved"] },
            "$inventory.lowStockThreshold",
          ],
        },
      },
    ];
  }

  // Attributes filter (dynamic product attributes)
  if (attributes && Object.keys(attributes).length > 0) {
    Object.entries(attributes).forEach(([key, value]) => {
      // Handle multiple values for same attribute (OR condition)
      if (Array.isArray(value)) {
        filter["attributes"] = {
          $elemMatch: {
            name: key,
            value: { $in: value },
          },
        };
      } else {
        filter["attributes"] = {
          $elemMatch: {
            name: key,
            value: value,
          },
        };
      }
    });
  }

  // Tags filter
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagList };
  }

  // Featured products filter
  if (featured !== undefined) {
    filter.isFeatured = featured === "true" || featured === true;
  }

  // Status filter (admin only)
  if (status) {
    filter.status = status;
  }

  // Determine sort order
  let sort = {};
  switch (sortBy) {
    case "price_asc":
      sort = { "price.effective": 1 };
      break;
    case "price_desc":
      sort = { "price.effective": -1 };
      break;
    case "newest":
      sort = { createdAt: -1 };
      break;
    case "rating":
      sort = { "reviews.average": -1 };
      break;
    case "popularity":
      sort = { "reviews.count": -1 };
      break;
    case "relevance":
    default:
      // If using text search, sort by text score
      if (keyword) {
        sort = { score: { $meta: "textScore" } };
      } else {
        // Default sort by featured and then by newest
        sort = { isFeatured: -1, createdAt: -1 };
      }
      break;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Execute search query
  let searchQuery = Product.find(filter);

  // Add textScore field if using keyword search
  if (keyword) {
    searchQuery = searchQuery.select({ score: { $meta: "textScore" } });
  }

  // Execute the query with pagination
  const [products, total] = await Promise.all([
    searchQuery
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("categories", "name slug"),
    Product.countDocuments(filter),
  ]);

  // Extract unique attribute values for faceted search
  const facets = await getFacetsForProducts(filter);

  return {
    products,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
    facets,
  };
};

/**
 * Get facets (filter options) based on current product set
 * @param {Object} baseFilter - Base filter used in the search
 * @returns {Promise<Object>} Facet data
 */
const getFacetsForProducts = async (baseFilter = {}) => {
  // Create a copy of the filter that doesn't include facet-specific filters
  const facetFilter = { ...baseFilter };
  
  // Remove facet-specific filters to get accurate counts
  delete facetFilter.categories;
  delete facetFilter.tags;
  delete facetFilter["attributes"];
  delete facetFilter["price.effective"];
  delete facetFilter["reviews.average"];
  
  const facetResults = await Promise.all([
    // Category facets
    Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categories",
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          count: { $size: "$products" },
        },
      },
      { $match: { count: { $gt: 0 } } },
      { $sort: { count: -1 } },
    ]),

    // Price range facets
    Product.aggregate([
      { $match: facetFilter },
      {
        $group: {
          _id: null,
          min: { $min: "$price.effective" },
          max: { $max: "$price.effective" },
        },
      },
    ]),

    // Rating facets
    Product.aggregate([
      { $match: facetFilter },
      {
        $group: {
          _id: { $floor: "$reviews.average" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]),

    // Attribute facets - get the most common attributes
    Product.aggregate([
      { $match: facetFilter },
      { $unwind: "$attributes" },
      {
        $group: {
          _id: {
            name: "$attributes.name",
            value: "$attributes.value",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: "$_id.name",
          values: {
            $push: {
              value: "$_id.value",
              count: "$count",
            },
          },
        },
      },
    ]),

    // Tag facets
    Product.aggregate([
      { $match: facetFilter },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return {
    categories: facetResults[0],
    priceRange: facetResults[1][0] || { min: 0, max: 0 },
    ratings: facetResults[2].reduce((obj, item) => {
      obj[item._id] = item.count;
      return obj;
    }, {}),
    attributes: facetResults[3],
    tags: facetResults[4],
  };
};

/**
 * Global search across multiple entities
 * @param {String} keyword - Search keyword
 * @param {Array} entities - Entities to search in (products, categories, users, orders)
 * @param {Number} limit - Maximum results per entity
 * @returns {Promise<Object>} Search results
 */
const globalSearch = async (keyword, entities = ["products"], limit = 5) => {
  const results = {};
  const promises = [];

  if (entities.includes("products")) {
    promises.push(
      Product.find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .select("name slug sku price images")
        .then((data) => {
          results.products = data;
        })
    );
  }

  if (entities.includes("categories")) {
    promises.push(
      Category.find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .select("name slug image")
        .then((data) => {
          results.categories = data;
        })
    );
  }

  if (entities.includes("users")) {
    promises.push(
      User.find(
        {
          $or: [
            { email: { $regex: keyword, $options: "i" } },
            { "profile.firstName": { $regex: keyword, $options: "i" } },
            { "profile.lastName": { $regex: keyword, $options: "i" } },
            { "profile.phone": { $regex: keyword, $options: "i" } },
          ],
        }
      )
        .limit(limit)
        .select("email profile.firstName profile.lastName profile.avatar")
        .then((data) => {
          results.users = data;
        })
    );
  }

  if (entities.includes("orders")) {
    promises.push(
      Order.find({
        $or: [
          { orderNumber: { $regex: keyword, $options: "i" } },
          // Add more order search fields as needed
        ],
      })
        .limit(limit)
        .select("orderNumber status total createdAt")
        .then((data) => {
          results.orders = data;
        })
    );
  }

  if (entities.includes("reviews")) {
    promises.push(
      Review.find(
        { 
          $or: [
            { title: { $regex: keyword, $options: "i" } },
            { content: { $regex: keyword, $options: "i" } },
          ],
        }
      )
        .limit(limit)
        .select("title rating createdAt")
        .populate("product", "name slug images")
        .populate("user", "profile.firstName profile.lastName profile.avatar")
        .then((data) => {
          results.reviews = data;
        })
    );
  }

  await Promise.all(promises);
  return results;
};

/**
 * Autocomplete search for product names
 * @param {String} query - Search query
 * @param {Number} limit - Maximum number of results
 * @returns {Promise<Array>} Autocomplete suggestions
 */
const autocompleteProducts = async (query, limit = 10) => {
  if (!query || query.length < 2) {
    return [];
  }

  return await Product.find(
    {
      $or: [
        { name: { $regex: `^${query}`, $options: "i" } },
        { name: { $regex: `\\s${query}`, $options: "i" } },
        { tags: { $regex: `^${query}`, $options: "i" } },
      ],
    },
    "name slug images.url"
  )
    .limit(limit)
    .select("name slug")
    .lean();
};

module.exports = {
  searchProducts,
  globalSearch,
  autocompleteProducts,
}; 