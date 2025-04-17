import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import clubsReducer from './clubsSlice';
import type { Action, ThunkAction } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clubs: clubsReducer
  }
})

// Infer the type of `store`
export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore['dispatch']
// Define a reusable type describing thunk functions
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>
