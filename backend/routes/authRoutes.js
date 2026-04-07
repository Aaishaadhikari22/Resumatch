import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/authController.js";

const router = express.Router();

/* ==================================
   ADMIN AUTH ROUTES
================================== */

// Admin Registration
router.post("/admin/register", registerAdmin);

// Admin Login
router.post("/admin/login", loginAdmin);

export default router;