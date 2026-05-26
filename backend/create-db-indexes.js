import mongoose from "mongoose";
import dotenv from "dotenv";

// Import all models
import User from "./models/User.js";
import Employer from "./models/Employer.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import Resume from "./models/Resume.js";
import Notification from "./models/Notification.js";
import Category from "./models/Category.js";

dotenv.config();

const createIndexes = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/resumatch", {
      maxPoolSize: 10,
    });
    
    console.log("🔄 Creating database indexes...");

    // Helper to safely create indexes
    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        await collection.createIndex(indexSpec, options);
        return true;
      } catch (e) {
        if (e.code === 86) {
          // Index already exists - this is fine
          return false;
        }
        throw e;
      }
    };

    // User indexes
    await createIndexSafely(User.collection, { email: 1 }, { unique: true });
    await createIndexSafely(User.collection, { createdAt: -1 });
    await createIndexSafely(User.collection, { savedJobs: 1 });
    console.log("✓ User indexes created");

    // Employer indexes
    await createIndexSafely(Employer.collection, { email: 1 }, { unique: true });
    await createIndexSafely(Employer.collection, { status: 1 });
    await createIndexSafely(Employer.collection, { createdAt: -1 });
    console.log("✓ Employer indexes created");

    // Job indexes
    await createIndexSafely(Job.collection, { employer: 1 });
    await createIndexSafely(Job.collection, { jobStatus: 1 });
    await createIndexSafely(Job.collection, { createdAt: -1 });
    await createIndexSafely(Job.collection, { skillsRequired: 1 });
    await createIndexSafely(Job.collection, { employer: 1, jobStatus: 1 });
    console.log("✓ Job indexes created");

    // Application indexes
    await createIndexSafely(Application.collection, { user: 1 });
    await createIndexSafely(Application.collection, { employer: 1 });
    await createIndexSafely(Application.collection, { job: 1 });
    await createIndexSafely(Application.collection, { status: 1 });
    await createIndexSafely(Application.collection, { createdAt: -1 });
    await createIndexSafely(Application.collection, { user: 1, status: 1 });
    await createIndexSafely(Application.collection, { employer: 1, status: 1 });
    console.log("✓ Application indexes created");

    // Resume indexes
    await createIndexSafely(Resume.collection, { user: 1 }, { sparse: true });
    await createIndexSafely(Resume.collection, { createdAt: -1 });
    console.log("✓ Resume indexes created");

    // Notification indexes
    await createIndexSafely(Notification.collection, { recipient: 1 });
    await createIndexSafely(Notification.collection, { createdAt: -1 });
    await createIndexSafely(Notification.collection, { read: 1 });
    await createIndexSafely(Notification.collection, { recipient: 1, read: 1 });
    console.log("✓ Notification indexes created");

    // Category indexes
    await createIndexSafely(Category.collection, { name: 1 }, { unique: true });
    console.log("✓ Category indexes created");

    console.log("✅ All database indexes created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
};

createIndexes();
