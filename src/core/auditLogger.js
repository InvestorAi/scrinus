/**
 * KERYX Audit Logger
 * Records operator broadcast actions and AI detection decisions for ministry accountability.
 */

import { db } from '../database/db.js';
import { TABLE_NAMES } from '../database/schema.js';

export class AuditLogger {
  static async log({ user, action, resource, details = '', prevState = null, newState = null }) {
    const entry = {
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      userName: user ? user.name : 'System Operator',
      userRole: user ? user.role : 'System',
      action,
      resource,
      details,
      prevState,
      newState
    };

    console.log(`[KERYX AUDIT] [${entry.timestamp}] ${entry.userName} (${entry.userRole}): ${entry.action} -> ${entry.resource}`);
    try {
      await db.set(TABLE_NAMES.AUDIT_LOGS, entry);
    } catch (err) {
      console.warn('[KERYX AUDIT] Failed to persist audit log:', err);
    }
    return entry;
  }

  static async getRecent(limit = 50) {
    const logs = await db.getAll(TABLE_NAMES.AUDIT_LOGS);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
}

