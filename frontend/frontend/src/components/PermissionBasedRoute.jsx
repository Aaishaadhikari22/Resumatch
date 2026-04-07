import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "./common/LoadingSpinner";

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
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      // Get admin info from localStorage (should be set during login)
      const adminInfo = localStorage.getItem("adminInfo");
      
      if (!adminInfo) {
        setIsAuthorized(false);
        return;
      }

      try {
        const admin = JSON.parse(adminInfo);
        
        // Normalize permissions for comparison
        const permissions = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];
        
        const adminPermissions = (admin.permissions || []).map(p => p.toLowerCase());
        const normalizedPermissions = permissions.map(p => p.toLowerCase());
        
        // Check if admin has required permissions
        let hasRequiredPermission;
        
        if (requireAll) {
          // Admin must have ALL required permissions
          hasRequiredPermission = normalizedPermissions.every(perm => 
            adminPermissions.includes(perm)
          );
        } else {
          // Admin must have ANY of the required permissions
          hasRequiredPermission = normalizedPermissions.some(perm => 
            adminPermissions.includes(perm)
          );
        }
        
        setIsAuthorized(hasRequiredPermission);
      } catch (error) {
        console.error("Error parsing admin info:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [requiredPermissions, requireAll]);

  // Still loading
  if (isAuthorized === null) {
    return <LoadingSpinner />;
  }

  // Not authorized
  if (!isAuthorized) {
    return <Navigate to={fallbackPath} />;
  }

  // Authorized - render component
  return children;
}
