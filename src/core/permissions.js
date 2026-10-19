/**
 * KERYX Permissions Engine
 * Granular Role-Based Access Control (RBAC).
 */

import { DEFAULT_ROLES } from '../database/schema.js';

export class PermissionsEngine {
  static hasPermission(user, permissionId) {
    if (!user) return false;
    const roleId = user.role || 'role_volunteer';
    const role = DEFAULT_ROLES.find((r) => r.id === roleId);
    if (!role) return false;

    if (role.permissions.includes('*')) return true;
    return role.permissions.includes(permissionId);
  }

  static getRoleDefinition(roleId) {
    return DEFAULT_ROLES.find((r) => r.id === roleId) || DEFAULT_ROLES[DEFAULT_ROLES.length - 1];
  }
}

