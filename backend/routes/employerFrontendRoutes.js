import express from "express";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getDashboardStats,
  postJob,
  getMyJobs,
  getApplicantsForJob,
  updateApplicationStatus,
  toggleShortlist,
  getProfile,
  updateProfile,
  updateContact,
  changePassword,
  getJobPrefs,
  updateJobPrefs,
  getMatchingResults,
  getShortlisted,
  editJob,
  deleteJob,
  closeJob,
  getNotificationPrefs,
  updateNotificationPrefs
} from "../controllers/employerFrontendController.js";

// Configure multer for job image uploads
const jobImageDir = "./uploads/job-images";
if (!fs.existsSync(jobImageDir)) {
  fs.mkdirSync(jobImageDir, { recursive: true });
}

const jobImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, jobImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "job-" + req.user._id + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const jobImageUpload = multer({
  storage: jobImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
    }
  }
});

const router = express.Router();

// All employer frontend routes require auth(["employer"])
router.use(auth(["employer"]));

// DASHBOARD
router.get("/dashboard", getDashboardStats);

// JOBS
router.post("/jobs", postJob);
router.post("/jobs/upload-image", jobImageUpload.single("jobImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No image file provided" });
    }

    res.json({
      success: true,
      fileName: req.file.filename,
      filePath: `/uploads/job-images/${req.file.filename}`,
      message: "Image uploaded successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/jobs", getMyJobs);

// APPLICANTS
router.get("/jobs/:jobId/applicants", getApplicantsForJob);

// APPLICATION STATUS
router.patch("/applications/:id/status", updateApplicationStatus);

// APPLICATION SHORTLIST
router.patch("/applications/:id/shortlist", toggleShortlist);

// ========== SETTINGS ENDPOINTS ==========

// PROFILE
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// CONTACT
router.put("/contact", updateContact);

// PASSWORD
router.put("/change-password", changePassword);

// JOB POSTING PREFERENCES
router.get("/job-prefs", getJobPrefs);
router.put("/job-prefs", updateJobPrefs);

// MATCHING RESULTS
router.get("/matching-results", getMatchingResults);

// SHORTLISTED CANDIDATES
router.get("/shortlisted", getShortlisted);

// JOB MANAGEMENT (edit, close, delete)
router.put("/jobs/:id", editJob);
router.delete("/jobs/:id", deleteJob);
router.patch("/jobs/:id/close", closeJob);

// NOTIFICATION PREFERENCES
router.get("/notification-prefs", getNotificationPrefs);
router.put("/notification-prefs", updateNotificationPrefs);

export default router;
