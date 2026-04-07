import Admin from "../models/Admin.js";

/**
 * Middleware to check if admin has one of the required roles
 * @param {string|string[]} requiredRoles - Single role or array of roles
 * @returns {Function} - Express middleware function
 */
const checkRole = (requiredRoles) => {
  // Normalize to array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

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

      // Check if admin has one of the required roles (case-insensitive)
      const normalizedRole = (admin.role || "").trim().toLowerCase();
      const normalizedRoles = roles.map(r => r.trim().toLowerCase());
      
      if (!normalizedRoles.includes(normalizedRole)) {
        return res.status(403).json({ 
          msg: `Access denied. Required roles: ${roles.join(", ")}`
        });
      }

      // Store admin info in request for later use
      req.admin = admin;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ msg: "Server error during role check" });
    }
  };
};

export default checkRole;
