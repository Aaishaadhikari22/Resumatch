import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Employer from "../models/Employer.js";

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ msg: "No token provided" });
      }

      console.log("[Auth Debug] Token received:", token ? token.substring(0, 20) + "..." : "NONE");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[Auth Debug] Decoded Token Payload:", JSON.stringify(decoded));

      let user = await User.findById(decoded.id);
      if (user) {
         console.log(`[Auth Debug] User found in 'users' collection. Email: ${user.email}, Role: ${user.role}`);
      } else {
         console.log(`[Auth Debug] User NOT found in 'users' collection with ID: ${decoded.id}. Trying 'admins'...`);
         user = await Admin.findById(decoded.id);
         if (user) {
            console.log(`[Auth Debug] User found in 'admins' collection. Email: ${user.email}, Role: ${user.role}`);
         } else {
            console.log(`[Auth Debug] User NOT found in 'admins' collection. Trying 'employers'...`);
            user = await Employer.findById(decoded.id);
            if (user) {
               console.log(`[Auth Debug] User found in 'employers' collection. Email: ${user.email}, Role: ${user.role}`);
            } else {
               console.log(`[Auth Debug] User NOT found in any collection.`);
            }
         }
      }

      if (!user) {
        console.log(`[Auth Debug] 401 Unauthorized - User lookup failed for ID: ${decoded.id}`);
        return res.status(401).json({ msg: "User not found" });
      }

      // role check - case insensitive and trimmed
      const userRole = (user.role || "").trim().toLowerCase();
      const requiredRoles = roles.map(r => r.trim().toLowerCase());

      console.log(`[Auth Debug] Checking permissions for ${user.email}:`);
      console.log(`- Required Roles: [${requiredRoles.join(", ")}]`);
      console.log(`- Actual Role: '${userRole}' (raw: '${user.role}')`);

      if (requiredRoles.length && !requiredRoles.includes(userRole)) {
        // Conceptual bypass for common user-level terms
        const isUserType = ["user", "job_seeker", "jobseeker", "candidate", "member", "applicant"].includes(userRole) || /user/i.test(userRole);
        const needsUserType = requiredRoles.includes("user") || requiredRoles.includes("job_seeker");

        console.log(`- Conceptual Check: isUserType=${isUserType}, needsUserType=${needsUserType}`);

        if (needsUserType && isUserType) {
            console.log("-> [Auth Debug] ALLOWED via conceptual match.");
        } else {
            console.log("-> [Auth Debug] DENIED: Role mismatch and no bypass.");
            return res.status(403).json({ msg: "Access denied: Unauthorized role" });
        }
      } else {
        console.log("-> [Auth Debug] ALLOWED: Exact role match or no requirements.");
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("[Auth Debug] AUTH ERROR:", err.message);
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};

export default auth; // ⭐ THIS IS THE IMPORTANT PART
