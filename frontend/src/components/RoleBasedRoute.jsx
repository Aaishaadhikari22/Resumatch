import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "./common/LoadingSpinner";
import { getActiveAuthToken, getAuthInfo } from "../utils/auth";

/**
 * RoleBasedRoute - Protects routes based on admin role
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string|string[]} props.requiredRoles - Single role or array of roles allowed
 * @param {string} props.fallbackPath - Path to redirect to if not authorized (default: /admin/login)
 */
export default function RoleBasedRoute({ 
  children, 
  requiredRoles, 
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
      if (!admin || !admin.role) {
        setIsAuthorized(false);
        return;
      }

      try {
        const roles = Array.isArray(requiredRoles)
          ? requiredRoles.map((r) => String(r || "").toLowerCase())
          : [String(requiredRoles || "").toLowerCase()];

        const normalizedUserRole = String(admin.role || "").toLowerCase();
        const hasRequiredRole = roles.includes(normalizedUserRole);
        setIsAuthorized(hasRequiredRole);
      } catch (error) {
        console.error("Error parsing admin info:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [requiredRoles]);

  if (isAuthorized === null) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return <Navigate to={fallbackPath} />;
  }

  return children;
}
