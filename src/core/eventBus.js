/**
 * KERYX Central Pub/Sub Event Bus
 * Decoupled reactive event dispatch for live broadcasting, state stores, and UI notifications.
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName).add(callback);

    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;
    const callbacks = this.events.get(eventName);
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName
   * @param {Function} callback
   */
  once(eventName, callback) {
    const wrapped = (payload) => {
      this.off(eventName, wrapped);
      callback(payload);
    };
    this.on(eventName, wrapped);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName
   * @param {any} payload
   */
  emit(eventName, payload) {
    if (!this.events.has(eventName)) return;
    const callbacks = Array.from(this.events.get(eventName));
    callbacks.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus Error] Exception in handler for "${eventName}":`, err);
      }
    });
  }

  /**
   * Clear all event subscribers
   */
  clear() {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

