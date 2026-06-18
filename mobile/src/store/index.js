import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import expensesReducer from './expensesSlice';
import budgetsReducer from './budgetsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expensesReducer,
    budgets: budgetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
