import mongoose from "mongoose";

const matchingSettingsSchema = new mongoose.Schema({
  // Algorithm weights (must sum to 100)
  weightSkills: { type: Number, default: 40 },
  weightExperience: { type: Number, default: 25 },
  weightEducation: { type: Number, default: 20 },
  weightKeywords: { type: Number, default: 15 },

  // Similarity threshold
  minimumSimilarityThreshold: { type: Number, default: 50 },

  // Registration controls
  userRegistrationEnabled: { type: Boolean, default: true },
  employerRegistrationEnabled: { type: Boolean, default: true },
  jobPostingEnabled: { type: Boolean, default: true },

  // Employer verification
  autoApproveEmployers: { type: Boolean, default: false },

  // System limits
  maxResumeSize: { type: Number, default: 5 },  // MB
  maxJobsPerEmployer: { type: Number, default: 50 },
  maxApplicationsPerUser: { type: Number, default: 100 },

  // Notification controls
  emailAlertsOnRegistration: { type: Boolean, default: true },
  emailAlertsOnJobPosting: { type: Boolean, default: false },
  matchAlerts: { type: Boolean, default: true },
  weeklyReportSummary: { type: Boolean, default: true },

  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("MatchingSettings", matchingSettingsSchema);
