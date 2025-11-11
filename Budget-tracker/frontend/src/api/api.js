// src/lib/api.js
import axios from "axios";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE = RAW_API_BASE.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (if you use cookie auth)
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

export default api;
