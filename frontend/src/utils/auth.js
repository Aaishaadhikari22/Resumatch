export const AUTH_KEYS = {
  token: "token",
  adminToken: "adminToken",
  employerToken: "employerToken",
  userToken: "userToken",
  adminInfo: "adminInfo",
  employerInfo: "employerInfo",
  userInfo: "userInfo"
};

export const parseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const clearAuthStorage = () => {
  Object.values(AUTH_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const getActiveAuthToken = () => {
  return (
    localStorage.getItem(AUTH_KEYS.adminToken) ||
    localStorage.getItem(AUTH_KEYS.employerToken) ||
    localStorage.getItem(AUTH_KEYS.userToken) ||
    localStorage.getItem(AUTH_KEYS.token)
  );
};

export const getRoleToken = (role) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole.includes("admin")) {
    return localStorage.getItem(AUTH_KEYS.adminToken) || localStorage.getItem(AUTH_KEYS.token);
  }
  if (normalizedRole.includes("employer")) {
    return localStorage.getItem(AUTH_KEYS.employerToken) || localStorage.getItem(AUTH_KEYS.token);
  }
  if (normalizedRole === "user" || normalizedRole === "job_seeker" || normalizedRole === "jobseeker") {
    return localStorage.getItem(AUTH_KEYS.userToken) || localStorage.getItem(AUTH_KEYS.token);
  }
  return localStorage.getItem(AUTH_KEYS.token);
};

export const getAuthInfo = (role) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole.includes("admin")) {
    return parseJSON(localStorage.getItem(AUTH_KEYS.adminInfo));
  }
  if (normalizedRole.includes("employer")) {
    return parseJSON(localStorage.getItem(AUTH_KEYS.employerInfo));
  }
  if (normalizedRole === "user" || normalizedRole === "job_seeker" || normalizedRole === "jobseeker") {
    return parseJSON(localStorage.getItem(AUTH_KEYS.userInfo));
  }
  return null;
};

export const getTokenForRequest = (url = "") => {
  if (typeof url !== "string") return getActiveAuthToken();
  const path = url.toLowerCase();
  if (path.startsWith("/admin")) {
    return getRoleToken("admin");
  }
  if (path.startsWith("/employer")) {
    return getRoleToken("employer");
  }
  if (path.startsWith("/user")) {
    return getRoleToken("user");
  }
  return getActiveAuthToken();
};

export const saveAuth = (role, token, info = null) => {
  clearAuthStorage();
  if (token) {
    localStorage.setItem(AUTH_KEYS.token, token);
  }
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole.includes("admin")) {
    localStorage.setItem(AUTH_KEYS.adminToken, token);
    if (info) localStorage.setItem(AUTH_KEYS.adminInfo, JSON.stringify(info));
  } else if (normalizedRole.includes("employer")) {
    localStorage.setItem(AUTH_KEYS.employerToken, token);
    if (info) localStorage.setItem(AUTH_KEYS.employerInfo, JSON.stringify(info));
  } else {
    localStorage.setItem(AUTH_KEYS.userToken, token);
    if (info) localStorage.setItem(AUTH_KEYS.userInfo, JSON.stringify(info));
  }
};
