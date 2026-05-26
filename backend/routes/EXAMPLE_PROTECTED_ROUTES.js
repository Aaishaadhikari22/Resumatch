/**
 * Example: Protected Admin Routes Using Roles & Permissions
 * 
 * This file demonstrates how to properly protect admin-only routes
 * using the new permissions system
 */

import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { checkAdminPermission } from "../middleware/checkPermissionUniversal.js";
import Admin from "../models/Admin.js";

const router = express.Router();

/* ====== ADMIN MANAGEMENT ====== */

// Only super_admin can create admins
router.post(
  "/admins",
  authenticateJWT,
  checkAdminPermission("create_admin"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      // Create admin logic here
      res.json({ message: "Admin created" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Only admins with change_admin_role permission
router.put(
  "/admins/:adminId/role",
  authenticateJWT,
  checkAdminPermission("change_admin_role"),
  async (req, res) => {
    try {
      const { role } = req.body;
      // Update admin role
      res.json({ message: "Role updated" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Only super_admin can delete admins
router.delete(
  "/admins/:adminId",
  authenticateJWT,
  checkAdminPermission("delete_admin"),
  async (req, res) => {
    try {
      // Delete admin logic
      res.json({ message: "Admin deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ====== USER MANAGEMENT ====== */

// Requires view_all_users permission
router.get(
  "/users",
  authenticateJWT,
  checkAdminPermission("view_all_users"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires suspend_user permission
router.post(
  "/users/:userId/suspend",
  authenticateJWT,
  checkAdminPermission("suspend_user"),
  async (req, res) => {
    try {
      // Suspend user logic
      res.json({ message: "User suspended" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires delete_user permission
router.delete(
  "/users/:userId",
  authenticateJWT,
  checkAdminPermission("delete_user"),
  async (req, res) => {
    try {
      // Delete user logic
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires verify_user_documents permission
router.post(
  "/users/:userId/verify-documents",
  authenticateJWT,
  checkAdminPermission("verify_user_documents"),
  async (req, res) => {
    try {
      const { documentId, verified } = req.body;
      // Document verification logic
      res.json({ message: "Documents verified" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ====== EMPLOYER MANAGEMENT ====== */

// Requires view_all_employers permission
router.get(
  "/employers",
  authenticateJWT,
  checkAdminPermission("view_all_employers"),
  async (req, res) => {
    try {
      const employers = await Employer.find().select("-password");
      res.json(employers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires approve_employer permission
router.post(
  "/employers/:employerId/approve",
  authenticateJWT,
  checkAdminPermission("approve_employer"),
  async (req, res) => {
    try {
      const employer = await Employer.findById(req.params.employerId);
      employer.status = "approved";
      employer.verifiedBy = req.admin._id;
      await employer.save();
      res.json({ message: "Employer approved" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires reject_employer permission
router.post(
  "/employers/:employerId/reject",
  authenticateJWT,
  checkAdminPermission("reject_employer"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const employer = await Employer.findById(req.params.employerId);
      employer.status = "rejected";
      employer.rejectionReason = reason;
      await employer.save();
      res.json({ message: "Employer rejected" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires suspend_employer permission
router.post(
  "/employers/:employerId/suspend",
  authenticateJWT,
  checkAdminPermission("suspend_employer"),
  async (req, res) => {
    try {
      // Suspend employer logic
      res.json({ message: "Employer suspended" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires delete_employer permission
router.delete(
  "/employers/:employerId",
  authenticateJWT,
  checkAdminPermission("delete_employer"),
  async (req, res) => {
    try {
      // Delete employer logic
      res.json({ message: "Employer deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ====== JOB MANAGEMENT ====== */

// Requires view_all_jobs permission
router.get(
  "/jobs",
  authenticateJWT,
  checkAdminPermission("view_all_jobs"),
  async (req, res) => {
    try {
      const jobs = await Job.find().lean();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires approve_job permission
router.post(
  "/jobs/:jobId/approve",
  authenticateJWT,
  checkAdminPermission("approve_job"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.jobId);
      job.jobStatus = "approved";
      job.approvedBy = req.admin._id;
      await job.save();
      res.json({ message: "Job approved" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires reject_job permission
router.post(
  "/jobs/:jobId/reject",
  authenticateJWT,
  checkAdminPermission("reject_job"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const job = await Job.findById(req.params.jobId);
      job.jobStatus = "rejected";
      job.rejectionReason = reason;
      await job.save();
      res.json({ message: "Job rejected" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires remove_job permission
router.delete(
  "/jobs/:jobId",
  authenticateJWT,
  checkAdminPermission("remove_job"),
  async (req, res) => {
    try {
      await Job.findByIdAndDelete(req.params.jobId);
      res.json({ message: "Job removed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires edit_job permission
router.put(
  "/jobs/:jobId",
  authenticateJWT,
  checkAdminPermission("edit_job"),
  async (req, res) => {
    try {
      const job = await Job.findByIdAndUpdate(
        req.params.jobId,
        req.body,
        { new: true }
      );
      res.json({ message: "Job updated", job });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ====== ANALYTICS & REPORTS ====== */

// Requires view_analytics permission
router.get(
  "/analytics",
  authenticateJWT,
  checkAdminPermission("view_analytics"),
  async (req, res) => {
    try {
      // Analytics logic
      res.json({ message: "Analytics data" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires view_reports permission
router.get(
  "/reports",
  authenticateJWT,
  checkAdminPermission("view_reports"),
  async (req, res) => {
    try {
      // Reports logic
      res.json({ message: "Reports data" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires export_data permission
router.get(
  "/export",
  authenticateJWT,
  checkAdminPermission("export_data"),
  async (req, res) => {
    try {
      // Export logic
      res.json({ message: "Data exported" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ====== SYSTEM SETTINGS ====== */

// Requires manage_settings permission
router.put(
  "/settings",
  authenticateJWT,
  checkAdminPermission("manage_settings"),
  async (req, res) => {
    try {
      // Update settings logic
      res.json({ message: "Settings updated" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Requires manage_system_config permission
router.put(
  "/system-config",
  authenticateJWT,
  checkAdminPermission("manage_system_config"),
  async (req, res) => {
    try {
      // Update system config logic
      res.json({ message: "System config updated" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
