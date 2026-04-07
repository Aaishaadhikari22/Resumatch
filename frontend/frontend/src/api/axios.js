import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor to add correct token based on request path
API.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");

    // Context-aware token selection
    if (config.url.startsWith("/admin")) {
      token = localStorage.getItem("adminToken") || token;
    } else if (config.url.startsWith("/employer")) {
      token = localStorage.getItem("employerToken") || token;
    } else if (config.url.startsWith("/user")) {
      token = localStorage.getItem("userToken") || token;
    } else {
      // Fallback: try all in order
      token = token || localStorage.getItem("adminToken") || localStorage.getItem("employerToken") || localStorage.getItem("userToken");
    }

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
      // Clear all tokens
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("employerToken");
      localStorage.removeItem("userToken");

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
