const logger = require('../config/logger');

/**
 * Server-Sent Events (SSE) Manager
 * Manages client connections and event dispatching
 */
class SSEManager {
  constructor() {
    // Maps client IDs to client objects
    this.clients = new Map();
    // Maps user IDs to client IDs
    this.userConnections = new Map();
    // Maps roles to client IDs
    this.roleConnections = new Map();
    // Client heartbeat interval (milliseconds)
    this.heartbeatInterval = 30000;
  }

  /**
   * Initialize a new client connection
   * @param {string} clientId - Unique ID for the client
   * @param {Object} res - Express response object
   * @param {Object} options - Connection options
   * @returns {Object} Client object
   */
  initConnection(clientId, res, options = {}) {
    const { userId, role } = options;

    // Configure SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disables buffering for Nginx proxy
    });

    // Initialize connection with a comment to establish connection
    res.write(':ok\n\n');

    // Create client object
    const client = {
      id: clientId,
      userId,
      role,
      response: res,
      isConnected: true,
      connectedAt: new Date(),
      lastEventAt: new Date(),
      filters: options.filters || {},
    };

    // Store client
    this.clients.set(clientId, client);

    // Map user ID to client ID if available
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(clientId);
    }

    // Map role to client ID if available
    if (role) {
      if (!this.roleConnections.has(role)) {
        this.roleConnections.set(role, new Set());
      }
      this.roleConnections.get(role).add(clientId);
    }

    // Set up heartbeat interval to keep the connection alive
    const heartbeatId = setInterval(() => {
      this.sendHeartbeat(clientId);
    }, this.heartbeatInterval);

    // Store heartbeat interval ID so we can clear it later
    client.heartbeatId = heartbeatId;

    // Log connection
    logger.info(`SSE client connected: ${clientId}${userId ? `, User: ${userId}` : ''}${role ? `, Role: ${role}` : ''}`);

    return client;
  }

  /**
   * Send heartbeat to client to keep connection alive
   * @param {string} clientId - ID of the client to send heartbeat to
   */
  sendHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (client && client.isConnected) {
      try {
        client.response.write(':heartbeat\n\n');
      } catch (error) {
        logger.error(`Error sending heartbeat to client ${clientId}:`, error);
        this.closeConnection(clientId);
      }
    }
  }

  /**
   * Send event to a specific client
   * @param {string} clientId - ID of the client to send event to
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  sendEventToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.isConnected) {
      return false;
    }

    try {
      const eventString = `event: ${eventType}\n`;
      const dataString = `data: ${JSON.stringify(data)}\n\n`;
      
      client.response.write(eventString + dataString);
      client.lastEventAt = new Date();
      return true;
    } catch (error) {
      logger.error(`Error sending event to client ${clientId}:`, error);
      this.closeConnection(clientId);
      return false;
    }
  }

  /**
   * Send event to all connected clients
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @param {Function} filterFn - Optional filter function to determine which clients receive the event
   */
  broadcastEvent(eventType, data, filterFn = null) {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients.entries()) {
      // Skip disconnected clients
      if (!client.isConnected) continue;
      
      // Apply filter if provided
      if (filterFn && !filterFn(client)) continue;
      
      // Send event to client
      if (this.sendEventToClient(clientId, eventType, data)) {
        sentCount++;
      }
    }
    
    logger.debug(`Broadcast ${eventType} event to ${sentCount} clients`);
    return sentCount;
  }

  /**
   * Send event to users with specific IDs
   * @param {Array} userIds - Array of user IDs to send event to
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  sendEventToUsers(userIds, eventType, data) {
    let sentCount = 0;
    
    for (const userId of userIds) {
      const clientIds = this.userConnections.get(userId);
      if (!clientIds) continue;
      
      for (const clientId of clientIds) {
        if (this.sendEventToClient(clientId, eventType, data)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }

  /**
   * Send event to users with specific roles
   * @param {Array} roles - Array of roles to send event to
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  sendEventToRoles(roles, eventType, data) {
    let sentCount = 0;
    
    for (const role of roles) {
      const clientIds = this.roleConnections.get(role);
      if (!clientIds) continue;
      
      for (const clientId of clientIds) {
        if (this.sendEventToClient(clientId, eventType, data)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }

  /**
   * Close a client connection
   * @param {string} clientId - ID of the client connection to close
   */
  closeConnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Mark as disconnected
    client.isConnected = false;
    
    // Clear heartbeat interval
    if (client.heartbeatId) {
      clearInterval(client.heartbeatId);
    }
    
    try {
      // End response
      client.response.end();
    } catch (error) {
      logger.error(`Error closing SSE connection for client ${clientId}:`, error);
    }
    
    // Remove from user connections
    if (client.userId && this.userConnections.has(client.userId)) {
      this.userConnections.get(client.userId).delete(clientId);
      if (this.userConnections.get(client.userId).size === 0) {
        this.userConnections.delete(client.userId);
      }
    }
    
    // Remove from role connections
    if (client.role && this.roleConnections.has(client.role)) {
      this.roleConnections.get(client.role).delete(clientId);
      if (this.roleConnections.get(client.role).size === 0) {
        this.roleConnections.delete(client.role);
      }
    }
    
    // Remove from clients map
    this.clients.delete(clientId);
    
    logger.info(`SSE client disconnected: ${clientId}`);
  }

  /**
   * Get stats about current connections
   * @returns {Object} Connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      userConnections: Array.from(this.userConnections.entries()).reduce((acc, [userId, clientIds]) => {
        acc[userId] = clientIds.size;
        return acc;
      }, {}),
      roleConnections: Array.from(this.roleConnections.entries()).reduce((acc, [role, clientIds]) => {
        acc[role] = clientIds.size;
        return acc;
      }, {}),
      connectionDetails: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        role: client.role,
        isConnected: client.isConnected,
        connectedAt: client.connectedAt,
        lastEventAt: client.lastEventAt,
      })),
    };
  }

  /**
   * Clean up disconnected clients
   * @param {Function} cleanupFn - Optional function to determine if a client should be cleaned up
   * @returns {number} Number of clients removed
   */
  cleanupDisconnectedClients(cleanupFn = null) {
    let removedCount = 0;
    const clientsToRemove = [];
    
    // First pass: identify clients to remove
    for (const [clientId, client] of this.clients.entries()) {
      // If no custom function is provided, only remove clients already marked as disconnected
      if ((cleanupFn && cleanupFn(client)) || (!cleanupFn && !client.isConnected)) {
        clientsToRemove.push(clientId);
      }
    }
    
    // Second pass: remove identified clients
    for (const clientId of clientsToRemove) {
      this.closeConnection(clientId);
      removedCount++;
    }
    
    logger.info(`Cleaned up ${removedCount} SSE clients`);
    return removedCount;
  }
}

// Create singleton instance
const sseManager = new SSEManager();

module.exports = sseManager; 