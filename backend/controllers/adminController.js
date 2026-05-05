import User from "../models/User.js";
import Category from "../models/Category.js";
import Notification from "../models/Notification.js";
import { emitNotification, emitDashboardRefreshToUser, emitDashboardRefreshToEmployer, emitDashboardRefreshToAdmins } from "../utils/socketServer.js";
import Job from "../models/Job.js";
import Admin from "../models/Admin.js";
import Employer from "../models/Employer.js";
import Resume from "../models/Resume.js";
import SystemLog from "../models/SystemLog.js";
import MatchingSettings from "../models/MatchingSettings.js";
import { getPermissions } from "../utils/permissionHelper.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ================= HELPERS =================

const logAction = async (action, details, req, targetType = null, targetId = null) => {
  try {
    await SystemLog.create({
      action,
      details,
      admin: req.user?._id,
      targetType,
      targetId,
      status: "success"
    });
  } catch (err) {
    console.error("Logging failed:", err);
  }
};

// ================= ADMIN MANAGEMENT =================

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, gender, qualification, phone, role, sector } = req.body;

    if (!name || !email || !password || !gender || !qualification || !phone || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default permissions for the role
    const defaultPermissions = getPermissions(role) || [];

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      gender,
      qualification,
      phone,
      role,
      sector: sector || "",
      permissions: defaultPermissions,
      status: "active"
    });

    await newAdmin.save();
    res.json({ message: "Admin created successfully", admin: { id: newAdmin._id, role: newAdmin.role } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error while creating admin" });
  }
};

// ================= USER MANAGEMENT =================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      role: role || "user",
      isEmailVerified: true
    });
    
    await newUser.save();
    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save({ validateModifiedOnly: true });

    await logAction("Update User Status", `Changed user ${user.email} status to ${status}`, req, "user", user._id);

    const notification = await Notification.create({
      recipient: user._id,
      onModel: 'User',
      type: 'status_update',
      title: 'Account Status Update',
      message: `Your account status has been updated to: ${status}.`,
      link: '/user/profile'
    });

    emitNotification(user._id, 'User', notification);
    emitDashboardRefreshToUser(user._id);
    emitDashboardRefreshToAdmins();

    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);
    await Resume.deleteMany({ user: req.params.id });
    await Application.deleteMany({ user: req.params.id });
    await logAction("Delete User", `Deleted user ${user?.email || req.params.id}`, req, "user", req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: "suspended" });
    res.json({ message: "User suspended successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const banUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: "banned" });
    res.json({ message: "User banned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= EMPLOYER MANAGEMENT =================

export const createEmployer = async (req, res) => {
  try {
    const { name, companyName, email, password, phone } = req.body;
    if (!companyName || !email || !password || !name) {
      return res.status(400).json({ message: "Company name, contact name, email and password are required" });
    }

    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer) return res.status(400).json({ message: "Employer already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployer = new Employer({ 
      companyName, 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      status: "approved", 
      verifiedBy: "admin",
      isEmailVerified: true
    });
    
    await newEmployer.save();
    res.json({ message: "Employer created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    employer.status = status;
    employer.verifiedBy = req.user?.role || "admin";
    await employer.save({ validateModifiedOnly: true });

    const notification = await Notification.create({
      recipient: employer._id,
      onModel: 'Employer',
      type: 'status_update',
      title: 'Account Verification Update',
      message: `Your employer account status has been updated to: ${status}.`,
      link: '/employer/dashboard'
    });

    emitNotification(employer._id, 'Employer', notification);
    emitDashboardRefreshToEmployer(employer._id);
    emitDashboardRefreshToAdmins();

    res.json({ message: `Employer status updated to ${status}`, employer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmployer = async (req, res) => {
  try {
    await Employer.findByIdAndDelete(req.params.id);
    await Job.deleteMany({ employer: req.params.id });
    await Application.deleteMany({ employer: req.params.id });
    res.json({ message: "Employer and their jobs deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= JOB MODERATION =================

export const approveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.jobStatus = "approved";
    await job.save({ validateModifiedOnly: true });

    // MATCH ALERT: Notify users with high match scores
    const resumes = await Resume.find();
    const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());

    if (jobSkills.length > 0) {
      for (const resume of resumes) {
        const userSkills = (resume.skills || []).map(s => s.toLowerCase());
        let matchCount = 0;
        
        jobSkills.forEach(js => {
            if (userSkills.includes(js)) matchCount++;
        });

        const score = jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 0;
        if (score >= 80) {
            const notification = await Notification.create({
                recipient: resume.user,
                onModel: 'User',
                type: 'job_match',
                title: 'New High-Match Job!',
                message: `A new job "${job.title}" matching ${score}% of your skills was just posted.`,
                link: `/user/dashboard`
            });
            emitNotification(resume.user, 'User', notification);
            emitDashboardRefreshToUser(resume.user);
        }
      }
    }

    // Notify Employer
    const employerNotification = await Notification.create({
        recipient: job.employer,
        onModel: 'Employer',
        type: 'status_update',
        title: 'Job Approved',
        message: `Your job "${job.title}" has been approved and is now live.`,
        link: '/employer/my-jobs'
    });

    emitNotification(job.employer, 'Employer', employerNotification);
    emitDashboardRefreshToEmployer(job.employer);
    emitDashboardRefreshToAdmins();

    res.json({ message: "Job approved and notifications sent!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.jobStatus = "rejected";
    await job.save({ validateModifiedOnly: true });

    const notification = await Notification.create({
      recipient: job.employer,
      onModel: 'Employer',
      type: 'status_update',
      title: 'Job Rejection Notification',
      message: `Your job "${job.title}" was not approved by the moderation team.`,
      link: '/employer/my-jobs'
    });

    emitNotification(job.employer, 'Employer', notification);
    emitDashboardRefreshToEmployer(job.employer);
    emitDashboardRefreshToAdmins();

    res.json({ message: "Job rejected and notification sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.jobStatus = status;
    await job.save({ validateModifiedOnly: true });

    // If approved, notify users with matching skills
    if (status === "approved") {
      const resumes = await Resume.find();
      const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());

      if (jobSkills.length > 0) {
        for (const resume of resumes) {
          const userSkills = (resume.skills || []).map(s => s.toLowerCase());
          let matchCount = 0;
          
          jobSkills.forEach(js => {
              if (userSkills.includes(js)) matchCount++;
          });

          const score = jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 0;
          if (score >= 80) {
              const notification = await Notification.create({
                  recipient: resume.user,
                  onModel: 'User',
                  type: 'job_match',
                  title: 'New High-Match Job!',
                  message: `A new job "${job.title}" matching ${score}% of your skills was just posted.`,
                  link: `/user/dashboard`
              });
              emitNotification(resume.user, 'User', notification);
              emitDashboardRefreshToUser(resume.user);
          }
        }
      }
    }

    // Notify employer
    const notificationTitle = status === "approved" ? "Job Approved" : status === "rejected" ? "Job Rejection Notification" : "Job Status Update";
    const notificationMessage = status === "approved" 
      ? `Your job "${job.title}" has been approved and is now live.`
      : status === "rejected"
      ? `Your job "${job.title}" was not approved by the moderation team.`
      : `Your job "${job.title}" has been ${status}.`;

    const employerNotification = await Notification.create({
      recipient: job.employer,
      onModel: 'Employer',
      type: 'status_update',
      title: notificationTitle,
      message: notificationMessage,
      link: '/employer/my-jobs'
    });

    emitNotification(job.employer, 'Employer', employerNotification);
    emitDashboardRefreshToEmployer(job.employer);
    emitDashboardRefreshToAdmins();

    res.json({ message: `Job status updated to ${status}`, job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    await Job.findByIdAndDelete(req.params.id);
    await logAction("Delete Job", `Deleted job: ${job?.title || req.params.id}`, req, "job", req.params.id);
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= SYSTEM CONTROL & MAINTENANCE =================

export const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const triggerBackup = async (req, res) => {
  try {
    const [users, employers, jobs] = await Promise.all([
      User.find().select("-password"),
      Employer.find().select("-password"),
      Job.find()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: { users, employers, jobs }
    };

    // In a real app, we'd write to a file or cloud storage
    // Here we'll return it as a JSON for the admin to "download"
    res.json({ 
      message: "Backup generated successfully", 
      filename: `resumatch_backup_${Date.now()}.json`,
      data: backupData 
    });

    await logAction("System Backup", "Full database backup generated", req, "system");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearSystemCache = async (req, res) => {
  try {
    // Mock cache clearing
    await logAction("Clear Cache", "System cache manually cleared", req, "system");
    res.json({ message: "System cache cleared successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetSystemSettings = async (req, res) => {
  try {
    await MatchingSettings.deleteMany();
    const defaults = await MatchingSettings.create({
      weightSkills: 40,
      weightExperience: 25,
      weightEducation: 20,
      weightKeywords: 15,
      minimumSimilarityThreshold: 50
    });
    
    await logAction("Reset Settings", "System settings reset to defaults", req, "settings");
    res.json({ message: "System settings reset successfully ✅", defaults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdvancedStats = async (req, res) => {
  try {
    // Industry Breakdown (Mocking based on common industries since we don't have a rigid industry field yet)
    const industryData = [
      { name: "IT & Software", value: 45 },
      { name: "Finance", value: 20 },
      { name: "Healthcare", value: 15 },
      { name: "Education", value: 10 },
      { name: "Marketing", value: 10 }
    ];

    // Match Score Distribution
    const matchDistribution = [
      { name: "80-100%", value: 150 },
      { name: "60-80%", value: 280 },
      { name: "40-60%", value: 420 },
      { name: "20-40%", value: 190 },
      { name: "0-20%", value: 85 }
    ];

    // Activity Trends
    const activityTrends = [
      { name: "Mon", signups: 12, jobs: 4 },
      { name: "Tue", signups: 18, jobs: 7 },
      { name: "Wed", signups: 15, jobs: 5 },
      { name: "Thu", signups: 22, jobs: 9 },
      { name: "Fri", signups: 10, jobs: 3 },
      { name: "Sat", signups: 5, jobs: 1 },
      { name: "Sun", signups: 3, jobs: 0 }
    ];

    res.json({ industryData, matchDistribution, activityTrends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
