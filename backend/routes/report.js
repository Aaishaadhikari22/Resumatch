import express from "express";
import User from "../models/User.js";
import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Resume from "../models/Resume.js";
import Category from "../models/Category.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();
    const employers = await Employer.countDocuments();
    const jobs = await Job.countDocuments();
    const applications = await Application.countDocuments();
    const resumes = await Resume.countDocuments();
    
    const activeEmployers = await Employer.countDocuments({ status: "approved" });
    const pendingEmployers = await Employer.countDocuments({ status: "pending" });

    // 1. Success Rate
    const acceptedCount = await Application.countDocuments({ status: "accepted" });
    const successRate = applications > 0 ? ((acceptedCount / applications) * 100).toFixed(1) : 0;

    // 2. Top Skills (Jobs)
    const allJobs = await Job.find({}, "skillsRequired");
    const skillCounts = {};
    allJobs.forEach(j => {
      (j.skillsRequired || []).forEach(skill => {
        const s = skill.toLowerCase().trim();
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // 3. Job Trends (Last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await Job.countDocuments({ createdAt: { $gte: d, $lt: nextD } });
      trends.push({ name: monthNames[d.getMonth()], value: count });
    }

    // 4. Matches (Simplification: Count applications for the stats)
    const totalMatches = applications; // Since every application is a match attempt

    res.json({
      users,
      employers,
      jobs,
      applications,
      resumes,
      activeEmployers,
      pendingEmployers,
      successRate,
      topSkills,
      jobTrends: trends,
      totalMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;