import express from "express";
import { registerEmployer, loginEmployer, verifyOTP, forgotPassword, resetPassword } from "../controllers/employerAuthController.js";

const router = express.Router();

router.post("/register", registerEmployer);
router.post("/login", loginEmployer);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
