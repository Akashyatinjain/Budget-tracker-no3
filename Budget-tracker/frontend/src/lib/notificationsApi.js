// src/api/notificationsApi.js
import api from "../lib/api";

export const getNotifications = async () => {
  const res = await api.get("/api/notifications");
  return res.data;
};

export const createNotification = async (payload) => {
  const res = await api.post("/api/notifications", payload);
  return res.data;
};

export const markAsRead = async (id) => {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
};

export const markAllRead = async () => {
  const res = await api.put("/api/notifications/read-all");
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await api.delete(`/api/notifications/${id}`);
  return res.data;
};

export const clearNotifications = async () => {
  const res = await api.delete("/api/notifications");
  return res.data;
};

export const getNotificationSettings = async () => {
  const res = await api.get("/api/notifications/settings");
  return res.data;
};

export const updateNotificationSettings = async (settings) => {
  const res = await api.put("/api/notifications/settings", settings);
  return res.data;
};

export default {
  getNotifications,
  createNotification,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearNotifications,
  getNotificationSettings,
  updateNotificationSettings,
};
