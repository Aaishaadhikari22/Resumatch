import axios from "axios";
import { getTokenForRequest, clearAuthStorage } from "../utils/auth";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor to add correct token based on request path
API.interceptors.request.use(
  (config) => {
    const token = getTokenForRequest(config.url || "");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();

      const path = window.location.pathname;
      if (path.startsWith("/admin")) {
        window.location.href = "/admin/login";
      } else if (path.startsWith("/employer")) {
        window.location.href = "/employer/login";
      } else {
        window.location.href = "/user/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
