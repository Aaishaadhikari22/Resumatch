import axios from "axios";
import { getTokenForRequest, clearAuthStorage } from "../utils/auth";
import { API_BASE_URL } from "./config";
import { dashboardCache, jobsCache, userProfileCache, recommendationsCache } from "./cache";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Cache strategy for different endpoints
const getCacheForEndpoint = (url) => {
  if (url.includes('/dashboard')) return dashboardCache;
  if (url.includes('/jobs') || url.includes('/public/jobs')) return jobsCache;
  if (url.includes('/profile') || url.includes('/resume')) return userProfileCache;
  if (url.includes('/recommendations')) return recommendationsCache;
  return null;
};

// Request interceptor to add correct token based on request path
API.interceptors.request.use(
  (config) => {
    // Check cache for GET requests
    if (config.method === 'get') {
      const cache = getCacheForEndpoint(config.url || "");
      if (cache) {
        const cached = cache.get(config.url);
        if (cached) {
          config.adapter = () => Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK',
            headers: config.headers,
            config,
          });
          return config;
        }
      }
    }

    const token = getTokenForRequest(config.url || "");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors and cache successful responses
API.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cache = getCacheForEndpoint(response.config.url);
      if (cache) {
        cache.set(response.config.url, response.data);
      }
    }

    // Invalidate cache on mutations
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)) {
      dashboardCache.clearAll();
      jobsCache.clearAll();
      recommendationsCache.clearAll();
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();

      const path = window.location.pathname;
      if (path.startsWith("/admin")) {
        window.location.href = "/admin/login";
      } else if (path.startsWith("/employer")) {
        window.location.href = "/employer/login";
      } else {
        window.location.href = "/jobseeker/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
