import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateProfile:    (data) => api.patch('/auth/profile', data),
  changePassword:   (data) => api.post('/auth/change-password', data),
};

// ── Expenses ──────────────────────────────────────────────
export const expensesAPI = {
  getAll:   (params) => api.get('/expenses', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  getById:  (id)    => api.get(`/expenses/${id}`),
  create:   (data)  => api.post('/expenses', data),
  update:   (id, data) => api.put(`/expenses/${id}`, data),
  delete:   (id)    => api.delete(`/expenses/${id}`),
  bulkDelete: (ids) => api.delete('/expenses', { data: { ids } }),
};

// ── Budgets ───────────────────────────────────────────────
export const budgetsAPI = {
  getAll:  (params) => api.get('/budgets', { params }),
  create:  (data)   => api.post('/budgets', data),
  update:  (id, data) => api.put(`/budgets/${id}`, data),
  delete:  (id)     => api.delete(`/budgets/${id}`),
};

// ── Insights ──────────────────────────────────────────────
export const insightsAPI = {
  get:     (params) => api.get('/insights', { params }),
  refresh: (params) => api.get('/insights', { params: { ...params, refresh: 'true' } }),
};

// ── Reports ───────────────────────────────────────────────
export const reportsAPI = {
  monthly: (params) => api.get('/reports/monthly', { params }),
  yearly:  (params) => api.get('/reports/yearly', { params }),
};

// ── Receipts ──────────────────────────────────────────────
export const receiptsAPI = {
  upload: async (uri, expenseId) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match    = /\.(\w+)$/.exec(filename);
    const type     = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('receipt', { uri, name: filename, type });
    if (expenseId) formData.append('expenseId', expenseId);

    return api.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (filename) => api.delete(`/receipts/${filename}`),
};

export default api;
