import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await authAPI.login({ email, password });
    await SecureStore.setItemAsync('authToken', res.data.token);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(payload);
    await SecureStore.setItemAsync('authToken', res.data.token);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) return rejectWithValue('No token');
    const res = await authAPI.me();
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load user');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync('authToken');
  return null;
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.updateProfile(data);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false; state.isAuthenticated = true; state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false; state.isAuthenticated = true; state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload;
      })
      // Load user (app boot)
      .addCase(loadUser.pending, (state) => { state.isLoading = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false; state.isAuthenticated = true; state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false; state.isAuthenticated = false; state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null; state.isAuthenticated = false;
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
