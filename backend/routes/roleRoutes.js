import express from "express";
import Role from "../models/Role.js";
import { checkRole } from "../middleware/checkRole.js";
import { checkAdminPermission } from "../middleware/checkPermissionUniversal.js";
import { authenticateJWT } from "../middleware/auth.js";
import {
  getAllRolesWithPermissions,
  getRoleDetails,
  assignAdminRole,
  updateAdminPermissions,
  getAllAdminsWithRoles,
  verifyPermission
} from "../controllers/adminController.js";

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */

// Get all available roles (public info)
router.get("/public/all", async (req, res) => {
  try {
    const roles = await Role.find().lean();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific role details
router.get("/:role", getRoleDetails);

/* ================= PROTECTED ROUTES - SUPER_ADMIN ONLY ================= */

// Get all roles with permissions (admin only)
router.get(
  "/admin/all",
  authenticateJWT,
  checkAdminPermission("manage_roles"),
  getAllRolesWithPermissions
);

// Create new role
router.post(
  "/admin/create",
  authenticateJWT,
  checkAdminPermission("manage_roles"),
  async (req, res) => {
    try {
      const { name, permissions } = req.body;

      if (!name || !Array.isArray(permissions)) {
        return res.status(400).json({ msg: "Name and permissions array required" });
      }

      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ msg: "Role already exists" });
      }

      const role = await Role.create({ name, permissions });
      res.json(role);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
);

// Update role
router.put(
  "/admin/update/:id",
  authenticateJWT,
  checkAdminPermission("manage_roles"),
  async (req, res) => {
    try {
      const role = await Role.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!role) return res.status(404).json({ msg: "Role not found" });
      res.json(role);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
);

// Delete role
router.delete(
  "/admin/delete/:id",
  authenticateJWT,
  checkAdminPermission("manage_roles"),
  async (req, res) => {
    try {
      await Role.findByIdAndDelete(req.params.id);
      res.json({ msg: "Role deleted" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

// Assign role to admin
router.post(
  "/admin/assign/:adminId",
  authenticateJWT,
  checkAdminPermission("change_admin_role"),
  assignAdminRole
);

// Update admin permissions
router.put(
  "/admin/permissions/:adminId",
  authenticateJWT,
  checkAdminPermission("assign_permissions"),
  updateAdminPermissions
);

// Get all admins with roles
router.get(
  "/admin/list",
  authenticateJWT,
  checkAdminPermission("view_all_admins"),
  getAllAdminsWithRoles
);

// Verify if role has permission
router.post(
  "/admin/verify-permission",
  authenticateJWT,
  checkAdminPermission("manage_roles"),
  verifyPermission
);

export default router;