import User from "../models/User.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import { calculateComprehensiveMatch } from "../utils/skillMatching.js";
import { validateUserProfile, canUserApply } from "../utils/profileValidator.js";

/* ==================================
   DASHBOARD STATS
================================== */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    let resume = await Resume.findOne({ user: userId });
    const applicationsCount = await Application.countDocuments({ user: userId });
    
    // Find matched jobs conceptually
    let matchedJobsCount = 0;
    if (resume && resume.skills && resume.skills.length > 0) {
      const activeJobs = await Job.find({ status: "approved" });
      const userSkills = resume.skills.map(s => s.toLowerCase());
      
      activeJobs.forEach(job => {
        const jobDesc = ((job.title || "") + " " + (job.description || "")).toLowerCase();
        let matchCount = 0;
        userSkills.forEach(skill => {
          if (jobDesc.includes(skill)) matchCount++;
        });
        const score = Math.round((matchCount / userSkills.length) * 100);
        if (score >= 50) matchedJobsCount++; // 50% or above threshold
      });
    }

    // Application Status Distribution for Chart
    const statusCounts = await Application.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const statusLabels = {
      applied: "Pending",
      reviewed: "Under Review", 
      accepted: "Accepted",
      rejected: "Rejected"
    };
    
    const chartData = statusCounts.map(s => ({ 
      name: statusLabels[s._id] || s._id, 
      value: s.count 
    }));

    res.json({
      user,
      resumeExists: !!resume,
      applicationsCount,
      matchedJobsCount,
      savedJobsCount: user?.savedJobs ? user.savedJobs.length : 0,
      statusChart: chartData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   RESUME MANAGEMENT
================================== */
// Get Resume
export const getMyResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    res.json(resume || { skills: [], experience: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update/Create Resume Skills and Info
export const updateResume = async (req, res) => {
  try {
    const { title, skills, experience, education, resumeUrl } = req.body;
    let resume = await Resume.findOne({ user: req.user._id });

    if (resume) {
      resume.title = title || resume.title;
      resume.skills = skills || resume.skills;
      resume.experience = experience !== undefined ? experience : resume.experience;
      resume.education = education || resume.education;
      if (resumeUrl) resume.resumeUrl = resumeUrl;
      await resume.save();
    } else {
      resume = new Resume({
        user: req.user._id,
        title: title || "My Resume",
        skills: skills || [],
        experience: experience || 0,
        education: education || "Any",
        resumeUrl: resumeUrl || "pending"
      });
      await resume.save();
    }

    res.json({ msg: "Resume updated successfully", resume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   JOB RECOMMENDATIONS (SIMILARITY)
================================== */
export const getRecommendedJobs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activeJobs = await Job.find({ jobStatus: "approved" })
      .populate("employer", "companyName logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments({ jobStatus: "approved" });

    // Fetch user's applications to check applied status
    const userApplications = await Application.find({ user: req.user._id }).select("job");
    const appliedJobIds = new Set(userApplications.map(app => app.job.toString()));

    const resume = await Resume.findOne({ user: req.user._id });

    const recommendedJobs = activeJobs.map(job => {
      let matchResult = { totalScore: 0, breakdown: {}, details: {} };
      if (resume && resume.skills && resume.skills.length > 0) {
        matchResult = calculateComprehensiveMatch(job, resume);
      }
      
      return {
        ...job._doc,
        similarityScore: matchResult.totalScore,
        matchBreakdown: matchResult.breakdown,
        matchDetails: matchResult.details,
        isApplied: appliedJobIds.has(job._id.toString())
      };
    });

    res.json({
      jobs: recommendedJobs,
      pagination: {
        page,
        limit,
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   APPLICATIONS
================================== */
export const applyForJob = async (req, res) => {
  try {
    const { jobId, employerId } = req.body;
    
    // Check if previously applied
    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      return res.status(400).json({ msg: "You have already applied for this job." });
    }

    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      return res.status(400).json({ msg: "Please create a resume before applying." });
    }

    // Validate user profile completeness
    const user = await User.findById(req.user._id);
    const profileValidation = validateUserProfile(user);
    const applicationChecks = canUserApply(user);

    // If there are blocking errors, prevent application
    if (!applicationChecks.allowed) {
      return res.status(400).json({ 
        msg: "❌ Complete your profile before applying",
        blockers: applicationChecks.blockers,
        warnings: applicationChecks.warnings,
        completionPercentage: applicationChecks.completionPercentage,
        type: "INCOMPLETE_PROFILE"
      });
    }

    const application = new Application({
      user: req.user._id,
      job: jobId,
      employer: employerId,
      status: "applied",
      applicantProfileSnapshot: profileValidation.snapshot,
      documents: user.documents || []
    });

    await application.save();

    await Notification.create({
      recipient: employerId,
      onModel: 'Employer',
      type: 'new_applicant',
      title: 'New Job Application',
      message: `A candidate has applied for your job listing.`,
      link: `/employer/applicants`
    });

    // Return application with any warnings
    res.json({ 
      msg: "✓ Successfully applied to job!",
      application: application._id,
      warnings: applicationChecks.warnings,
      completionPercentage: applicationChecks.completionPercentage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate("job")
      .populate("employer", "companyName email");

    const resume = await Resume.findOne({ user: req.user._id });
    
    if (!resume) {
      return res.json(applications);
    }

    const appsWithScore = applications.map(app => {
      let score = 0;
      if (app.job) {
         const matchResult = calculateComprehensiveMatch(app.job, resume);
         score = matchResult.totalScore;
      }
      return { ...app._doc, similarityScore: score };
    });

    res.json(appsWithScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   SAVED JOBS
================================== */
export const saveJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }
    
    res.json({ msg: "Job saved successfully", savedJobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    await user.save();
    
    res.json({ msg: "Job removed from saved list", savedJobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedJobs",
      populate: { path: "employer", select: "companyName logo" }
    });
    
    if (!user) return res.status(404).json({ msg: "User not found" });

    const resume = await Resume.findOne({ user: req.user._id });

    if (!resume) {
      return res.json(user.savedJobs || []);
    }

    const savedJobsWithScore = (user.savedJobs || []).map(job => {
      const matchResult = calculateComprehensiveMatch(job, resume);
      return { ...job._doc, similarityScore: matchResult.totalScore };
    });
    
    res.json(savedJobsWithScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
