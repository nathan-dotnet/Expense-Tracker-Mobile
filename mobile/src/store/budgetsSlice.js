import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { budgetsAPI } from '../services/api';

export const fetchBudgets = createAsyncThunk('budgets/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await budgetsAPI.getAll(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch budgets');
  }
});

export const saveBudget = createAsyncThunk('budgets/save', async (data, { rejectWithValue }) => {
  try {
    const res = await budgetsAPI.create(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to save budget');
  }
});

export const deleteBudget = createAsyncThunk('budgets/delete', async (id, { rejectWithValue }) => {
  try {
    await budgetsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete budget');
  }
});

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState: { items: [], isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => { state.isLoading = true; })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false; state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload;
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        const idx = state.items.findIndex((b) => b.category === action.payload.category);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload, amount: parseFloat(action.payload.amount) };
        else state.items.push({ ...action.payload, amount: parseFloat(action.payload.amount), spent: 0, percentage: 0 });
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export default budgetsSlice.reducer;
