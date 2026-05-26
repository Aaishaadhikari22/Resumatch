import { rolePermissions, roleHierarchy, rolesByType, getAllRoles } from "../config/roles.js";

/**
 * Check if a role has a specific permission
 * @param {string} role - The user role
 * @param {string} permission - The permission to check
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - The user role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if role has any of the permissions
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - The user role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if role has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - The user role
 * @returns {string[]} - Array of permissions
 */
export const getPermissions = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Get all available roles
 * @returns {string[]} - Array of all role names
 */
export const getAllAvailableRoles = () => {
  return getAllRoles();
};

/**
 * Get roles by type (admin, employer, user)
 * @param {string} type - Type of roles to get (admin, employer, user)
 * @returns {string[]} - Array of role names
 */
export const getRolesByType = (type) => {
  return rolesByType[type] || [];
};

/**
 * Check if a user role is of a specific type
 * @param {string} role - The user role
 * @param {string} type - Type to check (admin, employer, user)
 * @returns {boolean} - True if role is of specified type
 */
export const isRoleType = (role, type) => {
  return rolesByType[type]?.includes(role) || false;
};

/**
 * Check if one role has higher hierarchy than another
 * Used for admin role hierarchy (e.g., super_admin > sector_admin)
 * @param {string} role1 - First role
 * @param {string} role2 - Second role to compare
 * @returns {boolean} - True if role1 has higher hierarchy
 */
export const hasHigherHierarchy = (role1, role2) => {
  const type = Object.keys(roleHierarchy).find(t => 
    roleHierarchy[t][role1] !== undefined
  );
  
  if (!type) return false;
  
  const hierarchy = roleHierarchy[type];
  return (hierarchy[role1] || 0) > (hierarchy[role2] || 0);
};

/**
 * Get role hierarchy level (only for admin roles)
 * @param {string} role - The admin role
 * @returns {number} - Hierarchy level (higher = more privileged)
 */
export const getRoleLevel = (role) => {
  for (const type in roleHierarchy) {
    if (roleHierarchy[type][role] !== undefined) {
      return roleHierarchy[type][role];
    }
  }
  return 0;
};

/**
 * Validate if a role is valid
 * @param {string} role - The role to validate
 * @returns {boolean} - True if role exists
 */
export const isValidRole = (role) => {
  return getAllRoles().includes(role);
};

/**
 * Get role description for UI display
 * @param {string} role - The role
 * @returns {string} - Human-readable role description
 */
export const getRoleDescription = (role) => {
  const descriptions = {
    // Admin
    super_admin: "Super Administrator - Full system access",
    sector_admin: "Sector Administrator - Sector-specific approvals",
    employer_manager: "Employer Manager - Employer and job management",
    moderator: "Moderator - Content moderation",
    support: "Support Staff - User support and assistance",
    
    // Employer
    employer: "Employer - Company job posting and management",
    
    // User
    user: "Job Seeker - Browse and apply for jobs"
  };
  
  return descriptions[role] || "Unknown Role";
};
