import User from "../models/User.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import { emitNotification, emitDashboardRefreshToUser, emitDashboardRefreshToEmployer, emitDashboardRefreshToAdmins } from "../utils/socketServer.js";
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
    if (resume) {
      const activeJobs = await Job.find({ jobStatus: "approved" });
      
      activeJobs.forEach(job => {
        const matchResult = calculateComprehensiveMatch(job, resume);
        if (matchResult.totalScore >= 50) matchedJobsCount++; // 50% or above threshold
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
    res.json(resume || { 
      skills: [], experience: 0, 
      workExperiences: [], educationHistory: [], languages: [] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to generate extracted text from resume and profile data
const buildExtractedText = (user, skills, workExperiences, educationHistory, languages) => {
  const extractedTextParts = [];

  if (user?.name) extractedTextParts.push(`Name: ${user.name}`);
  if (user?.headline) extractedTextParts.push(`Headline: ${user.headline}`);
  if (user?.bio) extractedTextParts.push(`Summary: ${user.bio}`);
  if (user?.phone) extractedTextParts.push(`Phone: ${user.phone}`);
  if (user?.email) extractedTextParts.push(`Email: ${user.email}`);
  if (user?.city) extractedTextParts.push(`Location: ${user.city}`);

  if (skills && skills.length > 0) {
    extractedTextParts.push(`Skills: ${skills.join(", ")}`);
  }

  if (workExperiences && workExperiences.length > 0) {
    extractedTextParts.push("Work Experience:");
    workExperiences.forEach(exp => {
      const start = exp.startDate ? new Date(exp.startDate).getFullYear() : "";
      const end = exp.endDate ? new Date(exp.endDate).getFullYear() : "Present";
      extractedTextParts.push(`${exp.position || ""} at ${exp.company || ""} (${start} - ${end})`);
      if (exp.description) extractedTextParts.push(exp.description);
    });
  }

  if (educationHistory && educationHistory.length > 0) {
    extractedTextParts.push("Education:");
    educationHistory.forEach(edu => {
      extractedTextParts.push(`${edu.degree || ""} in ${edu.fieldOfStudy || ""} from ${edu.institution || ""}`);
    });
  }

  if (languages && languages.length > 0) {
    extractedTextParts.push(`Languages: ${languages.join(", ")}`);
  }

  return extractedTextParts.filter(Boolean).join(" ");
};

// Update/Create Resume Skills and Info - Auto-generates resume from profile
export const updateResume = async (req, res) => {
  try {
    const { 
      title, skills, experience, education, resumeUrl,
      workExperiences, educationHistory, languages, expectedSalary 
    } = req.body;
    
    const user = await User.findById(req.user._id);
    let resume = await Resume.findOne({ user: req.user._id });

    const extractedText = buildExtractedText(user, skills || [], workExperiences || [], educationHistory || [], languages || []);

    if (resume) {
      resume.title = title || resume.title || user?.headline || "My Resume";
      resume.skills = skills || resume.skills;
      resume.experience = experience !== undefined ? experience : resume.experience;
      resume.education = education || resume.education;
      
      if (resumeUrl) {
        resume.resumeUrl = resumeUrl;
      } else if (resume.resumeUrl === "pending" || !resume.resumeUrl) {
        resume.resumeUrl = "auto-generated";
      }
      
      resume.extractedText = extractedText;
      
      if (workExperiences !== undefined) resume.workExperiences = workExperiences;
      if (educationHistory !== undefined) resume.educationHistory = educationHistory;
      if (languages !== undefined) resume.languages = languages;
      if (expectedSalary !== undefined) resume.expectedSalary = expectedSalary;

      await resume.save();
    } else {
      resume = new Resume({
        user: req.user._id,
        title: title || user?.headline || "My Resume",
        skills: skills || [],
        experience: experience || 0,
        education: education || "Any",
        resumeUrl: resumeUrl || "auto-generated",
        extractedText: extractedText,
        workExperiences: workExperiences || [],
        educationHistory: educationHistory || [],
        languages: languages || [],
        expectedSalary: expectedSalary || 0
      });
      await resume.save();
    }

    res.json({ msg: "Resume updated successfully", resume });
  } catch (err) {
    console.error(err);
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
      if (resume) {
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

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: "Job not found." });
    }

    const employerRef = job.employer || employerId;
    if (!employerRef) {
      return res.status(400).json({ msg: "Employer not found for this job." });
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

    const matchResult = calculateComprehensiveMatch(job, resume);

    const application = new Application({
      user: req.user._id,
      job: jobId,
      employer: employerRef,
      status: "applied",
      similarityScore: matchResult.totalScore,
      applicantProfileSnapshot: profileValidation.snapshot,
      documents: user.documents || []
    });

    await application.save();

    const notification = await Notification.create({
      recipient: employerRef,
      onModel: 'Employer',
      type: 'new_applicant',
      title: 'New Job Application',
      message: `A candidate has applied for your job listing.`,
      link: `/employer/applicants`
    });

    emitNotification(employerRef, 'Employer', notification);
    emitDashboardRefreshToEmployer(employerRef);
    emitDashboardRefreshToAdmins();
    emitDashboardRefreshToUser(req.user._id);

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
      if (app.similarityScore !== undefined && app.similarityScore !== null) {
        return { ...app._doc, similarityScore: app.similarityScore };
      }

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
