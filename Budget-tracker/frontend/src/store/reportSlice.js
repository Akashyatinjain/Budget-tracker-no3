// src/store/reportSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// ====== Async Thunks ======

export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/reports");
      const data = res.data.reports || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ====== Slice ======

const reportSlice = createSlice({
  name: "reports",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearReports: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;
