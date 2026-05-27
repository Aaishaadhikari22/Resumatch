import express from "express";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import { calculateSimilarityScore } from "../utils/skillMatching.js";
import { generateResumeHTML } from "../utils/resumeGenerator.js";
import { generatePDFFromHTML } from "../utils/pdfGenerator.js";
import { getAvailableFormats, isValidFormat } from "../utils/resumeFormats.js";
import { authenticateJWT } from "../middleware/auth.js";
import { checkUserJobSeekerPermission } from "../middleware/checkPermissionUniversal.js";

const buildResumeFallback = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) return null;

  const resume = await Resume.findOne({ user: userId }).lean();
  if (resume) {
    return { user, resume };
  }

  return {
    user,
    resume: {
      user: userId,
      title: user.headline || "My Resume",
      skills: [],
      experience: 0,
      education: "Any",
      resumeUrl: "auto-generated",
      extractedText: "",
      expectedSalary: 0,
      languages: [],
      workExperiences: [],
      educationHistory: []
    }
  };
};

const router = express.Router();

/* ================= GET ALL RESUMES ================= */
router.get("/all", async (req, res) => {
  try {
    const resumes = await Resume.find().populate("user", "name email");
    const jobs = await Job.find({ jobStatus: "approved" }); // only active/approved jobs

    const formatted = resumes.map((r) => {
      // Calculate max match score across all active jobs
      let maxMatch = 0;
      let bestMatchDetails = null;
      if (r.skills && r.skills.length > 0 && jobs.length > 0) {
        for (const job of jobs) {
          if ((job.skillsRequired || []).length > 0) {
            const result = calculateSimilarityScore(job, r);
            const score = result.score;
            if (score > maxMatch) {
              maxMatch = score;
              bestMatchDetails = {
                jobId: job._id,
                jobTitle: job.title,
                score,
                matchedSkills: result.matchedSkills || [],
                unmatchedSkills: result.unmatchedSkills || []
              };
            }
          }
        }
      }

      return {
        _id: r._id,
        user: r.user,
        title: r.title,
        experience: r.experience || 0,
        skills: r.skills || [],
        matchScore: maxMatch,
        bestMatch: bestMatchDetails,
        resumeUrl: r.resumeUrl,
        createdAt: r.createdAt
      };
    });

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET AVAILABLE RESUME FORMATS ================= */
router.get("/formats/available", async (req, res) => {
  try {
    const formats = getAvailableFormats();
    res.json({
      total: formats.length,
      formats: formats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= DOWNLOAD RESUME IN SPECIFIC FORMAT AS PDF ================= */
router.get(
  "/download/:format",
  authenticateJWT,
  checkUserJobSeekerPermission("view_own_profile"),
  async (req, res) => {
    try {
      const { format } = req.params;
      const userId = req.user._id;

      // Validate format
      if (!isValidFormat(format)) {
        return res.status(400).json({ 
          message: `Invalid format: ${format}. Supported formats: US, UK, INDIA, CANADA, AUSTRALIA` 
        });
      }

      const data = await buildResumeFallback(userId);
      if (!data || !data.user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { user, resume } = data;
      const htmlContent = generateResumeHTML(user, resume, format);

      // Convert to PDF
      const pdfBuffer = await generatePDFFromHTML(htmlContent);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Resume_${user.name}_${format}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/* ================= GET RESUME HTML PREVIEW ================= */
router.get(
  "/preview/:format",
  authenticateJWT,
  async (req, res) => {
    try {
      const { format } = req.params;
      const userId = req.user._id;

      // Validate format
      if (!isValidFormat(format)) {
        return res.status(400).json({ 
          message: `Invalid format: ${format}` 
        });
      }

      const data = await buildResumeFallback(userId);
      if (!data || !data.user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { user, resume } = data;
      const htmlContent = generateResumeHTML(user, resume, format);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ================= DELETE RESUME ================= */
router.delete("/delete/:id", async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;