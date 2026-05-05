import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "./common/LoadingSpinner";
import { getActiveAuthToken, getAuthInfo } from "../utils/auth";

/**
 * PermissionBasedRoute - Protects routes based on admin permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string|string[]} props.requiredPermissions - Single permission or array of permissions
 * @param {boolean} props.requireAll - If true, admin must have all permissions (default: false = any permission)
 * @param {string} props.fallbackPath - Path to redirect to if not authorized (default: /admin/login)
 */
export default function PermissionBasedRoute({ 
  children, 
  requiredPermissions, 
  requireAll = false,
  fallbackPath = "/admin/login" 
}) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuthorization = () => {
      const token = getActiveAuthToken();
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      const admin = getAuthInfo("admin");
      if (!admin || !admin.role || !admin.role.toLowerCase().includes("admin")) {
        setIsAuthorized(false);
        return;
      }

      try {
        const permissions = Array.isArray(requiredPermissions)
          ? requiredPermissions
          : [requiredPermissions];

        const adminPermissions = (admin.permissions || []).map((p) => p.toLowerCase());
        const normalizedPermissions = permissions.map((p) => String(p || "").toLowerCase());

        let hasRequiredPermission;
        if (requireAll) {
          hasRequiredPermission = normalizedPermissions.every((perm) => adminPermissions.includes(perm));
        } else {
          hasRequiredPermission = normalizedPermissions.some((perm) => adminPermissions.includes(perm));
        }

        setIsAuthorized(hasRequiredPermission);
      } catch (error) {
        console.error("Error parsing admin info:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [requiredPermissions, requireAll]);

  if (isAuthorized === null) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return <Navigate to={fallbackPath} />;
  }

  return children;
}
