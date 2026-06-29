// src/store/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// ====== Async Thunks ======

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/notifications");
      const data = res.data.notifications || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/api/notifications/${id}/read`);
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/api/notifications/read-all");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const removeNotification = createAsyncThunk(
  "notifications/removeNotification",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAll",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.delete("/api/notifications");
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  "notifications/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/notifications/settings");
      return res.data.settings || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  "notifications/updateSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/api/notifications/settings", settings);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ====== Slice ======

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    settings: {
      email_notifications: true,
      push_notifications: true,
      billing_reminders: true,
      subscription_alerts: true,
      budget_alerts: true,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
      state.error = null;
    },
    setNotificationItems: (state, action) => {
      state.items = action.payload;
    },
    optimisticMarkRead: (state, action) => {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1) state.items[idx].is_read = true;
    },
    optimisticMarkAllRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, is_read: true }));
    },
    optimisticRemoveNotification: (state, action) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (n) => String(n.id) === String(action.payload.id)
        );
        if (idx !== -1) state.items[idx].is_read = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, is_read: true }));
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (n) => String(n.id) !== String(action.payload)
        );
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.items = [];
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        if (action.payload?.settings) {
          state.settings = { ...state.settings, ...action.payload.settings };
        }
      });
  },
});

export const {
  clearNotifications,
  setNotificationItems,
  optimisticMarkRead,
  optimisticMarkAllRead,
  optimisticRemoveNotification,
} = notificationSlice.actions;
export default notificationSlice.reducer;
