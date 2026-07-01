// src/store/currencySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

// ====== Async Thunks ======

export const fetchCurrencies = createAsyncThunk(
  "currencies/fetchCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/api/currencies");
      const data = res.data.currencies || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addCurrency = createAsyncThunk(
  "currencies/addCurrency",
  async (currencyData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/api/currencies", currencyData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const setDefaultCurrency = createAsyncThunk(
  "currencies/setDefaultCurrency",
  async (currencyCode, { rejectWithValue }) => {
    try {
      const res = await apiClient.put("/api/currencies/default", {
        currency_code: currencyCode,
      });
      return { currencyCode, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteCurrency = createAsyncThunk(
  "currencies/deleteCurrency",
  async (currencyCode, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/currencies/${currencyCode}`);
      return currencyCode;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ====== Slice ======

const currencySlice = createSlice({
  name: "currencies",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrencies: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (c) =>
            String(c.currency_code || c.code) !== String(action.payload)
        );
      })
      .addCase(addCurrency.fulfilled, (state, action) => {
        const newCurr = action.payload.currency || action.payload;
        if (newCurr) {
          const idx = state.items.findIndex(c => String(c.code || c.currency_code) === String(newCurr.code || newCurr.currency_code));
          if (idx !== -1) {
            state.items[idx] = newCurr;
          } else {
            state.items.push(newCurr);
          }
        }
      })
      .addCase(setDefaultCurrency.fulfilled, (state, action) => {
        const code = String(action.payload.currencyCode || "").toUpperCase();
        state.items = state.items.map(c => ({
          ...c,
          is_default: String(c.code || c.currency_code).toUpperCase() === code
        }));
      });
  },
});

export const { clearCurrencies } = currencySlice.actions;
export default currencySlice.reducer;
