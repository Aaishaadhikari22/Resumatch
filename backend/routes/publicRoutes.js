import express from "express";
import Job from "../models/Job.js";

const router = express.Router();

router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ jobStatus: "approved", isActive: true })
      .populate("employer", "companyName logo")
      .sort({ createdAt: -1 })
      .lean();

    const formattedJobs = jobs.map((job) => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      sector: job.sector,
      skillsRequired: job.skillsRequired,
      employer: job.employer,
      salary: job.salary,
      location: job.location || job.city || "Remote",
      employmentType: job.employmentType,
      createdAt: job.createdAt,
    }));

    res.json(formattedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
