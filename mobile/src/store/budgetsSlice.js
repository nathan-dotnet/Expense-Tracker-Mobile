import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as localDb from "../services/localDb";

export const fetchBudgets = createAsyncThunk(
  "budgets/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await localDb.getBudgets(params);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch budgets");
    }
  },
);

export const saveBudget = createAsyncThunk(
  "budgets/save",
  async (data, { rejectWithValue }) => {
    try {
      return await localDb.saveBudget(data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save budget");
    }
  },
);

export const deleteBudget = createAsyncThunk(
  "budgets/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await localDb.deleteBudget(id);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete budget");
    }
  },
);

const budgetsSlice = createSlice({
  name: "budgets",
  initialState: { items: [], isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        const idx = state.items.findIndex((b) => b.category === action.payload.category);
        if (idx !== -1) state.items[idx] = action.payload;
        else state.items.push(action.payload);
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export default budgetsSlice.reducer;
