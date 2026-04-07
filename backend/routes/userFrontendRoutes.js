import express from "express";
import auth from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Resume from "../models/Resume.js";
import MatchingSettings from "../models/MatchingSettings.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getDashboardStats,
  getMyResume,
  updateResume,
  getRecommendedJobs,
  applyForJob,
  getMyApplications,
  saveJob,
  unsaveJob,
  getSavedJobs
} from "../controllers/userFrontendController.js";

// Configure multer for document uploads
const uploadDir = "./uploads/documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "doc-" + req.user._id + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPEG, PNG, and DOC files are allowed."));
    }
  }
});

const router = express.Router();

// All user frontend routes require auth(["user"])
router.use(auth(["user"]));

// DASHBOARD
router.get("/dashboard", getDashboardStats);

// RESUME
router.get("/resume", getMyResume);
router.post("/resume", updateResume);
router.post("/resume/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }
    // Return the filepath to be saved into the user's resume data
    const resumeUrl = `/uploads/documents/${req.file.filename}`;
    res.json({ msg: "Resume uploaded successfully", resumeUrl });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
// JOBS
router.get("/jobs/recommended", getRecommendedJobs);
router.post("/jobs/save", saveJob);
router.post("/jobs/unsave", unsaveJob);
router.get("/jobs/saved", getSavedJobs);

// APPLICATIONS
router.post("/apply", applyForJob);
router.get("/applications", getMyApplications);

/* ================= USER SETTINGS ================= */

// Get own profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update own profile
router.put("/profile", async (req, res) => {
  try {
    const { name, email, phone, city, address, gender } = req.body;
    const user = await User.findById(req.user._id);
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (address !== undefined) user.address = address;
    if (gender !== undefined) user.gender = gender;

    // Check completion status
    if (user.phone) user.profileCompletion.isPhoneVerified = true;
    if (user.address && user.city) user.profileCompletion.isAddressCompleted = true;

    await user.save();
    // Re-calculate or let other systems calculate overall completion percentage
    res.json({ msg: "Profile updated", user: { name: user.name, email: user.email, phone: user.phone, city: user.city, address: user.address, gender: user.gender } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get matching algorithm settings (read-only)
router.get("/algorithm-settings", async (req, res) => {
  try {
    let settings = await MatchingSettings.findOne();
    if (!settings) settings = await MatchingSettings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get notification preferences
router.get("/notifications", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.notificationPrefs || {});
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Save notification preferences
router.put("/notifications", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notificationPrefs = { ...user.notificationPrefs, ...req.body };
    await user.save();
    res.json({ msg: "Notification preferences saved", notificationPrefs: user.notificationPrefs });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get personal stats for monitoring/reports
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    const resume = await Resume.findOne({ user: userId });
    const totalApplications = await Application.countDocuments({ user: userId });
    const acceptedApplications = await Application.countDocuments({ user: userId, status: "accepted" });
    const rejectedApplications = await Application.countDocuments({ user: userId, status: "rejected" });
    const reviewedApplications = await Application.countDocuments({ user: userId, status: "reviewed" });
    const pendingApplications = await Application.countDocuments({ user: userId, status: "applied" });
    const savedJobsCount = user?.savedJobs ? user.savedJobs.length : 0;
    const skillsCount = resume?.skills ? resume.skills.length : 0;

    res.json({
      totalApplications, acceptedApplications, rejectedApplications,
      reviewedApplications, pendingApplications,
      savedJobsCount, skillsCount,
      memberSince: user.createdAt,
      sector: user.sector || "Not assigned"
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= DOCUMENT UPLOAD ================= */

// Upload verification document
router.post("/upload-document", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ msg: "Document type is required" });
    }

    const user = await User.findById(req.user._id);
    
    // Add document to user's documents array
    const newDocument = {
      documentType: documentType,
      fileName: req.file.originalname,
      filePath: `/uploads/documents/${req.file.filename}`,
      uploadedAt: new Date(),
      status: "uploaded" // Will be verified by admin
    };

    user.documents.push(newDocument);
    
    // Update profile completion status
    user.profileCompletion.isDocumentsUploaded = user.documents.length > 0;
    user.profileCompletion.completionPercentage = calculateCompletion(user);

    await user.save();

    res.json({
      msg: "Document uploaded successfully",
      document: newDocument,
      documents: user.documents
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get all user documents
router.get("/documents", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("documents");
    res.json(user.documents || []);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete a document
router.delete("/document/:docId", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const docIndex = user.documents.findIndex(d => d._id.toString() === req.params.docId);
    
    if (docIndex === -1) {
      return res.status(404).json({ msg: "Document not found" });
    }

    const doc = user.documents[docIndex];
    
    // Delete file from storage
    if (doc.filePath && fs.existsSync("." + doc.filePath)) {
      fs.unlinkSync("." + doc.filePath);
    }

    user.documents.splice(docIndex, 1);
    user.profileCompletion.isDocumentsUploaded = user.documents.length > 0;
    user.profileCompletion.completionPercentage = calculateCompletion(user);

    await user.save();

    res.json({ msg: "Document deleted successfully", documents: user.documents });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Helper function to calculate profile completion percentage
function calculateCompletion(user) {
  const fields = {
    name: !!user.name,
    email: !!user.email,
    phone: !!user.phone,
    address: !!user.address,
    city: !!user.city,
    profilePhoto: !!user.profilePhoto,
    documents: user.documents && user.documents.length > 0
  };

  const completed = Object.values(fields).filter(Boolean).length;
  return Math.round((completed / Object.keys(fields).length) * 100);
}

export default router;
