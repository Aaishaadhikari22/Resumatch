import { usePermission } from "../hooks/usePermission";

/**
 * PermissionGuard - Conditionally render content based on user permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string|string[]} props.permission - Single permission or array of permissions
 * @param {boolean} props.requireAll - If true, admin must have all permissions (default: false)
 * @param {React.ReactNode} props.fallback - Content to show if not authorized (default: null)
 */
export const PermissionGuard = ({ 
  children, 
  permission, 
  requireAll = false, 
  fallback = null 
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();

  let isAuthorized = false;

  if (typeof permission === "string") {
    isAuthorized = hasPermission(permission);
  } else if (Array.isArray(permission)) {
    isAuthorized = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
  }

  return isAuthorized ? children : fallback;
};

/**
 * RoleGuard - Conditionally render content based on user role
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string|string[]} props.role - Single role or array of roles
 * @param {React.ReactNode} props.fallback - Content to show if not authorized (default: null)
 */
export const RoleGuard = ({ children, role, fallback = null }) => {
  const { hasRole } = usePermission();

  const isAuthorized = hasRole(role);

  return isAuthorized ? children : fallback;
};

/**
 * SuperAdminGuard - Conditionally render content only for super admins
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if user is super admin
 * @param {React.ReactNode} props.fallback - Content to show if not authorized (default: null)
 */
export const SuperAdminGuard = ({ children, fallback = null }) => {
  const { isSuperAdmin } = usePermission();

  return isSuperAdmin() ? children : fallback;
};

/**
 * SectorAdminGuard - Conditionally render content for sector or super admins
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if user is sector admin
 * @param {React.ReactNode} props.fallback - Content to show if not authorized (default: null)
 */
export const SectorAdminGuard = ({ children, fallback = null }) => {
  const { isSectorAdmin, hasRole } = usePermission();

  const isAuthorized = isSectorAdmin() || hasRole("super_admin");

  return isAuthorized ? children : fallback;
};
