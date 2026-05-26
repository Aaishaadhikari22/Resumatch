import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
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
import { initSocket } from "./utils/socketServer.js";


dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */

// Compression middleware - reduces response size by ~70%
app.use(compression());

// CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache headers for static assets
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads') || req.path.startsWith('/public')) {
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
  }
  next();
});

// Request timeout (prevent hanging requests)
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 min for auth
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/user', authLimiter);
app.use('/api/auth/employer', authLimiter);

/* ================= ROUTES ================= */

// More specific routes MUST come before general routes
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/auth/employer", employerAuthRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);
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

mongoose.connect("mongodb://127.0.0.1:27017/resumatch", {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true
})
.then(() => console.log("MongoDB connected with connection pooling"))
.catch(err => console.log(err));

/* ================= TEST ROUTE ================= */

app.get("/", (req,res)=>{
  res.send("ResuMatch backend running");
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});