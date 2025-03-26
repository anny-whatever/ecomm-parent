// src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const passport = require("./config/passport");

// Import middleware
const errorMiddleware = require("./middleware/error.middleware");
const loggerMiddleware = require("./middleware/logger.middleware");

// Import config
const corsOptions = require("./config/corsOptions");
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = process.env;

// Import routes
const routes = require("./api");

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors(corsOptions));

// Limit requests from same IP
const limiter = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default 15 minutes
  max: parseInt(RATE_LIMIT_MAX) || 100, // Default limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again later",
});

// Apply rate limiting to all API routes
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Initialize Passport
app.use(passport.initialize());

// Request logger
app.use(loggerMiddleware);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use(`/api/${process.env.API_VERSION || "v1"}`, routes);

// Root route
app.get("/", (req, res) => {
  res.send("E-commerce API is running. See documentation for endpoints.");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
