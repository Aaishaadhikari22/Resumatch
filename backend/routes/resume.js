import express from "express";
import Resume from "../models/Resume.js";

const router = express.Router();

import Job from "../models/Job.js";
import { calculateSimilarityScore } from "../utils/skillMatching.js";

// GET ALL RESUMES
router.get("/all", async (req, res) => {
  try {
    const resumes = await Resume.find().populate("user", "name email");
    const jobs = await Job.find({ jobStatus: "approved" }); // only active/approved jobs

    const formatted = resumes.map((r) => {
      // Calculate max match score across all active jobs
      let maxMatch = 0;
      if (r.skills && r.skills.length > 0 && jobs.length > 0) {
        for (const job of jobs) {
           const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());
           if (jobSkills.length > 0) {
             const score = calculateSimilarityScore(jobSkills, r.skills).score;
             if (score > maxMatch) maxMatch = score;
           }
        }
      }

      return {
        _id: r._id,
        user: r.user,
        title: r.title,
        experience: r.experience || 0,
        skills: r.skills || [],
        matchScore: maxMatch, // New field!
        resumeUrl: r.resumeUrl,
        createdAt: r.createdAt
      };
    });

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE RESUME
router.delete("/delete/:id", async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;