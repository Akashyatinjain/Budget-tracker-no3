import axios from "axios";

const API_BASE = (import.meta.env.VITE_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to check token expiration safely client-side
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const decodedJson = JSON.parse(atob(payloadBase64));
    if (!decodedJson.exp) return false;
    // Buffer by 10 seconds
    return Date.now() >= decodedJson.exp * 1000 - 10000;
  } catch (e) {
    return true;
  }
};

// Request Interceptor: Attach bearer token dynamically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
        window.location.href = "/sign-in?expired=true";
        return Promise.reject(new Error("Token expired"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 unauthorization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Avoid redirect loops if already on sign-in or sign-up
      const currentPath = window.location.pathname;
      if (!currentPath.includes("sign-in") && !currentPath.includes("sign-up")) {
        localStorage.removeItem("token");
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
