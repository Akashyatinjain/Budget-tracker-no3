// src/lib/api.js
import axios from "axios";
import toast from "react-hot-toast";

const RAW_API_BASE = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE = RAW_API_BASE.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,       // e.g. https://budget-tracker-1-01.onrender.com
  withCredentials: true,   // include cookies (very important for auth)
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
}, (err) => Promise.reject(err));

// Response Interceptor to toast errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || error.response?.data?.error || error.response?.data?.msg || error.message || "An unexpected error occurred";
    toast.error(msg);
    return Promise.reject(error);
  }
);

export default api;
