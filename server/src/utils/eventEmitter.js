/**
 * Custom EventEmitter for handling application events
 * This allows different parts of the application to communicate
 * via events without direct dependencies
 */

const EventEmitter = require("events");

/**
 * Singleton event emitter instance for the application
 */
const appEventEmitter = new EventEmitter();

// Set higher limit for event listeners to avoid memory leak warnings
appEventEmitter.setMaxListeners(50);

/**
 * Static accessor for the event emitter instance
 */
class AppEvents {
  /**
   * Get the singleton event emitter instance
   *
   * @returns {EventEmitter} - The application event emitter
   */
  static get EventEmitter() {
    return appEventEmitter;
  }

  /**
   * Emit an event with data
   *
   * @param {string} eventName - Name of the event to emit
   * @param {any} data - Data to pass with the event
   */
  static emit(eventName, data) {
    appEventEmitter.emit(eventName, data);
  }

  /**
   * Register an event listener
   *
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} listener - Callback function when event occurs
   */
  static on(eventName, listener) {
    appEventEmitter.on(eventName, listener);
  }

  /**
   * Register a one-time event listener
   *
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} listener - Callback function when event occurs
   */
  static once(eventName, listener) {
    appEventEmitter.once(eventName, listener);
  }

  /**
   * Remove an event listener
   *
   * @param {string} eventName - Name of the event
   * @param {Function} listener - Listener function to remove
   */
  static off(eventName, listener) {
    appEventEmitter.off(eventName, listener);
  }

  /**
   * Remove all listeners for an event
   *
   * @param {string} eventName - Name of the event to clean up
   */
  static removeAllListeners(eventName) {
    appEventEmitter.removeAllListeners(eventName);
  }
}

module.exports = {
  EventEmitter: AppEvents,
};
