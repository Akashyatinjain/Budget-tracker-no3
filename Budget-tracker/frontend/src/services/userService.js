import apiClient from "./apiClient";

export const userService = {
  getProfile: async () => {
    const res = await apiClient.get("/api/users/me");
    return res.data.user || res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put("/api/users/me", data);
    return res.data;
  },
};

export default userService;
