// src/store/subscriptionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// ====== Async Thunks ======

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetchSubscriptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/subscriptions");
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.subscriptions)) return raw.subscriptions;
      if (Array.isArray(raw?.data)) return raw.data;
      if (Array.isArray(raw?.result)) return raw.result;
      if (typeof raw === "object" && raw?.id) return [raw];
      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addSubscription = createAsyncThunk(
  "subscriptions/addSubscription",
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/api/subscriptions", subscriptionData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  "subscriptions/updateSubscription",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/api/subscriptions/${id}`, data);
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteSubscription = createAsyncThunk(
  "subscriptions/deleteSubscription",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/subscriptions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ====== Slice ======

const subscriptionSlice = createSlice({
  name: "subscriptions",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSubscriptions: (state) => {
      state.items = [];
      state.error = null;
    },
    optimisticUpdateStatus: (state, action) => {
      const { id, status } = action.payload;
      const idx = state.items.findIndex((s) => s.id === id);
      if (idx !== -1) state.items[idx].status = status;
    },
    optimisticRemove: (state, action) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (s) => String(s.id) !== String(action.payload)
        );
      });
  },
});

export const { clearSubscriptions, optimisticUpdateStatus, optimisticRemove } =
  subscriptionSlice.actions;
export default subscriptionSlice.reducer;
