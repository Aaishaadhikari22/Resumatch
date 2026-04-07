import { rolePermissions } from "../config/roles.js";

/**
 * Check if a role has a specific permission
 * @param {string} role - The admin role
 * @param {string} permission - The permission to check
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - The admin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if role has any of the permissions
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - The admin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if role has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - The admin role
 * @returns {string[]} - Array of permissions
 */
export const getPermissions = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Get all available roles
 * @returns {string[]} - Array of all role names
 */
export const getAllRoles = () => {
  return Object.keys(rolePermissions);
};
