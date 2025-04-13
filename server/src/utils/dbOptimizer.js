const mongoose = require("mongoose");
const logger = require("../config/logger");

/**
 * Database Query Optimization Utilities
 * Contains functions to optimize MongoDB queries and improve performance
 */

/**
 * Create a lean query from a mongoose query to improve performance
 * Lean queries return plain JavaScript objects instead of Mongoose documents
 * @param {Object} query - Mongoose query object
 * @returns {Object} Optimized lean query
 */
const leanQuery = (query) => {
  return query.lean();
};

/**
 * Optimize query projection to only select necessary fields
 * @param {Object} query - Mongoose query object
 * @param {Array|String} fields - Fields to include in projection
 * @returns {Object} Query with projection applied
 */
const selectFields = (query, fields) => {
  return query.select(fields);
};

/**
 * Apply efficient pagination to a query
 * @param {Object} query - Mongoose query object
 * @param {Number} page - Page number (1-based)
 * @param {Number} limit - Results per page
 * @returns {Object} Query with pagination applied
 */
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/**
 * Analyze a MongoDB query and provide optimization suggestions
 * @param {Object} query - Mongoose query object
 * @returns {Promise<Object>} Analysis result with suggestions
 */
const analyzeQuery = async (query) => {
  try {
    // Get the MongoDB collection being queried
    const collection = query.mongooseCollection.collectionName;

    // Get the query conditions and options
    const conditions = query.getQuery();
    const options = query.getOptions();

    // Create explain plan using MongoDB's explain method
    const explainPlan = await query.explain("executionStats");

    // Extract useful metrics from explain plan
    const executionStats = explainPlan.executionStats;
    const queryPlanner = explainPlan.queryPlanner;

    // Analyze the query plan
    const analysis = {
      collection,
      conditions,
      executionTimeMs: executionStats.executionTimeMillis,
      totalDocsExamined: executionStats.totalDocsExamined,
      totalDocsReturned: executionStats.nReturned,
      indexesUsed: [],
      usedIndex: false,
      suggestedIndexes: [],
      suggestions: [],
    };

    // Check if an index was used
    if (
      queryPlanner.winningPlan.inputStage &&
      queryPlanner.winningPlan.inputStage.indexName
    ) {
      analysis.usedIndex = true;
      analysis.indexesUsed.push(queryPlanner.winningPlan.inputStage.indexName);
    } else if (queryPlanner.winningPlan.stage === "COLLSCAN") {
      analysis.usedIndex = false;
      analysis.suggestions.push(
        "Query is performing a full collection scan. Consider adding an index."
      );
    }

    // Check index efficiency
    if (executionStats.totalDocsExamined > executionStats.nReturned * 3) {
      analysis.suggestions.push(
        `Low query efficiency: examined ${executionStats.totalDocsExamined} docs to return ${executionStats.nReturned} docs.`
      );
    }

    // Check if sort operation is using an index
    if (options.sort && !analysis.usedIndex) {
      analysis.suggestions.push(
        "Sorting is not using an index, which can be inefficient for large datasets."
      );

      // Suggest an index for the sort fields
      const sortFields = Object.keys(options.sort).map((field) => {
        return `${field}: ${options.sort[field] === 1 ? 1 : -1}`;
      });

      analysis.suggestedIndexes.push(`{ ${sortFields.join(", ")} }`);
    }

    // Suggest indexes for common query patterns
    Object.keys(conditions).forEach((field) => {
      if (
        !field.startsWith("$") &&
        !analysis.indexesUsed.includes(field) &&
        field !== "_id"
      ) {
        analysis.suggestedIndexes.push(`{ ${field}: 1 }`);
      }
    });

    // Check if there's a high ratio of docs examined vs. returned
    if (executionStats.totalDocsExamined > 0) {
      const efficiency =
        executionStats.nReturned / executionStats.totalDocsExamined;
      analysis.efficiency = parseFloat((efficiency * 100).toFixed(2));

      if (efficiency < 0.2) {
        analysis.suggestions.push(
          "Query efficiency is very low. Consider refining your query or creating a compound index."
        );
      }
    }

    return analysis;
  } catch (error) {
    logger.error("Error analyzing query:", error);
    throw error;
  }
};

/**
 * Create a compound index builder to easily create multi-field indexes
 * @param {Object} model - Mongoose model
 * @returns {Object} Compound index builder
 */
const createCompoundIndex = (model) => {
  return {
    /**
     * Create a compound index on the model
     * @param {Object} fields - Object with field names and sort orders (1 or -1)
     * @param {Object} options - Index options
     * @returns {Promise<Object>} Result of index creation
     */
    create: async (fields, options = {}) => {
      try {
        const result = await model.collection.createIndex(fields, options);
        logger.info(
          `Created compound index on ${model.modelName}: ${JSON.stringify(
            fields
          )}`
        );
        return result;
      } catch (error) {
        logger.error(
          `Error creating compound index on ${model.modelName}:`,
          error
        );
        throw error;
      }
    },

    /**
     * Create a text index for full-text search
     * @param {Array|Object} fields - Field names or object with field weights
     * @param {Object} options - Index options
     * @returns {Promise<Object>} Result of index creation
     */
    createText: async (fields, options = {}) => {
      try {
        let textIndexFields = {};

        if (Array.isArray(fields)) {
          fields.forEach((field) => {
            textIndexFields[field] = "text";
          });
        } else {
          // If fields is an object, assume it contains field weights
          Object.keys(fields).forEach((field) => {
            textIndexFields[field] = "text";
          });
          options.weights = fields;
        }

        const result = await model.collection.createIndex(
          textIndexFields,
          options
        );
        logger.info(
          `Created text index on ${model.modelName}: ${JSON.stringify(
            textIndexFields
          )}`
        );
        return result;
      } catch (error) {
        logger.error(`Error creating text index on ${model.modelName}:`, error);
        throw error;
      }
    },
  };
};

/**
 * Create a batch operations handler for efficient bulk operations
 * @param {Object} model - Mongoose model
 * @param {Number} batchSize - Size of each batch (default: 1000)
 * @returns {Object} Batch operations handler
 */
const batchOperations = (model, batchSize = 1000) => {
  return {
    /**
     * Process documents in batches to avoid memory issues
     * @param {Function} queryFn - Function that returns a query to get documents
     * @param {Function} processFn - Function to process each document
     * @returns {Promise<Object>} Result of batch processing
     */
    process: async (queryFn, processFn) => {
      try {
        const stats = {
          totalProcessed: 0,
          batches: 0,
          errors: 0,
        };

        let hasMore = true;
        let lastId = null;

        while (hasMore) {
          // Create a query with _id pagination for efficient batching
          let query = queryFn();

          if (lastId) {
            query = query.where("_id").gt(lastId);
          }

          // Get batch of documents, sorted by _id for consistent pagination
          const batch = await query.sort({ _id: 1 }).limit(batchSize).lean();

          // If batch is empty, we're done
          if (batch.length === 0) {
            hasMore = false;
            continue;
          }

          // Process each document in the batch
          for (const doc of batch) {
            try {
              await processFn(doc);
              stats.totalProcessed++;
            } catch (error) {
              logger.error(`Error processing document ${doc._id}:`, error);
              stats.errors++;
            }
          }

          // Update lastId for next batch
          lastId = batch[batch.length - 1]._id;
          stats.batches++;

          logger.debug(
            `Processed batch #${stats.batches} with ${batch.length} documents`
          );
        }

        return stats;
      } catch (error) {
        logger.error("Error in batch processing:", error);
        throw error;
      }
    },

    /**
     * Perform bulk inserts in batches
     * @param {Array} documents - Documents to insert
     * @returns {Promise<Object>} Result of bulk insert
     */
    bulkInsert: async (documents) => {
      try {
        const stats = {
          totalInserted: 0,
          batches: 0,
          errors: 0,
        };

        // Process in batches
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);

          try {
            const result = await model.insertMany(batch, { ordered: false });
            stats.totalInserted += result.length;
          } catch (error) {
            // With ordered: false, some documents might still be inserted even if there are errors
            if (error.insertedDocs && error.insertedDocs.length) {
              stats.totalInserted += error.insertedDocs.length;
            }
            stats.errors++;
            logger.error(
              `Error in bulk insert batch #${stats.batches + 1}:`,
              error
            );
          }

          stats.batches++;
          logger.debug(
            `Processed insert batch #${stats.batches} with ${batch.length} documents`
          );
        }

        return stats;
      } catch (error) {
        logger.error("Error in bulk insert:", error);
        throw error;
      }
    },
  };
};

/**
 * Apply optimal read preference for queries
 * @param {Object} query - Mongoose query object
 * @param {String} readPreference - Read preference (primary, primaryPreferred, secondary, secondaryPreferred, nearest)
 * @returns {Object} Query with read preference applied
 */
const setReadPreference = (query, readPreference = "secondaryPreferred") => {
  return query.read(readPreference);
};

/**
 * Create an efficient aggregation pipeline with optimization hints
 * @param {Object} model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline stages
 * @param {Object} options - Aggregation options
 * @returns {Object} Optimized aggregation
 */
const optimizedAggregation = (model, pipeline, options = {}) => {
  // Apply default optimization options
  const optimizedOptions = {
    allowDiskUse: true, // Allow using disk for large aggregations
    maxTimeMS: options.maxTimeMS || 60000, // Default timeout of 60 seconds
    ...options,
  };

  // Create the aggregation
  const aggregation = model.aggregate(pipeline, optimizedOptions);

  // If option is set, get the explanation plan in debug mode
  if (options.explainQuery) {
    logger.debug("Aggregation pipeline explanation:");
    aggregation.explain((err, result) => {
      if (err) {
        logger.error("Error explaining aggregation:", err);
      } else {
        logger.debug(JSON.stringify(result, null, 2));
      }
    });
  }

  return aggregation;
};

/**
 * Create time-bucketed queries for data spanning large time ranges
 * @param {Object} model - Mongoose model
 * @param {String} timeField - Field containing the timestamp
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} bucketSize - Size of each time bucket (day, week, month)
 * @param {Function} queryBuilder - Function to build the base query
 * @param {Function} resultProcessor - Function to process and merge results
 * @returns {Promise<Array>} Combined results from all time buckets
 */
const timeRangeQuery = async (
  model,
  timeField,
  startDate,
  endDate,
  bucketSize = "day",
  queryBuilder,
  resultProcessor
) => {
  try {
    // Create time buckets
    const buckets = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate < end) {
      const bucketEnd = new Date(currentDate);

      // Set bucket end date based on bucket size
      switch (bucketSize) {
        case "day":
          bucketEnd.setDate(bucketEnd.getDate() + 1);
          break;
        case "week":
          bucketEnd.setDate(bucketEnd.getDate() + 7);
          break;
        case "month":
          bucketEnd.setMonth(bucketEnd.getMonth() + 1);
          break;
        default:
          bucketEnd.setDate(bucketEnd.getDate() + 1);
      }

      // Ensure bucketEnd doesn't exceed the overall end date
      if (bucketEnd > end) {
        bucketEnd.setTime(end.getTime());
      }

      buckets.push({
        start: new Date(currentDate),
        end: new Date(bucketEnd),
      });

      currentDate = bucketEnd;
    }

    // Process each bucket
    const results = [];

    for (const bucket of buckets) {
      // Build query for this bucket
      const query = queryBuilder(model);

      // Add time filter
      query.where(timeField).gte(bucket.start).lt(bucket.end);

      // Execute query
      const bucketResults = await query.lean().exec();

      // Process results if needed
      if (resultProcessor) {
        const processedResults = resultProcessor(bucketResults, bucket);
        results.push(processedResults);
      } else {
        results.push(...bucketResults);
      }
    }

    return results;
  } catch (error) {
    logger.error("Error executing time range query:", error);
    throw error;
  }
};

/**
 * Optimize connection pooling for MongoDB
 * @returns {Object} Connection optimization settings
 */
const optimizeConnectionPooling = () => {
  // Set optimal MongoDB connection pool size
  const poolSize = Math.min(100, require("os").cpus().length * 5);

  // Apply settings to mongoose connection if it exists
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.client.db
      .admin()
      .command({
        setParameter: 1,
        maxConnecting: Math.ceil(poolSize / 5),
      })
      .catch((err) => logger.error("Error setting maxConnecting:", err));
  }

  return {
    poolSize,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    maxConnecting: Math.ceil(poolSize / 5),
  };
};

module.exports = {
  leanQuery,
  selectFields,
  paginate,
  analyzeQuery,
  createCompoundIndex,
  batchOperations,
  setReadPreference,
  optimizedAggregation,
  timeRangeQuery,
  optimizeConnectionPooling,
};
