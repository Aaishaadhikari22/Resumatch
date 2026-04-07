import Admin from "../models/Admin.js";
import { hasPermission } from "../utils/permissionHelper.js";

/**
 * Middleware to check if admin has a specific permission
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions
 * @returns {Function} - Express middleware function
 */
const checkPermission = (requiredPermissions) => {
  // Normalize to array
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      // Get admin from the request (set by auth middleware)
      const adminId = req.admin?.id || req.user?.id;
      
      if (!adminId) {
        return res.status(401).json({ msg: "Unauthorized - No admin ID found" });
      }

      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(403).json({ msg: "Admin not found" });
      }

      if (admin.status !== "active") {
        return res.status(403).json({ msg: "Admin account is not active" });
      }

      // Check if admin has any of the required permissions
      const hasRequiredPermission = permissions.some(permission => 
        hasPermission(admin.role, permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          msg: `Permission denied. Required permissions: ${permissions.join(", ")}`
        });
      }

      // Store admin info in request for later use
      req.admin = admin;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ msg: "Server error during permission check" });
    }
  };
};

export default checkPermission;