import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  gender: {
    type: String,
    required: true
  },

  qualification: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["super_admin", "sector_admin", "employer_manager", "moderator", "support"],
    required: true
  },

  sector: {
    type: String,
    default: ""
  },

  permissions: {
    type: [String],
    default: []
  },

  notificationPrefs: {
    newJobPosting: { type: Boolean, default: true },
    newApplication: { type: Boolean, default: true },
    employerActivity: { type: Boolean, default: false },
    weeklyDigest: { type: Boolean, default: true }
  },

  status: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "active"
  },

  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null }

}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);