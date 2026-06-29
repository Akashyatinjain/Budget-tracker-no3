// src/store/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// ====== Async Thunks ======

export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/users/me");
      return res.data.user || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/api/users/profile", profileData);
      return res.data.user || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "user/uploadAvatar",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/api/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ====== Slice ======

const userSlice = createSlice({
  name: "user",
  initialState: {
    profile: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    setUserProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (action.payload?.avatar_url || action.payload?.avatar) {
          if (state.profile) {
            state.profile.avatar_url =
              action.payload.avatar_url || action.payload.avatar;
          }
        }
      });
  },
});

export const { clearUserProfile, setUserProfile } = userSlice.actions;
export default userSlice.reducer;
