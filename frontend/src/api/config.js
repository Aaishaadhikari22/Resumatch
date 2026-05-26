// Centralized API/url config for frontend
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_URL = `${API_BASE}/api`;
export const FILE_BASE = API_BASE;

export default {
  API_BASE,
  API_BASE_URL,
  FILE_BASE
};
