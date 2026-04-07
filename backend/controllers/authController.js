import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPermissions } from "../utils/permissionHelper.js";

/* =========================
   REGISTER ADMIN
========================= */
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, gender, qualification, phone, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default permissions for the role
    const defaultPermissions = getPermissions(role) || [];

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      gender,
      qualification,
      phone,
      role,
      permissions: defaultPermissions
    });

    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      msg: "Admin registered successfully",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || []
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   LOGIN ADMIN
========================= */
export const loginAdmin = async (req, res) => {
  try {

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Check if they accidentally used User account
      const User = (await import("../models/User.js")).default;
      const isUser = await User.findOne({ email });
      if (isUser) {
        return res.status(400).json({ msg: "This is a Job Seeker account. Please use the Job Seeker Login." });
      }
      return res.status(400).json({ msg: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    // ✅ AUTO-GENERATE PERMISSIONS IF MISSING (for existing admins)
    let permissions = admin.permissions;
    if (!permissions || permissions.length === 0) {
      permissions = getPermissions(admin.role) || [];
      // Update admin in database with permissions
      admin.permissions = permissions;
      await admin.save();
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: permissions
      }
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ msg: "Server error" });

  }
};