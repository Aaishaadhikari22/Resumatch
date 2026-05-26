import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Employer from "../models/Employer.js";
import { hasPermission, isValidRole } from "../utils/permissionHelper.js";

/**
 * Universal permission checking middleware
 * Works for Admin, Employer, and User roles
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions
 * @param {string} userType - Type of user: 'admin', 'employer', 'user'
 * @returns {Function} - Express middleware function
 */
export const checkUserPermission = (requiredPermissions, userType = 'admin') => {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      let user = null;
      let userId = null;

      // Determine which user type to check
      if (userType === 'admin') {
        userId = req.admin?._id || req.user?._id;
        if (userId) {
          user = await Admin.findById(userId);
        }
      } else if (userType === 'employer') {
        userId = req.employer?._id || req.user?._id;
        if (userId) {
          user = await Employer.findById(userId);
        }
      } else if (userType === 'user') {
        userId = req.user?._id;
        if (userId) {
          user = await User.findById(userId);
        }
      }

      if (!userId || !user) {
        return res.status(401).json({ 
          msg: `Unauthorized - No ${userType} ID found` 
        });
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          msg: `Your ${userType} account is not active` 
        });
      }

      // Check permissions
      const userRole = user.role || '';
      const hasRequiredPermission = permissions.some(permission => 
        hasPermission(userRole, permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          msg: `Permission denied. Required permissions: ${permissions.join(", ")}`,
          userRole,
          requiredPermissions: permissions
        });
      }

      // Store user in request
      if (userType === 'admin') {
        req.admin = user;
      } else if (userType === 'employer') {
        req.employer = user;
      } else {
        req.user = user;
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ msg: "Server error during permission check" });
    }
  };
};

/**
 * Simplified permission check for admins
 * Maintains backward compatibility
 */
export const checkAdminPermission = (requiredPermissions) => {
  return checkUserPermission(requiredPermissions, 'admin');
};

/**
 * Permission check for employers
 */
export const checkEmployerPermission = (requiredPermissions) => {
  return checkUserPermission(requiredPermissions, 'employer');
};

/**
 * Permission check for job seekers (users)
 */
export const checkUserJobSeekerPermission = (requiredPermissions) => {
  return checkUserPermission(requiredPermissions, 'user');
};
