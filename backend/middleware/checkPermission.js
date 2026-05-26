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
      let admin = req.user || req.admin;
      
      if (!admin) {
        return res.status(401).json({ msg: "Unauthorized - No admin found" });
      }

      // If admin is not already loaded from DB (just from token), fetch full admin document
      if (!admin.permissions && admin._id) {
        admin = await Admin.findById(admin._id);
      }

      if (!admin) {
        return res.status(403).json({ msg: "Admin not found" });
      }

      // Check if it's actually an admin (not a regular user or employer)
      if (admin.role && !['super_admin', 'sector_admin', 'employer_manager', 'moderator', 'support'].includes(admin.role)) {
        return res.status(403).json({ msg: "User is not an admin" });
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