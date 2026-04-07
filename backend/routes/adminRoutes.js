import express from "express";
import User from "../models/User.js";
import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import MatchingSettings from "../models/MatchingSettings.js";
import auth from "../middleware/auth.js";
import checkPermission from "../middleware/checkPermission.js";
import checkRole from "../middleware/checkRole.js";
import Application from "../models/Application.js";
import Admin from "../models/Admin.js";
import Role from "../models/Role.js";
import { calculateSimilarityScore } from "../utils/skillMatching.js";
import { 
  createAdmin, 
  createUser, 
  createEmployer,
  deleteUser,
  deleteEmployer,
  deleteJob,
  updateUserStatus,
  updateEmployerStatus,
  updateJobStatus,
  approveJob,
  rejectJob,
  getSystemLogs,
  triggerBackup,
  clearSystemCache,
  resetSystemSettings,
  getAdvancedStats
} from "../controllers/adminController.js";

const router = express.Router();
/* ================= DASHBOARD STATS ================= */
router.get("/dashboard", auth(), checkPermission(["view_analytics", "manage_jobs", "manage_employers"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalEmployers = await Employer.countDocuments();
    const totalJobs = await Job.countDocuments();
    const pendingJobs = await Job.countDocuments({ jobStatus: "pending" });
    const pendingEmployers = await Employer.countDocuments({ status: "pending" });
    const totalResumes = await Resume.countDocuments();

    res.json({
      totalUsers,
      totalEmployers,
      totalJobs,
      pendingJobs,
      pendingEmployers,
      totalResumes
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


/* ================= ADMIN MANAGEMENT ================= */

// GET ALL ADMINS
router.get("/all", auth(), checkPermission("manage_admins"), async (req, res) => {
  try {
    const admins = await Admin.find({ isDeleted: { $ne: true } });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE ADMIN
router.post("/create", auth(), checkPermission("manage_admins"), createAdmin);

// CREATE USER
router.post("/create-user", auth(), checkPermission("manage_users"), createUser);

// CREATE EMPLOYER
router.post("/create-employer", auth(), checkPermission(["manage_employers", "manage_jobs"]), createEmployer);

// UPDATE ADMIN (role or status)
router.put("/update/:id", auth(), checkPermission("manage_admins"), async (req, res) => {
  try {
    const updated = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE ADMIN
router.delete("/delete/:id", auth(), checkPermission("manage_admins"), async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/* ================= USER MANAGEMENT ================= */
router.get("/users", auth(), checkPermission(["manage_users", "view_analytics"]), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Get users by status
router.get("/users/pending", auth(), checkPermission(["manage_users", "view_analytics"]), async (req, res) => {
  try {
    const users = await User.find()
      .where('profileCompletion.completionPercentage').lt(100)
      .select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/users/verified", auth(), checkPermission(["manage_users", "view_analytics"]), async (req, res) => {
  try {
    const users = await User.find()
      .where('profileCompletion.completionPercentage').equals(100)
      .select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/users/rejected", auth(), checkPermission(["manage_users", "view_analytics"]), async (req, res) => {
  try {
    const users = await User.find({ status: "rejected" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/user/:id", auth(), checkPermission("manage_users"), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/user/:id/status", auth(), checkPermission("manage_users"), updateUserStatus);
router.delete("/user/:id", auth(), checkPermission("manage_users"), deleteUser);


/* ================= EMPLOYER MANAGEMENT ================= */
router.get("/employers", auth(), checkPermission(["manage_employers", "approve_employers"]), async (req, res) => {
  try {
    const employers = await Employer.find();
    res.json(employers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/employer/:id", auth(), checkPermission(["manage_employers", "approve_employers"]), updateEmployerStatus);
router.delete("/employer/:id", auth(), checkPermission("manage_employers"), deleteEmployer);

router.get("/employers/pending", auth(), checkPermission(["manage_employers", "approve_employers"]), async (req, res) => {
  const pending = await Employer.find({ status: "pending" });
  res.json(pending);
});


/* ================= JOB MODERATION ================= */
router.get("/jobs", auth(), checkPermission(["manage_jobs", "approve_jobs"]), async (req, res) => {
  try {
    const jobs = await Job.find().populate("employer").lean();
    
    // Add stats for each job
    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
      const applications = await Application.find({ job: job._id });
      const applicantsCount = applications.length;
      
      let totalMatch = 0;
      let ratedCount = 0;
      
      const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());
      if (jobSkills.length > 0) {
        for (const app of applications) {
          const resume = await Resume.findOne({ user: app.user });
          if (resume && resume.skills && resume.skills.length > 0) {
            const result = calculateSimilarityScore(jobSkills, resume.skills);
            totalMatch += result.score;
            ratedCount++;
          }
        }
      }
      
      const avgMatch = ratedCount > 0 ? Math.round(totalMatch / ratedCount) : 0;
      
      return { ...job, applicantsCount, avgMatch };
    }));
    
    res.json(jobsWithStats);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/job/:id", auth(), checkPermission(["manage_jobs", "approve_jobs"]), updateJobStatus);
router.post("/job/:id/approve", auth(), checkPermission(["manage_jobs", "approve_jobs"]), approveJob);
router.post("/job/:id/reject", auth(), checkPermission(["manage_jobs", "approve_jobs"]), rejectJob);
router.delete("/job/:id", auth(), checkPermission(["manage_jobs", "approve_jobs"]), deleteJob);

router.get("/jobs/pending", auth(), checkPermission(["manage_jobs", "approve_jobs"]), async (req, res) => {
  const jobs = await Job.find({ jobStatus: "pending" });
  res.json(jobs);
});

/* ================= RESUME MODERATION ================= */
router.get("/resumes", auth(), checkPermission("manage_jobs"), async (req, res) => {
  const resumes = await Resume.find();
  res.json(resumes);
});

router.put("/resume/:id", auth(), checkPermission("manage_jobs"), async (req, res) => {
  await Resume.findByIdAndUpdate(req.params.id, { verified: true });
  res.json({ msg: "Resume verified" });
});


/* ================= GET ALL APPLICATIONS ================= */

router.get("/applications", auth(), checkPermission(["manage_jobs", "view_analytics"]), async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("user", "name email phone")
      .populate("job", "title")
      .populate("employer", "companyName");

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================= UPDATE APPLICATION STATUS ================= */
router.put("/application/:id", auth(), checkPermission(["manage_jobs"]), async (req, res) => {
  const { status } = req.body;

  await Application.findByIdAndUpdate(req.params.id, { status });

  res.json({ msg: "Application status updated" });
});

/* ================= MATCHING SETTINGS ================= */
router.get("/matching-settings", auth(), checkPermission("manage_settings"), async (req, res) => {
  const settings = await MatchingSettings.find();
  res.json(settings);
});

router.post("/matching-settings", auth(), checkPermission("manage_settings"), async (req, res) => {
  await MatchingSettings.deleteMany();
  await MatchingSettings.create(req.body);
  res.json({ msg: "Matching settings updated" });
});

/* ================= SYSTEM SETTINGS (FULL) ================= */
router.get("/system-settings", auth(), checkPermission(["view_analytics", "manage_settings"]), async (req, res) => {
  try {
    let settings = await MatchingSettings.findOne();
    if (!settings) {
      settings = await MatchingSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/system-settings", auth(), checkPermission("manage_settings"), async (req, res) => {
  try {
    let settings = await MatchingSettings.findOne();
    if (!settings) {
      settings = await MatchingSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      settings.updatedAt = Date.now();
      await settings.save();
    }
    res.json({ msg: "System settings updated", settings });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= ADMIN PROFILE ================= */
router.get("/profile", auth(), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");
    res.json(admin);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/profile", auth(), async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.user._id);
    if (name) admin.name = name;
    if (email) admin.email = email;
    await admin.save();
    res.json({ msg: "Profile updated", admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= CHANGE PASSWORD ================= */
import bcrypt from "bcryptjs";

router.put("/change-password", auth(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user._id);
    
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }
    
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= USER ROLE ASSIGNMENT ================= */
router.put("/user/:id/role", auth(), checkPermission("manage_admins"), async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ msg: "User role updated" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= SYSTEM STATS (FULL) ================= */
router.get("/system-stats", auth(), checkPermission(["view_analytics", "view_reports"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const suspendedUsers = await User.countDocuments({ status: "suspended" });
    const bannedUsers = await User.countDocuments({ status: "banned" });
    const totalEmployers = await Employer.countDocuments();
    const pendingEmployers = await Employer.countDocuments({ status: "pending" });
    const totalJobs = await Job.countDocuments();
    const approvedJobs = await Job.countDocuments({ jobStatus: "approved" });
    const pendingJobs = await Job.countDocuments({ jobStatus: "pending" });
    const totalResumes = await Resume.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    
    res.json({
      totalUsers, activeUsers, suspendedUsers, bannedUsers,
      totalEmployers, pendingEmployers,
      totalJobs, approvedJobs, pendingJobs,
      totalResumes, totalApplications, totalAdmins
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= SECTOR ADMIN ROUTES ================= */

// Get users in sector admin's sector
router.get("/sector/users", auth(), checkPermission(["manage_users", "view_analytics"]), async (req, res) => {
  try {
    const sector = req.user.sector;
    const users = sector
      ? await User.find({ sector }).select("-password")
      : await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update user status (within sector)
router.put("/sector/user/:id/status", auth(), checkPermission("manage_users"), async (req, res) => {
  try {
    const { status } = req.body;
    const sector = req.user.sector;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (sector && user.sector !== sector) {
      return res.status(403).json({ msg: "Cannot manage users outside your sector" });
    }
    user.status = status;
    await user.save();
    res.json({ msg: "User status updated" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get jobs in sector admin's sector
router.get("/sector/jobs", auth(), checkPermission(["manage_jobs", "approve_jobs"]), async (req, res) => {
  try {
    const sector = req.user.sector;
    const jobs = sector
      ? await Job.find({ sector }).populate("employer")
      : await Job.find().populate("employer");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Approve/reject a job in sector
router.put("/sector/job/:id", auth(), checkPermission("approve_jobs"), async (req, res) => {
  try {
    const { status } = req.body;
    const sector = req.user.sector;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    if (sector && job.sector !== sector) {
      return res.status(403).json({ msg: "Cannot manage jobs outside your sector" });
    }
    job.jobStatus = status;
    await job.save();
    res.json({ msg: "Job status updated" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get employers (view only for sector admin)
router.get("/sector/employers", auth(), checkPermission(["manage_employers", "approve_employers"]), async (req, res) => {
  try {
    const employers = await Employer.find().select("-password");
    res.json(employers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Approve/reject employer in sector
router.put("/sector/employer/:id", auth(), checkPermission("approve_employers"), async (req, res) => {
  try {
    const { status } = req.body;
    const sector = req.user.sector;
    const employer = await Employer.findById(req.params.id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });
    if (sector && employer.sector !== sector) {
      return res.status(403).json({ msg: "Cannot manage employers outside your sector" });
    }
    employer.status = status;
    await employer.save();
    res.json({ msg: "Employer status updated" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get applications for jobs in sector
router.get("/sector/applications", auth(), checkPermission(["manage_jobs", "view_analytics"]), async (req, res) => {
  try {
    const sector = req.user.sector;
    let sectorJobs;
    if (sector) {
      sectorJobs = await Job.find({ sector }).select("_id");
      const jobIds = sectorJobs.map(j => j._id);
      const applications = await Application.find({ job: { $in: jobIds } })
        .populate("user", "name email")
        .populate("job", "title sector")
        .populate("employer", "companyName");
      return res.json(applications);
    }
    const applications = await Application.find()
      .populate("user", "name email")
      .populate("job", "title sector")
      .populate("employer", "companyName");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get sector stats
router.get("/sector/stats", auth(["sector_admin", "super_admin"]), async (req, res) => {
  try {
    const sector = req.user.sector;
    const filter = sector ? { sector } : {};

    const totalUsers = await User.countDocuments(filter);
    const activeUsers = await User.countDocuments({ ...filter, status: "active" });
    const totalJobs = await Job.countDocuments(filter);
    const pendingJobs = await Job.countDocuments({ ...filter, jobStatus: "pending" });
    const approvedJobs = await Job.countDocuments({ ...filter, jobStatus: "approved" });
    const rejectedJobs = await Job.countDocuments({ ...filter, jobStatus: "rejected" });

    // Get job IDs in sector for application counting
    const sectorJobIds = sector
      ? (await Job.find(filter).select("_id")).map(j => j._id)
      : null;
    const totalApplications = sectorJobIds
      ? await Application.countDocuments({ job: { $in: sectorJobIds } })
      : await Application.countDocuments();

    const totalEmployers = await Employer.countDocuments();
    const pendingEmployers = await Employer.countDocuments({ status: "pending" });

    res.json({
      totalUsers, activeUsers,
      totalJobs, pendingJobs, approvedJobs, rejectedJobs,
      totalApplications,
      totalEmployers, pendingEmployers,
      sector: sector || "All"
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Save sector admin notification preferences
router.put("/sector/notifications", auth(["sector_admin", "super_admin"]), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    admin.notificationPrefs = { ...admin.notificationPrefs, ...req.body };
    await admin.save();
    res.json({ msg: "Notification preferences saved", notificationPrefs: admin.notificationPrefs });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get sector admin notification preferences
router.get("/sector/notifications", auth(["sector_admin", "super_admin"]), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    res.json(admin.notificationPrefs || {});
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= MAINTENANCE & SYSTEM CONTROL ================= */
router.get("/logs", auth(["super_admin"]), getSystemLogs);
router.post("/backup", auth(["super_admin"]), triggerBackup);
router.post("/clear-cache", auth(["super_admin"]), clearSystemCache);
router.post("/reset-settings", auth(["super_admin"]), resetSystemSettings);
router.get("/advanced-stats", auth(["super_admin"]), getAdvancedStats);

export default router;

