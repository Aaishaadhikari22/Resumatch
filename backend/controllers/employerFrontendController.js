import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Resume from "../models/Resume.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import fs from "fs";
import { emitNotification, emitDashboardRefreshToUser, emitDashboardRefreshToEmployer, emitDashboardRefreshToAdmins } from "../utils/socketServer.js";
import { calculateSimilarityScore, findMatchingResumes } from "../utils/skillMatching.js";
import { validateEmployerProfile, canEmployerAccept } from "../utils/profileValidator.js";

/* ==================================
   DASHBOARD STATS
================================== */
export const getDashboardStats = async (req, res) => {
  try {
    const employerId = req.user._id;

    const employer = await Employer.findById(employerId).select("-password");
    const totalJobs = await Job.countDocuments({ employer: employerId });
    const totalApplicants = await Application.countDocuments({ employer: employerId });

    // Get per-status counts
    const acceptedCount = await Application.countDocuments({ employer: employerId, status: "accepted" });
    const reviewedCount = await Application.countDocuments({ employer: employerId, status: "reviewed" });
    const activeJobs = await Job.countDocuments({ employer: employerId, jobStatus: "approved" });

    // Recent applications
    const recentAppsData = await Application.find({ employer: employerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("job", "title skillsRequired");

    const recentApplications = await Promise.all(
      recentAppsData.map(async (app) => {
        const resume = await Resume.findOne({ user: app.user._id });
        let similarityScore = 0;
        if (resume && app.job) {
          similarityScore = calculateSimilarityScore(app.job, resume).score;
        }
        return {
          ...app._doc,
          similarityScore,
          resumeTitle: resume ? resume.title : "No resume"
        };
      })
    );

    // Applicant Status Distribution for Chart
    const statusCounts = await Application.aggregate([
      { $match: { employer: employerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const chartData = statusCounts.map(s => ({ name: s._id, value: s.count }));

    res.json({
      employer,
      totalJobs,
      totalApplicants,
      acceptedCount,
      activeJobs,
      recentApplications,
      statusChart: chartData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   POST A NEW JOB
================================== */
export const postJob = async (req, res) => {
  try {
    // Check if employer is approved
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
      return res.status(404).json({ msg: "Employer account not found" });
    }
    if (employer.status !== "approved") {
      return res.status(403).json({ 
        msg: `Your employer account must be approved before posting jobs. Current status: ${employer.status}` 
      });
    }

    const { title, description, skillsRequired, salary, location, city, employmentType, experienceLevel, minExperienceYears, educationLevel, deadline, jobImage, sector } = req.body;

    if (!title || !description) {
      return res.status(400).json({ msg: "Job title and description are required" });
    }

    const job = new Job({
      title,
      description,
      skillsRequired: skillsRequired || [],
      salary: salary || { min: 0, max: 0, currency: "USD" },
      location: location || "",
      city: city || "",
      sector: sector || "",
      employmentType: employmentType || "Full-time",
      experienceLevel: experienceLevel || "Mid-level",
      minExperienceYears: minExperienceYears || 0,
      educationLevel: educationLevel || "Any",
      deadline: deadline || null,
      jobImage: jobImage || {
        fileName: null,
        filePath: null,
        uploadedAt: null
      },
      employer: req.user._id,
      jobStatus: "approved",
      isActive: true
    });

    // If job image provided, update with upload timestamp
    if (jobImage && jobImage.filePath) {
      job.jobImage.uploadedAt = new Date();
    }

    await job.save();

    // Notify matching users and emit real-time updates
    const allResumes = await Resume.find({}, "user skills");
    if (skillsRequired && skillsRequired.length > 0) {
        const matchingResumes = findMatchingResumes(job, allResumes, 50);
        for (const { resume } of matchingResumes) {
            const notification = await Notification.create({
                recipient: resume.user,
                onModel: 'User',
                type: 'job_match',
                title: 'New Job Match!',
                message: `A new job "${title}" matches your skills. Check it out!`,
                link: '/user/recommended'
            });
            emitNotification(resume.user, 'User', notification);
            emitDashboardRefreshToUser(resume.user);
        }
    }

    emitDashboardRefreshToEmployer(req.user._id);
    emitDashboardRefreshToAdmins();

    res.status(201).json({ msg: "Job posted successfully", job });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET MY JOBS
================================== */
export const getMyJobs = async (req, res) => {
  try {
    // We will fetch all jobs to allow frontend sorting and filtering,
    // or just return all and let frontend handle pagination/sorting. 
    // Since we need to calculate avgMatch, doing it without limit first is easier,
    // but let's stick to the existing pagination API or return all if limit is large.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Increased limit to allow frontend sorting
    const skip = (page - 1) * limit;

    const totalJobs = await Job.countDocuments({ employer: req.user._id });

    const jobs = await Job.find({ employer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get applicant count & avg match per job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applications = await Application.find({ job: job._id });
        const applicantCount = applications.length;

        let avgMatch = 0;
        if (applicantCount > 0) {
          const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());
          let totalScore = 0;
          for (const app of applications) {
            const resume = await Resume.findOne({ user: app.user });
            if (resume && job) {
               totalScore += calculateSimilarityScore(job, resume).score;
            }
          }
          avgMatch = Math.round(totalScore / applicantCount);
        }

        return { ...job._doc, applicantCount, avgMatch };
      })
    );

    res.json({
      jobs: jobsWithCounts,
      pagination: {
        page,
        limit,
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET APPLICANTS FOR A JOB
   (with similarity scores)
================================== */
export const getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the job belongs to this employer
    const job = await Job.findOne({ _id: jobId, employer: req.user._id });
    if (!job) {
      return res.status(404).json({ msg: "Job not found or access denied" });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalApplications = await Application.countDocuments({ job: jobId });

    const applications = await Application.find({ job: jobId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute similarity scores
    const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());

    const applicantsWithScores = await Promise.all(
      applications.map(async (app) => {
        const resume = await Resume.findOne({ user: app.user._id });
        let similarityScore = 0;
        let matchedSkills = [];
        let unmatchedSkills = [];

        if (resume && job) {
          const result = calculateSimilarityScore(job, resume);
          similarityScore = result.score;
          matchedSkills = result.matchedSkills;
          unmatchedSkills = result.unmatchedSkills;
        }

        return {
          _id: app._id,
          user: app.user,
          status: app.status,
          isShortlisted: app.isShortlisted || false,
          shortlistedAt: app.shortlistedAt,
          createdAt: app.createdAt,
          similarityScore,
          matchedSkills,
          unmatchedSkills,
          resume: resume ? {
            _id: resume._id,
            title: resume.title,
            skills: resume.skills,
            experience: resume.experience,
            resumeUrl: resume.resumeUrl
          } : null,
          resumeSkills: resume ? resume.skills : [],
          resumeTitle: resume ? resume.title : "No resume",
          experience: resume ? resume.experience : 0
        };
      })
    );

    // Sort by similarity score (highest first)
    applicantsWithScores.sort((a, b) => b.similarityScore - a.similarityScore);

    res.json({
      job: {
        _id: job._id,
        title: job.title,
        description: job.description,
        skillsRequired: job.skillsRequired
      },
      applicants: applicantsWithScores,
      pagination: {
        page,
        limit,
        total: totalApplications,
        pages: Math.ceil(totalApplications / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   UPDATE APPLICATION STATUS
================================== */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["applied", "reviewed", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    // Verify employer owns this application's job
    const job = await Job.findOne({ _id: application.job, employer: req.user._id });
    if (!job) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // If accepting, validate employer profile
    if (status === "accepted") {
      const employer = await Employer.findById(req.user._id);
      const employerChecks = canEmployerAccept(employer);

      if (!employerChecks.allowed) {
        return res.status(400).json({
          msg: "⚠️ Complete your company profile before accepting applications",
          blockers: employerChecks.blockers,
          warnings: employerChecks.warnings,
          completionPercentage: employerChecks.completionPercentage,
          type: "INCOMPLETE_EMPLOYER_PROFILE"
        });
      }

      // Store employer profile snapshot at time of acceptance
      const employerValidation = validateEmployerProfile(employer);
      application.employerProfileSnapshot = {
        profileCompletionPercentage: employerValidation.completionPercentage,
        hasDocuments: employer.documents && employer.documents.length > 0,
        isBusinessVerified: employer.documents && employer.documents.some(d => d.isVerified),
        missingFields: employerValidation.missingFields
      };
      application.acceptedAt = new Date();
    }

    if (status === "rejected") {
      application.rejectedAt = new Date();
    }

    application.status = status;
    await application.save();

    const notification = await Notification.create({
        recipient: application.user,
        onModel: 'User',
        type: 'status_update',
        title: 'Application Status Update',
        message: `Your application for a job has been updated to: ${status}.`,
        link: '/user/applications'
    });

    emitNotification(application.user, 'User', notification);
    emitDashboardRefreshToUser(application.user);
    emitDashboardRefreshToEmployer(req.user._id);
    emitDashboardRefreshToAdmins();

    res.json({ 
      msg: "Application status updated", 
      application,
      warnings: status === "accepted" ? [] : undefined
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET EMPLOYER PROFILE
================================== */
export const getProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id).select("-password");
    if (!employer) return res.status(404).json({ msg: "Employer not found" });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   UPDATE EMPLOYER PROFILE
================================== */
export const updateProfile = async (req, res) => {
  try {
    const { name, companyName, companyDescription, logo, industryType, employeeCount, registrationNumber } = req.body;
    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (name !== undefined) employer.name = name;
    if (companyName !== undefined) employer.companyName = companyName;
    if (companyDescription !== undefined) employer.companyDescription = companyDescription;
    if (logo !== undefined) employer.logo = logo;
    if (industryType !== undefined) employer.industryType = industryType;
    if (employeeCount !== undefined) employer.employeeCount = employeeCount;
    if (registrationNumber !== undefined) employer.registrationNumber = registrationNumber;

    await employer.save();
    res.json({ msg: "Profile updated successfully", employer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   UPDATE CONTACT INFO
================================== */
export const updateContact = async (req, res) => {
  try {
    const { phone, email, website } = req.body;
    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (phone !== undefined) employer.phone = phone;
    if (email !== undefined) employer.email = email;
    if (website !== undefined) employer.website = website;

    await employer.save();
    res.json({ msg: "Contact info updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   CHANGE PASSWORD
================================== */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }

    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    const isMatch = await bcrypt.compare(currentPassword, employer.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    employer.password = await bcrypt.hash(newPassword, salt);
    await employer.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET JOB POSTING PREFERENCES
================================== */
export const getJobPrefs = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id).select("jobPostingPrefs");
    if (!employer) return res.status(404).json({ msg: "Employer not found" });
    res.json(employer.jobPostingPrefs || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   UPDATE JOB POSTING PREFERENCES
================================== */
export const updateJobPrefs = async (req, res) => {
  try {
    const { defaultSector, autoPublish, requireSkills, defaultJobDuration } = req.body;
    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (!employer.jobPostingPrefs) employer.jobPostingPrefs = {};
    if (defaultSector !== undefined) employer.jobPostingPrefs.defaultSector = defaultSector;
    if (autoPublish !== undefined) employer.jobPostingPrefs.autoPublish = autoPublish;
    if (requireSkills !== undefined) employer.jobPostingPrefs.requireSkills = requireSkills;
    if (defaultJobDuration !== undefined) employer.jobPostingPrefs.defaultJobDuration = defaultJobDuration;

    employer.markModified('jobPostingPrefs');
    await employer.save();
    res.json({ msg: "Job posting preferences updated", prefs: employer.jobPostingPrefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET MATCHING RESULTS (all jobs)
================================== */
export const getMatchingResults = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id });
    const allResults = [];

    for (const job of jobs) {
      const applications = await Application.find({ job: job._id })
        .populate("user", "name email");

      const jobSkills = job.skillsRequired || [];

      for (const app of applications) {
        const resume = await Resume.findOne({ user: app.user?._id });
        let similarityScore = 0;
        let matchedSkills = [];
        let unmatchedSkills = [];

        if (resume && job) {
          const result = calculateSimilarityScore(job, resume);
          similarityScore = result.score;
          matchedSkills = result.matchedSkills;
          unmatchedSkills = result.unmatchedSkills;
        }

        allResults.push({
          jobId: job._id,
          jobTitle: job.title,
          applicantName: app.user?.name || "Unknown",
          applicantEmail: app.user?.email || "",
          status: app.status,
          similarityScore,
          matchedSkills,
          unmatchedSkills,
          resumeSkills: resume ? resume.skills : [],
          createdAt: app.createdAt
        });
      }
    }

    allResults.sort((a, b) => b.similarityScore - a.similarityScore);
    res.json(allResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   TOGGLE SHORTLIST FLAG
================================== */
export const toggleShortlist = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    // Verify employer owns this application's job
    const job = await Job.findOne({ _id: application.job, employer: req.user._id });
    if (!job) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Toggle shortlist flag
    application.isShortlisted = !application.isShortlisted;
    if (application.isShortlisted) {
      application.shortlistedAt = new Date();
    } else {
      application.shortlistedAt = null;
    }
    
    await application.save();

    res.json({ 
      msg: application.isShortlisted ? "Candidate shortlisted" : "Candidate removed from shortlist",
      application,
      isShortlisted: application.isShortlisted
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET SHORTLISTED CANDIDATES (manually shortlisted OR ≥70% match)
================================== */
export const getShortlisted = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id });
    const shortlisted = [];

    for (const job of jobs) {
      const applications = await Application.find({ job: job._id })
        .populate("user", "name email");

      const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());

      for (const app of applications) {
        const resume = await Resume.findOne({ user: app.user?._id });
        let similarityScore = 0;
        let matchedSkills = [];
        let unmatchedSkills = [];

        if (resume && job) {
          const result = calculateSimilarityScore(job, resume);
          similarityScore = result.score;
          matchedSkills = result.matchedSkills;
          unmatchedSkills = result.unmatchedSkills;
        }

        // Include if manually shortlisted OR high similarity score
        if (app.isShortlisted || similarityScore >= 70) {
          shortlisted.push({
            _id: app._id,
            jobId: job._id,
            jobTitle: job.title,
            applicantName: app.user?.name || "Unknown",
            applicantEmail: app.user?.email || "",
            status: app.status,
            isShortlisted: app.isShortlisted,
            isAutomatic: similarityScore >= 70 && !app.isShortlisted,
            similarityScore,
            matchedSkills,
            unmatchedSkills,
            resumeSkills: resume ? resume.skills : [],
            experience: resume ? resume.experience : 0,
            createdAt: app.createdAt,
            shortlistedAt: app.shortlistedAt
          });
        }
      }
    }

    shortlisted.sort((a, b) => b.similarityScore - a.similarityScore);
    res.json(shortlisted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   EDIT A JOB
================================== */
export const editJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, skillsRequired, experienceLevel, minExperienceYears, 
      educationLevel, salary, location, city, employmentType, deadline 
    } = req.body;

    const job = await Job.findOne({ _id: id, employer: req.user._id });
    if (!job) return res.status(404).json({ msg: "Job not found or access denied" });

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (skillsRequired !== undefined) job.skillsRequired = skillsRequired;
    if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
    if (minExperienceYears !== undefined) job.minExperienceYears = minExperienceYears;
    if (educationLevel !== undefined) job.educationLevel = educationLevel;
    if (salary !== undefined) job.salary = salary;
    if (location !== undefined) job.location = location;
    if (city !== undefined) job.city = city;
    if (employmentType !== undefined) job.employmentType = employmentType;
    if (deadline !== undefined) job.deadline = deadline;

    await job.save();
    res.json({ msg: "Job updated successfully", job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   DELETE A JOB
================================== */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findOne({ _id: id, employer: req.user._id });
    if (!job) return res.status(404).json({ msg: "Job not found or access denied" });

    if (job.jobImage && job.jobImage.filePath) {
      const imagePath = "." + job.jobImage.filePath;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Application.deleteMany({ job: job._id });
    await Job.findByIdAndDelete(id);

    res.json({ msg: "Job and associated applications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   CLOSE A JOB
================================== */
export const closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findOne({ _id: id, employer: req.user._id });
    if (!job) return res.status(404).json({ msg: "Job not found or access denied" });

    job.isActive = false;
    job.closedAt = new Date();
    await job.save();

    res.json({ msg: "Job closed successfully", job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   GET NOTIFICATION PREFERENCES
================================== */
export const getNotificationPrefs = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id).select("notificationPrefs");
    if (!employer) return res.status(404).json({ msg: "Employer not found" });
    res.json(employer.notificationPrefs || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ==================================
   UPDATE NOTIFICATION PREFERENCES
================================== */
export const updateNotificationPrefs = async (req, res) => {
  try {
    const { newApplicationAlert, matchAlert, applicationStatusChange, weeklyDigest } = req.body;
    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (!employer.notificationPrefs) employer.notificationPrefs = {};
    if (newApplicationAlert !== undefined) employer.notificationPrefs.newApplicationAlert = newApplicationAlert;
    if (matchAlert !== undefined) employer.notificationPrefs.matchAlert = matchAlert;
    if (applicationStatusChange !== undefined) employer.notificationPrefs.applicationStatusChange = applicationStatusChange;
    if (weeklyDigest !== undefined) employer.notificationPrefs.weeklyDigest = weeklyDigest;

    employer.markModified('notificationPrefs');
    await employer.save();
    res.json({ msg: "Notification preferences updated", prefs: employer.notificationPrefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
