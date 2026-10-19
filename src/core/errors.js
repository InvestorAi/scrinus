/**
 * KERYX Error & Isolation Boundaries
 * Ensures presentation engine remains unaffected by AI, network, or external failures.
 */

import { eventBus } from './eventBus.js';

export class SafeBoundary {
  static runSafe(operationName, fn, fallback = null) {
    try {
      return fn();
    } catch (error) {
      console.error(`[KERYX ERROR BOUNDARY] Non-fatal failure in "${operationName}":`, error);
      eventBus.emit('toast:notify', {
        type: 'warning',
        title: `${operationName} Warning`,
        message: error.message || 'Operation failed safely without disrupting live presentation.'
      });
      return fallback;
    }
  }

  static async runSafeAsync(operationName, asyncFn, fallback = null) {
    try {
      return await asyncFn();
    } catch (error) {
      console.error(`[KERYX ERROR BOUNDARY] Non-fatal async failure in "${operationName}":`, error);
      eventBus.emit('toast:notify', {
        type: 'warning',
        title: `${operationName} Warning`,
        message: error.message || 'Background service error; live presentation remains active.'
      });
      return fallback;
    }
  }
}

