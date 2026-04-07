import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "./common/LoadingSpinner";

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
  const [userRole, setUserRole] = useState(null);

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
        setUserRole(admin.role);

        // Normalize roles for comparison
        const roles = Array.isArray(requiredRoles) 
          ? requiredRoles.map(r => r.toLowerCase()) 
          : [requiredRoles.toLowerCase()];
        
        const normalizedUserRole = (admin.role || "").toLowerCase();
        
        const hasRequiredRole = roles.includes(normalizedUserRole);
        setIsAuthorized(hasRequiredRole);
      } catch (error) {
        console.error("Error parsing admin info:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [requiredRoles]);

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
