import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import { getPermissions } from "./utils/permissionHelper.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resumatch");
    console.log("Connected to MongoDB...");

    const email = "test@admin.com";
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      console.log("Admin already exists. Updating...");
      await Admin.findByIdAndDelete(existingAdmin._id);
    }

    const hashedPassword = await bcrypt.hash("password123", 10);
    const permissions = getPermissions("super_admin") || [];

    const admin = new Admin({
      name: "Test Admin",
      email: "test@admin.com",
      password: hashedPassword,
      gender: "Male",
      qualification: "BSc",
      phone: "1234567890",
      role: "super_admin",
      status: "active",
      permissions
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: password123`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
