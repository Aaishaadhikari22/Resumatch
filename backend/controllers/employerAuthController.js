import Employer from "../models/Employer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { validatePassword, PASSWORD_POLICY } from "../utils/passwordValidator.js";

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* =========================
   REGISTER EMPLOYER
========================= */
export const registerEmployer = async (req, res) => {
  try {
    const { name, companyName, email, password } = req.body;

    if (!name || !companyName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ msg: PASSWORD_POLICY.message });
    }

    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer) {
      if (existingEmployer.isEmailVerified) {
        return res.status(400).json({ msg: "Employer already exists with this email" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let employer;
    if (existingEmployer && !existingEmployer.isEmailVerified) {
       existingEmployer.password = hashedPassword;
       existingEmployer.name = name;
       existingEmployer.companyName = companyName;
       existingEmployer.otp = otp;
       existingEmployer.otpExpires = otpExpires;
       employer = existingEmployer;
    } else {
       employer = new Employer({
         name,
         companyName,
         email,
         password: hashedPassword,
         status: "approved",
         otp,
         otpExpires,
         isEmailVerified: false
       });
    }

    await employer.save();

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify Your Employer Email</h2>
        <p>Thank you for registering your company on ResuMatch. Your verification code is:</p>
        <h1 style="background: #e0f2fe; padding: 15px; display: inline-block; letter-spacing: 5px; color: #0369a1;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: employer.email,
      subject: "ResuMatch - Employer Verification Code",
      html: htmlMessage
    });

    res.status(201).json({
      msg: "OTP sent to your email",
      employerId: employer._id,
      requireOTP: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   LOGIN EMPLOYER
========================= */
export const loginEmployer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employer = await Employer.findOne({ email });

    if (!employer) {
      return res.status(400).json({ msg: "Employer not found" });
    }


    if (!employer.password) {
      return res.status(400).json({ msg: "This account was created before employer login was available. Please contact support." });
    }

    if (employer.status === "rejected") {
      return res.status(403).json({ msg: "Your employer account has been rejected." });
    }

    if (!employer.isEmailVerified) {
      const otp = generateOTP();
      employer.otp = otp;
      employer.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await employer.save();

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your Employer Email</h2>
          <p>Please complete your registration with this verification code:</p>
          <h1 style="background: #e0f2fe; padding: 15px; display: inline-block; letter-spacing: 5px; color: #0369a1;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
      await sendEmail({
        email: employer.email,
        subject: "ResuMatch - Employer Verification Code",
        html: htmlMessage
      });

      return res.status(403).json({ 
        requireOTP: true, 
        employerId: employer._id, 
        msg: "Please verify your email to login. A new code has been sent." 
      });
    }

    const isMatch = await bcrypt.compare(password, employer.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      employer: {
        _id: employer._id,
        name: employer.name,
        companyName: employer.companyName,
        email: employer.email,
        role: employer.role,
        status: employer.status
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   VERIFY OTP (EMPLOYER)
========================= */
export const verifyOTP = async (req, res) => {
  try {
    const { employerId, otp } = req.body;
    
    if (!employerId || !otp) return res.status(400).json({ msg: "Employer ID and OTP are required" });

    const employer = await Employer.findById(employerId);
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (employer.isEmailVerified) return res.status(400).json({ msg: "Email already verified" });

    if (employer.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

    if (new Date() > new Date(employer.otpExpires)) return res.status(400).json({ msg: "OTP has expired" });

    employer.isEmailVerified = true;
    employer.otp = null;
    employer.otpExpires = null;
    await employer.save();

    res.json({ msg: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD (EMPLOYER)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const employer = await Employer.findOne({ email });
    if (!employer) return res.status(404).json({ msg: "Employer with this email not found" });

    const otp = generateOTP();
    employer.otp = otp;
    employer.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await employer.save();

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the following OTP to proceed:</p>
        <h1 style="background: #e0f2fe; padding: 15px; display: inline-block; letter-spacing: 5px; color: #0369a1;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({
      email: employer.email,
      subject: "ResuMatch - Password Reset OTP",
      html: htmlMessage
    });

    res.json({ msg: "Password reset OTP sent to your email", employerId: employer._id });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   RESET PASSWORD (EMPLOYER)
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!otp || !newPassword || !email) return res.status(400).json({ msg: "Email, OTP and new password are required" });

    const employer = await Employer.findOne({ email });
    if (!employer) return res.status(404).json({ msg: "Employer not found" });

    if (employer.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });
    if (new Date() > new Date(employer.otpExpires)) return res.status(400).json({ msg: "OTP has expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employer.password = hashedPassword;
    employer.otp = null;
    employer.otpExpires = null;
    await employer.save();

    res.json({ msg: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
