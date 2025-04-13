// src/services/content.service.js
const Content = require("../models/content.model");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
} = require("../utils/errorTypes");
const logger = require("../config/logger");
const slugify = require("slugify");

/**
 * Create a new content item
 * @param {Object} contentData - Content data
 * @returns {Promise<Object>} Created content
 */
const createContent = async (contentData) => {
  try {
    // Generate a slug if not provided
    if (!contentData.slug) {
      contentData.slug = slugify(contentData.title, {
        lower: true,
        strict: true,
      });
    }

    // Check if slug is unique for this content type
    const existingContent = await Content.findOne({
      slug: contentData.slug,
      type: contentData.type,
    });

    if (existingContent) {
      throw new ConflictError(
        `A ${contentData.type} with this slug already exists`
      );
    }

    // If this is marked as homepage, ensure no other page is set as homepage
    if (contentData.isHomepage) {
      await Content.updateMany(
        { isHomepage: true },
        { $set: { isHomepage: false } }
      );
    }

    // If publishing now, set publishedAt date
    if (contentData.status === "published" && !contentData.publishedAt) {
      contentData.publishedAt = new Date();
    }

    // Create the content
    const content = new Content(contentData);
    await content.save();

    return content;
  } catch (error) {
    logger.error("Error creating content:", error);
    throw error;
  }
};

/**
 * Get content by ID
 * @param {String} contentId - Content ID
 * @returns {Promise<Object>} Content object
 */
const getContentById = async (contentId) => {
  try {
    const content = await Content.findById(contentId).populate(
      "author",
      "email profile.firstName profile.lastName"
    );

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    return content;
  } catch (error) {
    logger.error(`Error getting content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Get content by slug and type
 * @param {String} slug - Content slug
 * @param {String} type - Content type
 * @returns {Promise<Object>} Content object
 */
const getContentBySlug = async (slug, type = "page") => {
  try {
    const content = await Content.findOne({
      slug,
      type,
      status: "published",
    }).populate("author", "email profile.firstName profile.lastName");

    if (!content) {
      throw new NotFoundError(
        `${type.charAt(0).toUpperCase() + type.slice(1)} not found`
      );
    }

    // Increment view count
    content.viewCount += 1;
    await content.save();

    return content;
  } catch (error) {
    logger.error(`Error getting content by slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Get homepage content
 * @returns {Promise<Object>} Homepage content
 */
const getHomepage = async () => {
  try {
    const homepage = await Content.findOne({
      isHomepage: true,
      status: "published",
    }).populate("author", "email profile.firstName profile.lastName");

    if (!homepage) {
      throw new NotFoundError("Homepage not found");
    }

    // Increment view count
    homepage.viewCount += 1;
    await homepage.save();

    return homepage;
  } catch (error) {
    logger.error("Error getting homepage:", error);
    throw error;
  }
};

/**
 * Update content
 * @param {String} contentId - Content ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated content
 */
const updateContent = async (contentId, updateData) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    // Check slug uniqueness if changing
    if (updateData.slug && updateData.slug !== content.slug) {
      const existingContent = await Content.findOne({
        slug: updateData.slug,
        type: updateData.type || content.type,
        _id: { $ne: contentId },
      });

      if (existingContent) {
        throw new ConflictError(
          `A ${updateData.type || content.type} with this slug already exists`
        );
      }
    }

    // If changing to published status, set publishedAt date
    if (
      updateData.status === "published" &&
      content.status !== "published" &&
      !updateData.publishedAt
    ) {
      updateData.publishedAt = new Date();
    }

    // If setting as homepage, ensure no other page is homepage
    if (updateData.isHomepage && !content.isHomepage) {
      await Content.updateMany(
        { isHomepage: true, _id: { $ne: contentId } },
        { $set: { isHomepage: false } }
      );
    }

    // Update the content
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "email profile.firstName profile.lastName");

    return updatedContent;
  } catch (error) {
    logger.error(`Error updating content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Delete content
 * @param {String} contentId - Content ID
 * @returns {Promise<Boolean>} Success status
 */
const deleteContent = async (contentId) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    await Content.findByIdAndDelete(contentId);
    return true;
  } catch (error) {
    logger.error(`Error deleting content ${contentId}:`, error);
    throw error;
  }
};

/**
 * List content with filtering, pagination and sorting
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Content list with pagination info
 */
const listContent = async (filters = {}, options = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.author) {
      query.author = filters.author;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Date range filter
    if (filters.fromDate || filters.toDate) {
      query.createdAt = {};

      if (filters.fromDate) {
        query.createdAt.$gte = new Date(filters.fromDate);
      }

      if (filters.toDate) {
        query.createdAt.$lte = new Date(filters.toDate);
      }
    }

    // Menu or footer filter
    if (filters.includeInMenu === "true") {
      query.includeInMenu = true;
    }

    if (filters.includeInFooter === "true") {
      query.includeInFooter = true;
    }

    // Set up pagination
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Set up sorting
    let sort = {};
    if (options.sortBy) {
      if (options.sortBy.startsWith("-")) {
        sort[options.sortBy.substring(1)] = -1;
      } else {
        sort[options.sortBy] = 1;
      }
    } else {
      // Default sort by newest first
      sort = { createdAt: -1 };
    }

    // Execute query
    const contentList = await Content.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "email profile.firstName profile.lastName");

    // Get total count
    const total = await Content.countDocuments(query);

    return {
      content: contentList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error listing content:", error);
    throw error;
  }
};

/**
 * Get categories list from existing content
 * @param {String} type - Content type
 * @returns {Promise<Array>} Categories list
 */
const getContentCategories = async (type = "post") => {
  try {
    const categories = await Content.distinct("category", {
      type,
      category: { $ne: null, $ne: "" },
    });

    return categories.filter(Boolean).sort();
  } catch (error) {
    logger.error(`Error getting ${type} categories:`, error);
    throw error;
  }
};

/**
 * Get tags list from existing content
 * @param {String} type - Content type
 * @returns {Promise<Array>} Tags list
 */
const getContentTags = async (type = "post") => {
  try {
    const content = await Content.find({
      type,
      tags: { $exists: true, $not: { $size: 0 } },
    }).select("tags");

    // Flatten and get unique tags
    const allTags = content.reduce((tags, item) => [...tags, ...item.tags], []);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  } catch (error) {
    logger.error(`Error getting ${type} tags:`, error);
    throw error;
  }
};

/**
 * Get recent published content
 * @param {String} type - Content type
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Recent content
 */
const getRecentContent = async (type = "post", limit = 5) => {
  try {
    return await Content.findRecent(type, limit);
  } catch (error) {
    logger.error(`Error getting recent ${type}:`, error);
    throw error;
  }
};

/**
 * Get popular content based on view count
 * @param {String} type - Content type
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Popular content
 */
const getPopularContent = async (type = "post", limit = 5) => {
  try {
    return await Content.findPopular(type, limit);
  } catch (error) {
    logger.error(`Error getting popular ${type}:`, error);
    throw error;
  }
};

/**
 * Get related content
 * @param {String} contentId - Content ID
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>} Related content
 */
const getRelatedContent = async (contentId, limit = 3) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    // Get content with the same category and tags
    const query = {
      _id: { $ne: contentId },
      type: content.type,
      status: "published",
      $or: [],
    };

    if (content.category) {
      query.$or.push({ category: content.category });
    }

    if (content.tags && content.tags.length > 0) {
      query.$or.push({ tags: { $in: content.tags } });
    }

    // If no category or tags, just get latest content of same type
    if (query.$or.length === 0) {
      delete query.$or;
    }

    const relatedContent = await Content.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select("title slug excerpt featuredImage publishedAt");

    return relatedContent;
  } catch (error) {
    logger.error(`Error getting related content for ${contentId}:`, error);
    throw error;
  }
};

/**
 * Get blog posts with advanced filtering and categorization
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Posts with pagination data
 */
const getBlogPosts = async (filters = {}, options = {}) => {
  try {
    const query = { type: "post", status: "published" };

    // Add publishedAt filter - only show posts that are published now or in the past
    query.publishedAt = { $lte: new Date() };

    // Apply category filter if provided
    if (filters.category) {
      query.categories = filters.category;
    }

    // Apply tag filter if provided
    if (filters.tag) {
      query.tags = filters.tag;
    }

    // Apply author filter if provided
    if (filters.author) {
      query.author = filters.author;
    }

    // Apply featured filter if provided
    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    // Apply search filter if provided
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { excerpt: { $regex: filters.search, $options: "i" } },
        { content: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Set up pagination options
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    // Set up sorting options
    let sort = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    } else {
      // Default sort by publish date, newest first
      sort = { publishedAt: -1 };
    }

    // Execute query with pagination
    const posts = await Content.find(query)
      .populate(
        "author",
        "email profile.firstName profile.lastName profile.avatar"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Content.countDocuments(query);

    // Format posts for response
    const formattedPosts = posts.map((post) => formatBlogPost(post));

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting blog posts:", error);
    throw error;
  }
};

/**
 * Format a blog post for API response
 * @param {Object} post - Raw post document
 * @returns {Object} Formatted post
 */
const formatBlogPost = (post) => {
  return {
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured: post.featured || false,
    featuredImage: post.featuredImage,
    categories: post.categories || [],
    tags: post.tags || [],
    author: post.author
      ? {
          id: post.author._id,
          name: `${post.author.profile?.firstName || ""} ${
            post.author.profile?.lastName || ""
          }`.trim(),
          avatar: post.author.profile?.avatar,
        }
      : null,
    publishedAt: post.publishedAt,
    readTime: calculateReadTime(post.content),
    viewCount: post.viewCount || 0,
    commentCount: post.commentCount || 0,
  };
};

/**
 * Calculate estimated reading time for a blog post
 * @param {String} content - Post content
 * @returns {Number} Reading time in minutes
 */
const calculateReadTime = (content) => {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;

  // Count words in content, handling HTML tags
  const plainText = content.replace(/<[^>]*>/g, " ");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // Calculate reading time in minutes
  const readTime = Math.ceil(wordCount / wordsPerMinute);

  // Return at least 1 minute
  return Math.max(1, readTime);
};

/**
 * Get blog categories with post counts
 * @returns {Promise<Array>} Categories with post counts
 */
const getBlogCategories = async () => {
  try {
    // Find all published posts
    const posts = await Content.find({
      type: "post",
      status: "published",
      publishedAt: { $lte: new Date() },
    }).select("categories");

    // Count posts in each category
    const categoryCounts = {};

    posts.forEach((post) => {
      if (post.categories && post.categories.length > 0) {
        post.categories.forEach((category) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    // Format as array of objects
    const categories = Object.keys(categoryCounts).map((category) => ({
      name: category,
      count: categoryCounts[category],
      slug: category.toLowerCase().replace(/\s+/g, "-"),
    }));

    // Sort by post count (descending)
    return categories.sort((a, b) => b.count - a.count);
  } catch (error) {
    logger.error("Error getting blog categories:", error);
    throw error;
  }
};

/**
 * Get related blog posts based on categories and tags
 * @param {String} postId - Current post ID
 * @param {Number} limit - Number of related posts to return
 * @returns {Promise<Array>} Related posts
 */
const getRelatedBlogPosts = async (postId, limit = 3) => {
  try {
    // Get current post
    const currentPost = await Content.findById(postId);

    if (!currentPost || currentPost.type !== "post") {
      throw new NotFoundError("Blog post not found");
    }

    // Get categories and tags from current post
    const categories = currentPost.categories || [];
    const tags = currentPost.tags || [];

    // Find related posts based on categories and tags
    const relatedPosts = await Content.find({
      _id: { $ne: postId }, // Exclude current post
      type: "post",
      status: "published",
      publishedAt: { $lte: new Date() },
      $or: [{ categories: { $in: categories } }, { tags: { $in: tags } }],
    })
      .populate(
        "author",
        "email profile.firstName profile.lastName profile.avatar"
      )
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    // Format related posts
    return relatedPosts.map((post) => formatBlogPost(post));
  } catch (error) {
    logger.error(`Error getting related posts for ${postId}:`, error);
    throw error;
  }
};

/**
 * Schedule content for future publishing
 * @param {String} contentId - Content ID
 * @param {Date} publishDate - Future publish date
 * @returns {Promise<Object>} Updated content
 */
const scheduleContent = async (contentId, publishDate) => {
  try {
    // Validate publish date is in the future
    const pubDate = new Date(publishDate);
    const now = new Date();

    if (pubDate <= now) {
      throw new BadRequestError("Publish date must be in the future");
    }

    // Get content
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    // Update content
    content.status = "scheduled";
    content.publishedAt = pubDate;
    await content.save();

    // Schedule publishing task
    const schedulerService = require("./scheduler.service");
    const taskId = `publish_content_${content._id}`;

    // Calculate time difference in milliseconds
    const timeUntilPublish = pubDate.getTime() - now.getTime();

    // Convert to minutes for cron (minimum 1 minute in the future)
    const minutesUntilPublish = Math.max(
      1,
      Math.ceil(timeUntilPublish / (1000 * 60))
    );

    // Create a cron expression for the specific date and time
    const cronDate = pubDate;
    const cronExpression = `${cronDate.getMinutes()} ${cronDate.getHours()} ${cronDate.getDate()} ${
      cronDate.getMonth() + 1
    } *`;

    schedulerService.scheduleTask(taskId, cronExpression, async () => {
      try {
        logger.info(
          `Publishing scheduled content: ${content.title} (${content._id})`
        );
        await publishScheduledContent(content._id);
      } catch (error) {
        logger.error(
          `Error publishing scheduled content ${content._id}:`,
          error
        );
      }
    });

    logger.info(
      `Content scheduled for publishing: ${
        content.title
      } on ${pubDate.toISOString()}`
    );

    return content;
  } catch (error) {
    logger.error(`Error scheduling content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Publish scheduled content
 * @param {String} contentId - Content ID
 * @returns {Promise<Object>} Published content
 */
const publishScheduledContent = async (contentId) => {
  try {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new NotFoundError("Content not found");
    }

    if (content.status !== "scheduled") {
      logger.warn(
        `Content ${contentId} is not in scheduled status, current status: ${content.status}`
      );
      return content;
    }

    // Update status to published
    content.status = "published";

    // If publishedAt is in the future (might happen if task runs early), set it to now
    if (content.publishedAt > new Date()) {
      content.publishedAt = new Date();
    }

    await content.save();

    logger.info(`Content published: ${content.title} (${content._id})`);

    return content;
  } catch (error) {
    logger.error(`Error publishing scheduled content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Get scheduled content
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Scheduled content with pagination
 */
const getScheduledContent = async (filters = {}, options = {}) => {
  try {
    const query = { status: "scheduled" };

    // Apply type filter if provided
    if (filters.type) {
      query.type = filters.type;
    }

    // Apply author filter if provided
    if (filters.author) {
      query.author = filters.author;
    }

    // Set up pagination options
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    // Set up sorting options (default by publish date, ascending)
    const sort = { publishedAt: 1 };

    // Execute query with pagination
    const scheduledContent = await Content.find(query)
      .populate("author", "email profile.firstName profile.lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Content.countDocuments(query);

    return {
      content: scheduledContent,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting scheduled content:", error);
    throw error;
  }
};

/**
 * Create a landing page for marketing campaigns
 * @param {Object} pageData - Landing page data
 * @returns {Promise<Object>} Created landing page
 */
const createLandingPage = async (pageData) => {
  try {
    // Ensure required fields
    if (!pageData.title) {
      throw new BadRequestError("Title is required");
    }

    if (!pageData.sections || !Array.isArray(pageData.sections)) {
      throw new BadRequestError("Page sections are required");
    }

    // Generate slug if not provided
    if (!pageData.slug) {
      pageData.slug = slugify(pageData.title, {
        lower: true,
        strict: true,
      });
    }

    // Add landing page specific data
    const landingPageData = {
      ...pageData,
      type: "landing_page",
      status: pageData.status || "draft",
      metadata: {
        ...pageData.metadata,
        isLandingPage: true,
        campaign: pageData.campaign || null,
        template: pageData.template || "default",
        conversionGoal: pageData.conversionGoal || null,
      },
    };

    // Create the landing page
    const landingPage = await createContent(landingPageData);

    return landingPage;
  } catch (error) {
    logger.error("Error creating landing page:", error);
    throw error;
  }
};

/**
 * Get landing page analytics
 * @param {String} pageId - Landing page ID
 * @param {Object} options - Analytics options
 * @returns {Promise<Object>} Landing page analytics
 */
const getLandingPageAnalytics = async (pageId, options = {}) => {
  try {
    const page = await Content.findById(pageId);

    if (!page || page.type !== "landing_page") {
      throw new NotFoundError("Landing page not found");
    }

    // Analytics would typically come from an analytics service
    // This is a placeholder for that integration
    return {
      pageId: page._id,
      title: page.title,
      views: page.viewCount || 0,
      uniqueVisitors: Math.round((page.viewCount || 0) * 0.7), // Simulated unique visitors
      conversionRate: 3.5, // Simulated conversion rate
      averageTimeOnPage: "2:15", // Simulated average time
      bounceRate: 45.2, // Simulated bounce rate
      topReferrers: [
        { source: "Google", visits: 120 },
        { source: "Facebook", visits: 85 },
        { source: "Email Campaign", visits: 67 },
      ],
      deviceBreakdown: {
        desktop: 65,
        mobile: 30,
        tablet: 5,
      },
    };
  } catch (error) {
    logger.error(`Error getting landing page analytics for ${pageId}:`, error);
    throw error;
  }
};

module.exports = {
  createContent,
  getContentById,
  getContentBySlug,
  getHomepage,
  updateContent,
  deleteContent,
  listContent,
  getContentCategories,
  getContentTags,
  getRecentContent,
  getPopularContent,
  getRelatedContent,
  getBlogPosts,
  formatBlogPost,
  calculateReadTime,
  getBlogCategories,
  getRelatedBlogPosts,
  scheduleContent,
  publishScheduledContent,
  getScheduledContent,
  createLandingPage,
  getLandingPageAnalytics,
};
