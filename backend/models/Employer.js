import mongoose from "mongoose";

const employerDocumentSchema = new mongoose.Schema({
  documentType: { type: String, enum: ["registrationCertificate", "taxId", "businessLicense", "verificationDoc", "other"], required: true },
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verifiedBy: String
}, { _id: true });

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "employer" },
  status: { type: String, default: "pending" }, // pending / approved / rejected
  verifiedBy: String,

  // Company profile
  companyDescription: { type: String, default: "" },
  phone: { type: String, default: "" },
  website: { type: String, default: "" },
  logo: { type: String, default: "" },
  registrationNumber: { type: String, default: "" },
  industryType: { type: String, default: "" },
  employeeCount: { type: String, default: "" },

  // Official Documents
  documents: [employerDocumentSchema],

  // Profile Completion Status
  profileCompletion: {
    isLogoUploaded: { type: Boolean, default: false },
    isCompanyDetailsCompleted: { type: Boolean, default: false },
    isDocumentsUploaded: { type: Boolean, default: false },
    isContactVerified: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0 } // 0-100
  },

  // Job posting preferences
  jobPostingPrefs: {
    defaultSector: { type: String, default: "" },
    autoPublish: { type: Boolean, default: false },
    requireSkills: { type: Boolean, default: true },
    defaultJobDuration: { type: Number, default: 30 }
  },

  // Notification preferences
  notificationPrefs: {
    newApplicationAlert: { type: Boolean, default: true },
    matchAlert: { type: Boolean, default: true },
    applicationStatusChange: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Employer", employerSchema);
