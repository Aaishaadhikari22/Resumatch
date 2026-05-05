import mongoose from "mongoose";

const applicationDocumentSchema = new mongoose.Schema({
  documentType: { type: String, required: true }, // e.g., "idProof", "education", "certification"
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false }
}, { _id: true });

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employer",
    required: true
  },
  status: {
    type: String,
    enum: ["applied", "reviewed", "accepted", "rejected"],
    default: "applied"
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  
  // Shortlist Flag
  isShortlisted: {
    type: Boolean,
    default: false
  },
  shortlistedAt: { type: Date, default: null },

  // Application Documents
  documents: [applicationDocumentSchema],

  // Applicant Profile Data at Time of Application
  applicantProfileSnapshot: {
    profileCompletionPercentage: { type: Number, default: 0 },
    hasProfilePhoto: { type: Boolean, default: false },
    hasDocuments: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isAddressCompleted: { type: Boolean, default: false },
    missingFields: [String] // Array of missing profile fields
  },

  // Employer Profile Data at Time of Acceptance (if accepted)
  employerProfileSnapshot: {
    profileCompletionPercentage: { type: Number, default: 0 },
    hasDocuments: { type: Boolean, default: false },
    isBusinessVerified: { type: Boolean, default: false },
    missingFields: [String]
  },

  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);
