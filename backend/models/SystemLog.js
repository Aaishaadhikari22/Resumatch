import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  targetType: { type: String }, // e.g., "user", "employer", "job", "settings"
  targetId: { type: String },
  status: { type: String, default: "success" },
  createdAt: { type: Date, default: Date.now }
});

const SystemLog = mongoose.model("SystemLog", systemLogSchema);
export default SystemLog;
