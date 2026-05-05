import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Employer from "../models/Employer.js";

let io;

const normalizeModel = (model) => {
  if (!model) return "user";
  const lower = model.toLowerCase();
  if (lower.includes("super_admin") || lower.includes("sector_admin") || lower.includes("admin")) return "admin";
  if (lower.includes("employer")) return "employer";
  return "user";
};

const isAccountActive = (account) => {
  if (!account || !account.status) return true;
  const inactiveStates = new Set(["suspended", "blocked", "rejected", "inactive", "pending"]);
  return !inactiveStates.has(String(account.status).trim().toLowerCase());
};

const getAccountByRoleAndId = async (decoded) => {
  const normalizedRole = String(decoded?.role || "").trim().toLowerCase();
  const userId = decoded?.id;
  if (!userId) return null;

  if (["user", "job_seeker", "jobseeker", "candidate", "member", "applicant"].includes(normalizedRole)) {
    return await User.findById(userId);
  }

  if (["employer", "company", "company_representative", "employer_manager"].includes(normalizedRole)) {
    return await Employer.findById(userId);
  }

  if (["super_admin", "superadmin", "sector_admin", "sectoradmin", "admin"].includes(normalizedRole)) {
    return await Admin.findById(userId);
  }

  // Fallback for any unknown role values
  return (await User.findById(userId)) || (await Admin.findById(userId)) || (await Employer.findById(userId));
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", async (socket) => {
    try {
      const authHeader = socket.handshake.headers?.authorization || "";
      const token = socket.handshake.auth?.token || (authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const account = await getAccountByRoleAndId(decoded);
      if (!account || !isAccountActive(account)) {
        socket.disconnect(true);
        return;
      }

      const roomRole = normalizeModel(decoded.role);
      const roomName = `${roomRole}:${decoded.id}`;

      socket.join(roomName);
      if (roomRole === "admin") {
        socket.join("admin:all");
      }

      socket.emit("socket:connected", { success: true, role: roomRole, id: decoded.id });
    } catch (err) {
      socket.disconnect(true);
    }
  });

  return io;
};

export const emitNotification = (recipientId, onModel, notification) => {
  if (!io) return;
  const roomRole = normalizeModel(onModel);
  io.to(`${roomRole}:${recipientId}`).emit("notification:new", notification);
};

export const emitDashboardRefreshToUser = (userId) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("dashboard:refresh");
};

export const emitDashboardRefreshToEmployer = (employerId) => {
  if (!io) return;
  io.to(`employer:${employerId}`).emit("dashboard:refresh");
};

export const emitDashboardRefreshToAdmins = () => {
  if (!io) return;
  io.to("admin:all").emit("dashboard:refresh");
};
