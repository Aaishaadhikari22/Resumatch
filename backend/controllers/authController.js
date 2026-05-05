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

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* =========================
   FORGOT PASSWORD (ADMIN)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ msg: "Admin with this email not found" });

    const otp = generateOTP();
    admin.otp = otp;
    admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await admin.save();

    const sendEmail = (await import("../utils/sendEmail.js")).default;
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your Admin password. Use the following OTP to proceed:</p>
        <h1 style="background: #f4f4f4; padding: 15px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: admin.email,
      subject: "ResuMatch - Admin Password Reset",
      html: htmlMessage
    });

    res.json({ msg: "Password reset OTP sent to your email", adminId: admin._id });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   RESET PASSWORD (ADMIN)
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!otp || !newPassword || !email) return res.status(400).json({ msg: "Email, OTP and new password are required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    if (admin.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });
    if (new Date() > new Date(admin.otpExpires)) return res.status(400).json({ msg: "OTP has expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.otp = null;
    admin.otpExpires = null;
    await admin.save();

    res.json({ msg: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};