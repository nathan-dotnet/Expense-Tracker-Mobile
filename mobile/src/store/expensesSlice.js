import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as localDb from "../services/localDb";

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await localDb.getExpenses(params);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch expenses");
    }
  },
);

export const fetchSummary = createAsyncThunk(
  "expenses/fetchSummary",
  async (params, { rejectWithValue }) => {
    try {
      return await localDb.getSummary(params);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch summary");
    }
  },
);

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (data, { rejectWithValue }) => {
    try {
      return await localDb.createExpense(data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create expense");
    }
  },
);

export const updateExpense = createAsyncThunk(
  "expenses/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await localDb.updateExpense(id, data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update expense");
    }
  },
);

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await localDb.deleteExpense(id);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete expense");
    }
  },
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState: {
    items: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    summary: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
  },
  reducers: {
    clearExpenseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state, action) => {
        if (action.meta.arg?.page === 1 || !action.meta.arg?.page) state.isRefreshing = true;
        else state.isLoading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        const { data, pagination } = action.payload;
        state.items = pagination.page === 1 ? data : [...state.items, ...data];
        state.pagination = pagination;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      });
  },
});

export const { clearExpenseError } = expensesSlice.actions;
export default expensesSlice.reducer;
