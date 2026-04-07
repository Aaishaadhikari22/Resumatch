import Employer from "../models/Employer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* =========================
   REGISTER EMPLOYER
========================= */
export const registerEmployer = async (req, res) => {
  try {
    const { name, companyName, email, password } = req.body;

    if (!name || !companyName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer) {
      return res.status(400).json({ msg: "Employer already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employer = new Employer({
      name,
      companyName,
      email,
      password: hashedPassword,
      status: "pending"
    });

    await employer.save();

    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      msg: "Employer registered successfully",
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
