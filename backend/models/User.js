import mongoose from "mongoose";

const profileDocumentSchema = new mongoose.Schema({
  documentType: { type: String, enum: ["id", "passport", "license", "certificate", "other"], required: true },
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verifiedBy: String
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  sector: { type: String, default: "" },
  status: { type: String, default: "active" },

  // Profile Information
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say", ""], default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  dateOfBirth: { type: Date, default: null },
  profilePhoto: { type: String, default: "" },
  bio: { type: String, default: "" },
  
  // Profile Documents
  documents: [profileDocumentSchema],
  
  // Profile Completion Status
  profileCompletion: {
    isProfilePhotoUploaded: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isAddressCompleted: { type: Boolean, default: false },
    isDocumentsUploaded: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0 } // 0-100
  },

  notificationPrefs: {
    jobAlerts: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    matchNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
