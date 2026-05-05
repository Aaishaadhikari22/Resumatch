import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Employer from "../models/Employer.js";

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (["user", "job_seeker", "jobseeker", "candidate", "member", "applicant"].includes(value)) return "user";
  if (["employer", "company", "company_representative", "employer_manager"].includes(value)) return "employer";
  if (["super_admin", "superadmin", "admin"].includes(value)) return "super_admin";
  if (["sector_admin", "sectoradmin"].includes(value)) return "sector_admin";
  return value;
};

const isAccountActive = (user) => {
  if (!user || !user.status) return true;
  const inactiveStates = new Set(["suspended", "blocked", "rejected", "inactive", "pending"]);
  return !inactiveStates.has(String(user.status).trim().toLowerCase());
};

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

      if (!token) {
        return res.status(401).json({ msg: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.id;
      if (!userId) {
        return res.status(401).json({ msg: "Invalid token payload" });
      }

      let user = await User.findById(userId);
      if (!user) {
        user = await Admin.findById(userId);
      }
      if (!user) {
        user = await Employer.findById(userId);
      }

      if (!user) {
        return res.status(401).json({ msg: "User not found" });
      }

      if (!isAccountActive(user)) {
        return res.status(403).json({ msg: "Account is not active. Contact support." });
      }

      const actualRole = normalizeRole(user.role);
      const requiredRoles = Array.isArray(roles)
        ? roles.map(normalizeRole).filter(Boolean)
        : [normalizeRole(roles)].filter(Boolean);

      if (requiredRoles.length && !requiredRoles.includes(actualRole)) {
        return res.status(403).json({ msg: "Access denied: Unauthorized role" });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ msg: "Invalid token" });
    }
  };
};

export default auth;
