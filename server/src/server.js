// src/server.js
require("dotenv").config();
const app = require("./app");
const logger = require("./config/logger");
const connectDB = require("./config/database");

// Environment variables
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(
    `API available at http://localhost:${PORT}/api/${process.env.API_VERSION}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down...");
  logger.error(err.name, err.message);

  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

module.exports = server;
