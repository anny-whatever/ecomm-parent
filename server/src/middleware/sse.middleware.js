const logger = require('../config/logger');

/**
 * Middleware to prepare response for Server-Sent Events (SSE)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sseMiddleware = (req, res, next) => {
  // Disable request timeout
  req.socket.setTimeout(0);

  // Set necessary headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevents Nginx from buffering the response

  // Set client-specific headers for cross-domain issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Send initial comment to establish connection
  res.write(': connected\n\n');

  // Handle client disconnect
  req.on('close', () => {
    logger.info('SSE: Client connection closed');
    res.end();
  });

  // Make the response object SSE-friendly
  // Add helpers for sending events
  res.sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send a comment (ignored by EventSource but keeps connection alive)
  res.sendComment = (comment) => {
    res.write(`: ${comment}\n\n`);
  };

  // Send a plain data message (without an event type)
  res.sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Continue to route handler
  next();
};

module.exports = sseMiddleware; 