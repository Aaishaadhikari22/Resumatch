import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
    required: true
  },
  onModel: {
    type: String,
    required: true,
    enum: ['User', 'Employer', 'Admin']
  },
  type: {
    type: String,
    required: true,
    enum: ['job_match', 'new_applicant', 'status_update', 'system']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ""
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
