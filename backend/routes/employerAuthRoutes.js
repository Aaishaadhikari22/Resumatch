import express from "express";
import { registerEmployer, loginEmployer } from "../controllers/employerAuthController.js";

const router = express.Router();

router.post("/register", registerEmployer);
router.post("/login", loginEmployer);

export default router;
