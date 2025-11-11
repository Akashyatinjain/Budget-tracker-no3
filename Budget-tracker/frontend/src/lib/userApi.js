import axios from "./api.js";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Get logged-in user
export const getUser = () => api.get("/api/users/me");

// Update user data
export const updateUser = (data) => api.put("/api/users/me", data);
