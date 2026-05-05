import { useState, useEffect, useCallback } from "react";
import { getAdminInfo } from "../utils/permissionHelper";

/**
 * Custom hook for permission checking
 * Provides reactive permission checks that update when admin info changes
 */
export const usePermission = () => {
  const [adminInfo, setAdminInfo] = useState(getAdminInfo());

  // Listen for storage changes (e.g., from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setAdminInfo(getAdminInfo());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Check if admin has a specific permission
   */
  const hasPermission = useCallback((permission) => {
    if (!adminInfo?.permissions) return false;
    const normalizedPermission = permission.toLowerCase();
    return adminInfo.permissions.some(p => p.toLowerCase() === normalizedPermission);
  }, [adminInfo]);

  /**
   * Check if admin has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(perm => hasPermission(perm));
  }, [hasPermission]);

  /**
   * Check if admin has all of the specified permissions
   */
  const hasAllPermissions = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(perm => hasPermission(perm));
  }, [hasPermission]);

  /**
   * Check if admin has a specific role
   */
  const hasRole = useCallback((roles) => {
    if (!adminInfo?.role) return false;
    const normalizedUserRole = adminInfo.role.toLowerCase();
    
    if (typeof roles === "string") {
      return normalizedUserRole === roles.toLowerCase();
    }
    
    if (Array.isArray(roles)) {
      return roles.some(role => normalizedUserRole === role.toLowerCase());
    }
    
    return false;
  }, [adminInfo]);

  /**
   * Check if admin is a super admin
   */
  const isSuperAdmin = useCallback(() => {
    return hasRole("super_admin");
  }, [hasRole]);

  /**
   * Check if admin is a sector admin
   */
  const isSectorAdmin = useCallback(() => {
    return hasRole("sector_admin");
  }, [hasRole]);

  return {
    adminInfo,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isSuperAdmin,
    isSectorAdmin,
    permissions: adminInfo?.permissions || [],
    role: adminInfo?.role || null,
    sector: adminInfo?.sector || null
  };
};
