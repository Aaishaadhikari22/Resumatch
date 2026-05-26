import mongoose from "mongoose";
import User from "./models/User.js";
import Employer from "./models/Employer.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import Resume from "./models/Resume.js";
import Notification from "./models/Notification.js";
import dotenv from "dotenv";

dotenv.config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Drop existing problematic indexes
    try {
      await Resume.collection.dropIndex("user_1");
    } catch (e) {
      // Index might not exist
    }

    // Clean up duplicate resumes with null user
    await Resume.deleteMany({ user: null });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ isEmailVerified: 1 });

    // Employer indexes
    await Employer.collection.createIndex({ email: 1 }, { unique: true });
    await Employer.collection.createIndex({ status: 1 });
    await Employer.collection.createIndex({ isEmailVerified: 1 });

    // Job indexes
    await Job.collection.createIndex({ employer: 1 });
    await Job.collection.createIndex({ jobStatus: 1 });
    await Job.collection.createIndex({ jobStatus: 1, createdAt: -1 });
    await Job.collection.createIndex({ skillsRequired: 1 });
    await Job.collection.createIndex({ isActive: 1 });

    // Application indexes
    await Application.collection.createIndex({ user: 1 });
    await Application.collection.createIndex({ employer: 1 });
    await Application.collection.createIndex({ job: 1 });
    await Application.collection.createIndex({ status: 1 });
    await Application.collection.createIndex({ user: 1, status: 1 });
    await Application.collection.createIndex({ employer: 1, createdAt: -1 });
    await Application.collection.createIndex({ createdAt: -1 });

    // Resume indexes - NO unique constraint to avoid null issues
    await Resume.collection.createIndex({ user: 1 }, { sparse: true });
    await Resume.collection.createIndex({ skills: 1 });

    // Notification indexes
    await Notification.collection.createIndex({ recipient: 1 });
    await Notification.collection.createIndex({ recipient: 1, createdAt: -1 });

    console.log("✓ All indexes created successfully");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Index creation error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createIndexes();
