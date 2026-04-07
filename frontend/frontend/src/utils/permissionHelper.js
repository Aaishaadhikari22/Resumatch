/**
 * Frontend permission checking utilities
 * These functions help determine what a user can do based on their role and permissions
 */

/**
 * Get the current admin's info from localStorage
 * @returns {Object|null} Admin info or null if not found
 */
export const getAdminInfo = () => {
  try {
    const adminInfo = localStorage.getItem("adminInfo");
    return adminInfo ? JSON.parse(adminInfo) : null;
  } catch (error) {
    console.error("Error parsing admin info:", error);
    return null;
  }
};

/**
 * Check if current admin has a specific permission
 * @param {string} permission - The permission to check
 * @returns {boolean} True if admin has the permission
 */
export const hasPermission = (permission) => {
  const adminInfo = getAdminInfo();
  if (!adminInfo || !adminInfo.permissions) return false;
  
  const normalizedPermission = permission.toLowerCase();
  return adminInfo.permissions.some(p => p.toLowerCase() === normalizedPermission);
};

/**
 * Check if current admin has one of multiple permissions (OR condition)
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if admin has any of the permissions
 */
export const hasAnyPermission = (permissions) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(permission));
};

/**
 * Check if current admin has all specified permissions (AND condition)
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if admin has all the permissions
 */
export const hasAllPermissions = (permissions) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(permission));
};

/**
 * Check if current admin has a specific role
 * @param {string|string[]} roles - Single role or array of roles
 * @returns {boolean} True if admin has the role
 */
export const hasRole = (roles) => {
  const adminInfo = getAdminInfo();
  if (!adminInfo || !adminInfo.role) return false;
  
  const normalizedUserRole = adminInfo.role.toLowerCase();
  
  if (typeof roles === "string") {
    return normalizedUserRole === roles.toLowerCase();
  }
  
  if (Array.isArray(roles)) {
    return roles.some(role => normalizedUserRole === role.toLowerCase());
  }
  
  return false;
};

/**
 * Check if current admin is a super admin
 * @returns {boolean} True if admin is a super_admin
 */
export const isSuperAdmin = () => {
  return hasRole("super_admin");
};

/**
 * Check if current admin is a sector admin
 * @returns {boolean} True if admin is a sector_admin
 */
export const isSectorAdmin = () => {
  return hasRole("sector_admin");
};

/**
 * Get all permissions of the current admin
 * @returns {string[]} Array of permissions
 */
export const getAdminPermissions = () => {
  const adminInfo = getAdminInfo();
  return adminInfo?.permissions || [];
};

/**
 * Get the current admin's role
 * @returns {string|null} The admin's role or null
 */
export const getAdminRole = () => {
  const adminInfo = getAdminInfo();
  return adminInfo?.role || null;
};

/**
 * Get the current admin's sector (for sector admins)
 * @returns {string|null} The admin's sector or null
 */
export const getAdminSector = () => {
  const adminInfo = getAdminInfo();
  return adminInfo?.sector || null;
};
