import express from "express";
import { registerAdmin, loginAdmin, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = express.Router();

/* ==================================
   ADMIN AUTH ROUTES
================================== */

// Admin Registration
router.post("/admin/register", registerAdmin);

// Admin Login
router.post("/admin/login", loginAdmin);

// Admin Password Reset
router.post("/admin/forgot-password", forgotPassword);
router.post("/admin/reset-password", resetPassword);

export default router;