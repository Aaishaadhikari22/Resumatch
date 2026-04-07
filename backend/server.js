import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import resumeRoutes from "./routes/resume.js";
import categoryRoutes from "./routes/category.js";
import reportRoutes from "./routes/report.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import userFrontendRoutes from "./routes/userFrontendRoutes.js";
import employerAuthRoutes from "./routes/employerAuthRoutes.js";
import employerFrontendRoutes from "./routes/employerFrontendRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";


dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= ROUTES ================= */

// More specific routes MUST come before general routes
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/auth/employer", employerAuthRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/category", categoryRoutes);
app.use("/api/report", reportRoutes);

app.use("/api/user", userFrontendRoutes);
app.use("/api/employer", employerFrontendRoutes);
app.use("/api/notifications", notificationRoutes);

/* ================= DATABASE ================= */

mongoose.connect("mongodb://127.0.0.1:27017/resumatch")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/* ================= TEST ROUTE ================= */

app.get("/", (req,res)=>{
  res.send("ResuMatch backend running");
});

/* ================= SERVER ================= */

const PORT = 5000;

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});