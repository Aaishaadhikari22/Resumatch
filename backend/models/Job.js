import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  jobStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", "flagged"],
    default: "pending"
  },

  reportsCount: {
    type: Number,
    default: 0
  },

  title: String,
  description: String,
  sector: { type: String, default: "" },
  skillsRequired: [String],
  
  // Experience & Education Requirements
  experienceLevel: {
    type: String,
    enum: ["Entry Level", "Junior", "Mid-level", "Senior", "Lead", "Executive"],
    default: "Mid-level"
  },
  minExperienceYears: {
    type: Number,
    default: 0
  },
  educationLevel: {
    type: String,
    enum: ["High School", "Associate", "Bachelor's", "Master's", "Ph.D.", "Any"],
    default: "Any"
  },
  
  // Job Details
  salary: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: "USD" }
  },
  location: { type: String, default: "" },
  city: { type: String, default: "" },
  employmentType: { 
    type: String, 
    enum: ["Full-time", "Part-time", "Contract", "Temporary", "Freelance"],
    default: "Full-time"
  },
  deadline: { type: Date, default: null },
  
  // Job Status
  isActive: {
    type: Boolean,
    default: true
  },
  closedAt: { type: Date, default: null },
  
  // Job Image
  jobImage: {
    fileName: { type: String, default: null },
    filePath: { type: String, default: null },
    uploadedAt: { type: Date, default: null }
  },
  
  employer: { type: mongoose.Schema.Types.ObjectId, ref: "Employer" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Job", jobSchema);
