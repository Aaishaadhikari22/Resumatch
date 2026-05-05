import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { validatePassword, PASSWORD_POLICY } from "../utils/passwordValidator.js";

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* =========================
   REGISTER USER (JOB SEEKER)
========================= */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ msg: PASSWORD_POLICY.message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ msg: "User already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser && !existingUser.isEmailVerified) {
       existingUser.password = hashedPassword;
       existingUser.name = name;
       existingUser.otp = otp;
       existingUser.otpExpires = otpExpires;
       user = existingUser;
    } else {
       user = new User({
         name,
         email,
         password: hashedPassword,
         role: "user",
         status: "active",
         otp,
         otpExpires,
         isEmailVerified: false
       });
    }

    await user.save();

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>Thank you for registering on ResuMatch. Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 15px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "ResuMatch - Verification Code",
      html: htmlMessage
    });

    res.status(201).json({
      msg: "OTP sent to your email",
      userId: user._id,
      requireOTP: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   LOGIN USER (JOB SEEKER)
========================= */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }


    // Prevent Admins/Moderators saved in User collection from falling into a dashboard redirect loop
    if (user.role !== "user" && user.role !== "job_seeker") {
       return res.status(403).json({ msg: "This account has an Admin/Employer role. Please use the Employer Login." });
    }

    if (user.status === "suspended" || user.status === "blocked") {
      return res.status(403).json({ msg: "Your account is suspended. Contact support." });
    }

    if (!user.isEmailVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your Email</h2>
          <p>Please complete your registration with this verification code:</p>
          <h1 style="background: #f4f4f4; padding: 15px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
      await sendEmail({
        email: user.email,
        subject: "ResuMatch - Verification Code",
        html: htmlMessage
      });

      return res.status(403).json({ 
        requireOTP: true, 
        userId: user._id, 
        msg: "Please verify your email to login. A new code has been sent." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   VERIFY OTP (JOB SEEKER)
========================= */
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) return res.status(400).json({ msg: "User ID and OTP are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.isEmailVerified) return res.status(400).json({ msg: "Email already verified" });

    if (user.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ msg: "OTP has expired" });

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ msg: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD (JOB SEEKER)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User with this email not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the following OTP to proceed:</p>
        <h1 style="background: #f4f4f4; padding: 15px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: "ResuMatch - Password Reset OTP",
      html: htmlMessage
    });

    res.json({ msg: "Password reset OTP sent to your email", userId: user._id });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   RESET PASSWORD (JOB SEEKER)
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!otp || !newPassword || !email) return res.status(400).json({ msg: "Email, OTP and new password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ msg: "OTP has expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ msg: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
